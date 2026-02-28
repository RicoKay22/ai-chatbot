// Chat history, localStorage, model switching

console.log('RicoAI chat.js loaded');

// Chat history management
let chatHistory = [];
let allChats = [];
let currentChatId = null;

// add message to history
function addToHistory(role, content) {
  chatHistory.push({ role, content });
}

// get current chat history
function getChatHistory() {
  return chatHistory;
}

// clear current chat history (but not all chats)
function clearChatHistory() {
  chatHistory = [];
  currentChatId = null;
}

// generates unique chat ID based on timestamp
function generateChatId() {
  return 'chat_' + Date.now();
}

// save current chat to localStorage (called after every new message)
function saveCurrentChat() {
  if (chatHistory.length === 0) return;

  // Create new chat entry if none exists
  if (!currentChatId) {
    currentChatId = generateChatId();
  }

  // Use first user message as chat title
  const firstUserMsg = chatHistory.find(m => m.role === 'user');
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')
    : 'New Chat';

  const chatData = {
    id: currentChatId,
    title,
    history: chatHistory,
    timestamp: Date.now()
  };

  // Save to allChats array
  const existingIndex = allChats.findIndex(c => c.id === currentChatId);
  if (existingIndex >= 0) {
    allChats[existingIndex] = chatData;
  } else {
    allChats.unshift(chatData); // Add to beginning
  }

  // Keep only last 20 chats
  if (allChats.length > 20) allChats = allChats.slice(0, 20);

  // Save to localStorage
  localStorage.setItem('rico-chats', JSON.stringify(allChats));

  // Update sidebar
  renderChatHistory();
}

// load all chats from localStorage on startup
function loadAllChats() {
  const saved = localStorage.getItem('rico-chats');
  if (saved) {
    try {
      allChats = JSON.parse(saved);
      renderChatHistory();
    } catch (e) {
      allChats = [];
    }
  }
}

// render chat history in sidebar
function renderChatHistory() {
  const historyList = document.getElementById('chatHistoryList');
  if (!historyList) return;

  historyList.innerHTML = '';

  if (allChats.length === 0) {
    historyList.innerHTML = '<p style="color:var(--text-muted);font-size:12px;padding:12px;text-align:center;">No chat history yet</p>';
    return;
  }

  allChats.forEach(chat => {
    const item = document.createElement('div');
    item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;

    // Chat title
    const title = document.createElement('span');
    title.className = 'history-title';
    title.textContent = chat.title;
    title.title = chat.title;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'history-delete-btn';
    deleteBtn.textContent = '🗑';
    deleteBtn.title = 'Delete this chat';

    // Delete click — stop propagation so it doesn't load the chat
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirm(chat.id, chat.title, item);
    });

    // Load chat on item click
    item.addEventListener('click', () => loadChat(chat.id));

    item.appendChild(title);
    item.appendChild(deleteBtn);
    historyList.appendChild(item);
  });
}

// delete confirmation 
function showDeleteConfirm(chatId, chatTitle, itemElement) {
  // Replace the item temporarily with a confirm UI
  const originalContent = itemElement.innerHTML;

  itemElement.innerHTML = '';
  itemElement.style.flexDirection = 'column';
  itemElement.style.gap = '6px';
  itemElement.style.height = 'auto';
  itemElement.style.padding = '8px 12px';

  const question = document.createElement('span');
  question.style.fontSize = '12px';
  question.style.color = 'var(--text-primary)';
  question.textContent = 'Delete this chat?';

  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '6px';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Delete';
  confirmBtn.style.cssText = `
    flex: 1;
    padding: 4px 8px;
    background: #e06c75;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
  `;

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    flex: 1;
    padding: 4px 8px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
  `;

  // Confirm delete
  confirmBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteChat(chatId);
    // If deleting current chat, clear the chat window
    if (chatId === currentChatId) {
      const chatWindow = document.getElementById('chatWindow');
      if (chatWindow) {
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
      }
    }
    if (typeof showToast === 'function') showToast('Chat deleted');
  });

  // Cancel — restore original
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    itemElement.style.flexDirection = '';
    itemElement.style.gap = '';
    itemElement.style.height = '';
    itemElement.style.padding = '';
    itemElement.innerHTML = originalContent;
    // Re-attach click to load chat
    itemElement.addEventListener('click', () => loadChat(chatId));
  });

  btnRow.appendChild(confirmBtn);
  btnRow.appendChild(cancelBtn);
  itemElement.appendChild(question);
  itemElement.appendChild(btnRow);
}

// loads previously saved chat into the chat window
function loadChat(chatId) {
  const chat = allChats.find(c => c.id === chatId);
  if (!chat) return;

  // Set current chat
  currentChatId = chatId;
  chatHistory = [...chat.history];

  // Clear chat window
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.innerHTML = '';

  // Hide welcome screen
  const welcome = document.getElementById('welcomeScreen');
  if (welcome) welcome.style.display = 'none';

  // Re-render all messages
  chat.history.forEach(msg => {
    if (msg.role === 'user') {
      renderMessage('user', msg.content);
    } else if (msg.role === 'assistant') {
      renderMessage('ai', msg.content);
    }
  });

  // Update active state in sidebar
  renderChatHistory();

  // Close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// delete a chat from allChats and localStorage
function deleteChat(chatId) {
  allChats = allChats.filter(c => c.id !== chatId);
  localStorage.setItem('rico-chats', JSON.stringify(allChats));

  if (currentChatId === chatId) {
    clearChatHistory();
  }

  renderChatHistory();
}

// INIT - Load chats on startup 
loadAllChats();