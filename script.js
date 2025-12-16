// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const themeToggle = document.getElementById('themeToggle');
const clearChat = document.getElementById('clearChat');
const voiceBtn = document.getElementById('voiceBtn');
const promptBtns = document.querySelectorAll('.prompt-btn');
const chatHistory = document.getElementById('chatHistory');
const newChatBtn = document.querySelector('.new-chat-btn');

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i> ${isDark ? 'Light' : 'Dark'}`;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
}

// Add Message
function addMessage(content, isUser = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isUser) {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
                <p class="message-timestamp">${timestamp}</p>
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${content}</p>
                <div class="message-actions">
                    <button class="action-btn" onclick="copyToClipboard(this)"><i class="fas fa-copy"></i> Copy</button>
                    <button class="action-btn"><i class="fas fa-thumbs-up"></i> Like</button>
                    <button class="action-btn"><i class="fas fa-thumbs-down"></i> Dislike</button>
                </div>
                <p class="message-timestamp">${timestamp}</p>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Copy to Clipboard
window.copyToClipboard = function(button) {
    const messageText = button.closest('.message-content').querySelector('p').textContent;
    navigator.clipboard.writeText(messageText).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.style.background = 'var(--accent-green)';
        button.style.color = 'white';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
            button.style.color = '';
        }, 2000);
    });
};

// AI Response Simulation
function simulateAIResponse(userMessage) {
    const responses = [
        "I understand you're asking about that. Based on my knowledge, here's what I can share...",
        "That's an interesting question! Let me break it down for you...",
        "Great question! Here's a detailed explanation...",
        "I've analyzed your query and here are my thoughts...",
        "Based on the latest information available, here's what I found..."
    ];
    
    setTimeout(() => {
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(`${randomResponse}\n\n**Response to:** "${userMessage}"`, false);
    }, 1000);
}

// Send Message
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    messageInput.value = '';
    simulateAIResponse(message);
});

// Enter Key Support
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// Clear Chat
clearChat.addEventListener('click', () => {
    if (confirm("Clear all messages?")) {
        messagesContainer.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <h3>Hello! I'm your Nexus AI assistant. How can I help you today?</h3>
                    <p class="message-timestamp">Just now</p>
                </div>
            </div>
        `;
    }
});

// Quick Prompts
promptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        messageInput.value = btn.getAttribute('data-prompt');
        messageInput.focus();
    });
});

// New Chat
newChatBtn.addEventListener('click', () => {
    if (confirm("Start new chat?")) {
        messagesContainer.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <h3>Hello! I'm your Nexus AI assistant. How can I help you today?</h3>
                    <p class="message-timestamp">Just now</p>
                </div>
            </div>
        `;
        document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
    }
});

// Voice Input Simulation
voiceBtn.addEventListener('click', () => {
    const commands = [
        "What is artificial intelligence?",
        "Explain neural networks",
        "How to learn programming?",
        "Create a website design",
        "Tell me about machine learning"
    ];
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    messageInput.value = randomCommand;
    addMessage("🎤 Voice command detected: " + randomCommand, false);
});

// Chat History
document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        addMessage(`Loading conversation: ${this.textContent}`, false);
    });
});

// Tool Switching
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const toolName = this.querySelector('span').textContent;
        addMessage(`Switching to ${toolName} tool...`, false);
    });
});
