// ====================
// CONFIGURATION
// ====================
const CONFIG = {
    // 👇 REPLACE WITH YOUR OPENAI API KEY
    OPENAI_API_KEY: 'sk-...', // Get from platform.openai.com
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};

// ====================
// DOM ELEMENTS
// ====================
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const themeToggle = document.getElementById('themeToggle');
const clearChat = document.getElementById('clearChat');
const voiceBtn = document.getElementById('voiceBtn');
const promptBtns = document.querySelectorAll('.prompt-btn');
const chatHistory = document.getElementById('chatHistory');
const newChatBtn = document.querySelector('.new-chat-btn');
const apiStatus = document.getElementById('apiStatus') || createApiStatus();

// ====================
// STATE MANAGEMENT
// ====================
let conversationHistory = [
    { role: "system", content: "You are Nexus AI, a helpful AI assistant. Be concise, friendly, and professional." }
];

// ====================
// THEME MANAGEMENT
// ====================
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

// ====================
// MESSAGE MANAGEMENT
// ====================
function addMessage(content, isUser = true, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'} ${isLoading ? 'loading-message' : ''}`;
    
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
    } else if (isLoading) {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p class="message-timestamp">Thinking...</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${formatMessage(content)}</p>
                <div class="message-actions">
                    <button class="action-btn" onclick="copyToClipboard(this)"><i class="fas fa-copy"></i> Copy</button>
                    <button class="action-btn" onclick="regenerateResponse(this)"><i class="fas fa-redo"></i> Regenerate</button>
                    <button class="action-btn" onclick="likeMessage(this)"><i class="fas fa-thumbs-up"></i> Like</button>
                </div>
                <p class="message-timestamp">${timestamp}</p>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

function formatMessage(text) {
    // Format code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    // Format bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Format lists
    text = text.replace(/^\s*[\-\*]\s+(.+)$/gm, '<li>$1</li>');
    // Format paragraphs
    text = text.split('\n\n').map(p => `<p>${p}</p>`).join('');
    return text;
}

// ====================
// OPENAI API INTEGRATION
// ====================
async function getAIResponse(userMessage) {
    try {
        // Add user message to history
        conversationHistory.push({ role: "user", content: userMessage });
        
        // Show loading indicator
        const loadingMessage = addMessage('', false, true);
        
        // Make API call
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: conversationHistory,
                max_tokens: CONFIG.MAX_TOKENS,
                temperature: CONFIG.TEMPERATURE,
                stream: false
            })
        });
        
        // Remove loading indicator
        loadingMessage.remove();
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Add AI response to history
        conversationHistory.push({ role: "assistant", content: aiResponse });
        
        // Display response
        addMessage(aiResponse, false);
        
        // Update usage stats
        updateUsageStats(data.usage);
        
    } catch (error) {
        console.error('AI Error:', error);
        addMessage(`Sorry, I encountered an error: ${error.message}. Please try again.`, false);
    }
}

// ====================
// SEND MESSAGE
// ====================
sendBtn.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Clear input
    messageInput.value = '';
    
    // Add user message to UI
    addMessage(message, true);
    
    // Get AI response
    await getAIResponse(message);
});

// Enter key support
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// ====================
// QUICK PROMPTS
// ====================
promptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        messageInput.value = btn.getAttribute('data-prompt');
        messageInput.focus();
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    });
});

// ====================
// VOICE INPUT
// ====================
voiceBtn.addEventListener('click', () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        recognition.start();
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        voiceBtn.style.background = 'var(--accent-red)';
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            messageInput.value = transcript;
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.background = '';
        };
        
        recognition.onerror = () => {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.background = '';
        };
    } else {
        addMessage("Speech recognition not supported in your browser.", false);
    }
});

// ====================
// CHAT MANAGEMENT
// ====================
clearChat.addEventListener('click', () => {
    if (confirm("Clear all messages and start new conversation?")) {
        conversationHistory = [
            { role: "system", content: "You are Nexus AI, a helpful AI assistant. Be concise, friendly, and professional." }
        ];
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

newChatBtn.addEventListener('click', () => {
    if (confirm("Start new conversation?")) {
        conversationHistory = [
            { role: "system", content: "You are Nexus AI, a helpful AI assistant. Be concise, friendly, and professional." }
        ];
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

// ====================
// MESSAGE ACTIONS
// ====================
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

window.regenerateResponse = async function(button) {
    if (conversationHistory.length > 1) {
        // Remove last AI response
        conversationHistory.pop();
        const lastUserMessage = conversationHistory.pop().content;
        
        // Remove the displayed message
        button.closest('.message').remove();
        
        // Regenerate response
        await getAIResponse(lastUserMessage);
    }
};

window.likeMessage = function(button) {
    button.innerHTML = '<i class="fas fa-heart"></i> Liked!';
    button.style.background = 'var(--accent-red)';
    button.style.color = 'white';
    button.disabled = true;
};

// ====================
// USAGE STATS
// ====================
function updateUsageStats(usage) {
    const tokensUsed = document.querySelector('.stat-item:nth-child(2) strong');
    const messages = document.querySelector('.stat-item:nth-child(1) strong');
    
    if (tokensUsed) {
        const currentTokens = parseInt(tokensUsed.textContent.replace(/,/g, '')) || 0;
        tokensUsed.textContent = (currentTokens + usage.total_tokens).toLocaleString();
    }
    
    if (messages) {
        const currentMessages = parseInt(messages.textContent) || 0;
        messages.textContent = currentMessages + 1;
    }
}

// ====================
// API STATUS INDICATOR
// ====================
function createApiStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'apiStatus';
    statusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 8px 16px;
        background: var(--accent-green);
        color: white;
        border-radius: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        box-shadow: var(--shadow-md);
    `;
    statusDiv.innerHTML = `<i class="fas fa-plug"></i> API Connected`;
    document.body.appendChild(statusDiv);
    return statusDiv;
}

// ====================
// TOOL SWITCHING
// ====================
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const toolName = this.querySelector('span').textContent;
        addMessage(`Switching to ${toolName} mode...`, false);
    });
});

// ====================
// INITIALIZATION
// ====================
// Check API key
if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY === 'sk-...') {
    addMessage("⚠️ Please add your OpenAI API key in the CONFIG section to enable real AI responses.", false);
    apiStatus.style.background = 'var(--accent-red)';
    apiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> API Key Needed';
}

// Initialize textarea height
messageInput.style.height = 'auto';
messageInput.style.height = (messageInput.scrollHeight) + 'px';
