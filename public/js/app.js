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

// ===== DOCUMENT UPLOAD =====
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const fileBadge = document.getElementById('fileBadge');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const fileClearBtn = document.getElementById('fileClearBtn');

let uploadedDocumentText = null;
let uploadedFileName = null;

// Click paperclip to open file picker
uploadBtn.addEventListener('click', () => fileInput.click());

// Handle file selection
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) processFile(file);
});

// Clear document
fileClearBtn.addEventListener('click', () => {
  uploadedDocumentText = null;
  uploadedFileName = null;
  fileInput.value = '';
  fileBadge.style.display = 'none';
  showToast('Document removed');
});

// Drag and drop on chat window
chatWindow.addEventListener('dragover', (e) => {
  e.preventDefault();
  chatWindow.classList.add('drag-over');
});

chatWindow.addEventListener('dragleave', () => {
  chatWindow.classList.remove('drag-over');
});

chatWindow.addEventListener('drop', (e) => {
  e.preventDefault();
  chatWindow.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

// Process the uploaded file
async function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const maxSize = 5 * 1024 * 1024; // 5MB limit

  if (file.size > maxSize) {
    showToast('File too large. Maximum size is 5MB.');
    return;
  }

  showToast('Reading document...');

  try {
    let text = '';

    if (ext === 'txt') {
      text = await file.text();
    } else if (ext === 'pdf') {
      text = await extractPdfText(file);
    } else if (ext === 'docx') {
      text = await extractDocxText(file);
    } else {
      showToast('Unsupported file type. Use PDF, DOCX or TXT.');
      return;
    }

    if (!text || text.trim().length < 10) {
      showToast('Could not extract text from this file.');
      return;
    }

    // Limit to ~3000 words to stay within token limits
    const words = text.trim().split(/\s+/);
    if (words.length > 3000) {
      text = words.slice(0, 3000).join(' ') + '\n\n[Document truncated to 3000 words due to token limits]';
      showToast('Document loaded! (Truncated to 3000 words)');
    } else {
      showToast(`Document loaded! (${words.length} words)`);
    }

    uploadedDocumentText = text;
    uploadedFileName = file.name;
    fileNameDisplay.textContent = `📄 ${file.name}`;
    fileBadge.style.display = 'flex';

  } catch (err) {
    console.error('File processing error:', err);
    showToast('Error reading file. Please try another.');
  }
}

// Extract text from PDF using PDF.js
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

// Extract text from DOCX using Mammoth.js
async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

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
  bubble.innerHTML = marked.parse(content);
    bubble.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  } else {
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
 
  userInput.value = '';
  userInput.style.height = 'auto';

   isLoading = true;
  sendBtn.disabled = true;

renderMessage('user', content);
  addToHistory('user', content);  showTypingIndicator();

  try {
    // Build system prompt - include document if uploaded
    let systemContent = currentSystemPrompt;
    if (uploadedDocumentText) {
      systemContent += `\n\nThe user has uploaded a document called "${uploadedFileName}". Use this as context to answer their questions:\n\n---\n${uploadedDocumentText}\n---`;
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...getChatHistory()
    ];

    const selectedModel = modelSelect.value;

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

  renderMessage('ai', data.message);

    // Update dropdown to show which model actually responded
    if (data.model && data.model !== modelSelect.value) {
      modelSelect.value = data.model;
      showToast(`Switched to ${data.model.split('/')[1] || data.model}`);
    }

  addToHistory('assistant', data.message);
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

// send on enter (Shift+Enter for new line)
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
  uploadedDocumentText = null;
  uploadedFileName = null;
  fileInput.value = '';
  fileBadge.style.display = 'none';
  chatWindow.innerHTML = '';
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