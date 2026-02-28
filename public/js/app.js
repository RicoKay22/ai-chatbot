// app.js - Main application logic

console.log('RicoAI app.js loaded');




// state variables
let isLoading = false;
let currentSystemPrompt = `You are RicoAI, a helpful, smart, and concise AI assistant. 
You can help with anything from coding to creative writing to research.`;

// dom elements
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatWindow = document.getElementById('chatWindow');
const welcomeScreen = document.getElementById('welcomeScreen');
const themeToggle = document.getElementById('themeToggle');
const modelSelect = document.getElementById('modelSelect');
const newChatBtn = document.getElementById('newChatBtn');
const settingsBtn = document.getElementById('settingsBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const saveSettings = document.getElementById('saveSettings');
const systemPromptInput = document.getElementById('systemPrompt');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

// theme toggle
themeToggle.addEventListener('change', () => {
  const theme = themeToggle.checked ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.background = theme === 'dark' ? '#212121' : '#e8e8f0';
  localStorage.setItem('rico-theme', theme);
});

// Load saved theme on startup
const savedTheme = localStorage.getItem('rico-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
document.documentElement.style.background = savedTheme === 'dark' ? '#212121' : '#e8e8f0';
themeToggle.checked = savedTheme === 'dark';

// mobile sidebar toggle
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  // Create overlay if it doesn't exist
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
  overlay.classList.toggle('open');
});

// settings modal
settingsBtn.addEventListener('click', () => {
  systemPromptInput.value = currentSystemPrompt;
  modalOverlay.classList.add('open');
});

modalClose.addEventListener('click', () => {
  modalOverlay.classList.remove('open');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('open');
});

saveSettings.addEventListener('click', () => {
  currentSystemPrompt = systemPromptInput.value.trim() || currentSystemPrompt;
  modalOverlay.classList.remove('open');
  showToast('Settings saved!');
});

// toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// get current time for message timestamps
function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// hide welcome screen message
function hideWelcome() {
  if (welcomeScreen) {
    welcomeScreen.style.display = 'none';
  }
}

// render a message bubble 
function renderMessage(role, content) {
  hideWelcome();

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  if (role === 'ai') {
    const senderLabel = document.createElement('div');
    senderLabel.className = 'sender-label';
    senderLabel.textContent = 'RicoAI';
    messageDiv.appendChild(senderLabel);
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (role === 'ai') {
    // Render markdown for AI responses
    bubble.innerHTML = marked.parse(content);
    // Syntax highlight code blocks
    bubble.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  } else {
    // Plain text for user messages
    bubble.textContent = content;
  }

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = getTimestamp();

  messageDiv.appendChild(bubble);
  messageDiv.appendChild(meta);
  chatWindow.appendChild(messageDiv);

  scrollToBottom();
  return messageDiv;
}

// error message bubble
function renderError(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ai';

  const bubble = document.createElement('div');
  bubble.className = 'bubble error-bubble';
  bubble.textContent = `⚠ ${message}`;

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = getTimestamp();

  messageDiv.appendChild(bubble);
  messageDiv.appendChild(meta);
  chatWindow.appendChild(messageDiv);
  scrollToBottom();
}

// shows typing indicator
function showTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.className = 'message ai';
  wrapper.id = 'typingIndicator';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';

  wrapper.appendChild(indicator);
  chatWindow.appendChild(wrapper);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

// scroll chat to bottom
function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// send message to serverless function and handle response
async function sendMessage() {
  const content = userInput.value.trim();
  if (!content || isLoading) return;

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';

  // Disable send button
  isLoading = true;
  sendBtn.disabled = true;

  // Render user message
  renderMessage('user', content);

  // Add to chat history
  addToHistory('user', content);

  // Show typing indicator
  showTypingIndicator();

  try {
    // Build messages array with system prompt
    const messages = [
      { role: 'system', content: currentSystemPrompt },
      ...getChatHistory()
    ];

    const selectedModel = modelSelect.value;

    // Call our serverless function
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages,
        model: selectedModel
      })
    });

    const data = await response.json();

    removeTypingIndicator();

    if (!response.ok) {
      renderError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    // Render AI response
    renderMessage('ai', data.message);

    // Update dropdown to show which model actually responded
    if (data.model && data.model !== modelSelect.value) {
      modelSelect.value = data.model;
      showToast(`Switched to ${data.model.split('/')[1] || data.model}`);
    }

    // Add AI response to history
    addToHistory('assistant', data.message);

    // Save chat to localStorage
    saveCurrentChat();

  } catch (error) {
    removeTypingIndicator();
    renderError('Network error. Please check your connection and try again.');
    console.error('Fetch error:', error);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// event listener for send button
sendBtn.addEventListener('click', sendMessage);

// send on enter(Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// auto-resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
});

// suggestion chip click handler
function useChip(btn) {
  userInput.value = btn.textContent;
  sendMessage();
}

// new chat button - clear history and show welcome screen
newChatBtn.addEventListener('click', () => {
  clearChatHistory();
  chatWindow.innerHTML = '';
  // Restore welcome screen
  const welcome = document.createElement('div');
  welcome.className = 'welcome-screen';
  welcome.id = 'welcomeScreen';
  welcome.innerHTML = `
    <div class="welcome-icon">✦</div>
    <h1>Welcome to RicoAI</h1>
    <p>Your intelligent assistant powered by real AI models. Ask me anything.</p>
    <div class="suggestion-chips">
      <button class="chip" onclick="useChip(this)">Explain quantum computing</button>
      <button class="chip" onclick="useChip(this)">Write me a Python function</button>
      <button class="chip" onclick="useChip(this)">What's the latest in AI?</button>
      <button class="chip" onclick="useChip(this)">Help me with my essay</button>
    </div>
  `;
  chatWindow.appendChild(welcome);
});

// INIT
console.log('RicoAI app.js fully loaded');