/**
 * Test Application with tldraw
 * Coordinates Matrix chat, tldraw whiteboard, SageMath, and LLM controller
 */

// Initialize components
let tldrawEditor;
let tldrawController;
let matrixClient;
let sageIntegration;

// Matrix room configuration
const MATRIX_ROOM_ID = '!math:matrix.inquiry.institute';
const MATRIX_SERVER = 'https://matrix.inquiry.institute';
const DEFAULT_TEST_USERNAME = '@custodian:matrix.inquiry.institute';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize tldraw
    initializeTldraw();
    
    // Initialize SageMath
    sageIntegration = new SageIntegration();
    
    // Setup Matrix connection
    setupMatrixConnection();
    
    // Setup chat input
    setupChatInput();
    
    // Setup clear button
    document.getElementById('clear-tldraw-btn').addEventListener('click', () => {
        if (confirm('Clear the entire whiteboard?')) {
            tldrawController.clear();
        }
    });

    // Setup export button
    document.getElementById('export-btn').addEventListener('click', () => {
        const shapes = tldrawEditor.getCurrentPageShapes();
        const data = JSON.stringify(shapes, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'whiteboard-export.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function initializeTldraw() {
    const container = document.getElementById('tldraw-canvas');
    
    // Create tldraw editor
    const { editor, store } = new TldrawEditor({
        container,
        defaultName: 'Math Whiteboard',
        persistenceKey: 'math-whiteboard',
    });

    tldrawEditor = editor;
    
    // Initialize tldraw controller
    tldrawController = new TldrawController(editor);
    
    console.log('tldraw initialized');
}

function setupMatrixConnection() {
    const connectBtn = document.getElementById('connect-btn');
    const statusEl = document.getElementById('matrix-status');
    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('matrix-username');
    const passwordInput = document.getElementById('matrix-password');
    const authConnectBtn = document.getElementById('auth-connect-btn');
    const authCancelBtn = document.getElementById('auth-cancel-btn');
    
    connectBtn.addEventListener('click', () => {
        if (matrixClient && matrixClient.isConnected) {
            matrixClient.disconnect();
            connectBtn.textContent = 'Connect';
            statusEl.textContent = 'Disconnected';
            statusEl.className = 'status-indicator disconnected';
            authForm.style.display = 'none';
        } else {
            authForm.style.display = 'block';
            const savedUsername = localStorage.getItem('matrix_test_username');
            const savedPassword = localStorage.getItem('matrix_test_password');
            usernameInput.value = savedUsername || DEFAULT_TEST_USERNAME;
            if (savedPassword) {
                passwordInput.value = savedPassword;
                passwordInput.focus();
            } else {
                passwordInput.focus();
            }
        }
    });
    
    authCancelBtn.addEventListener('click', () => {
        authForm.style.display = 'none';
    });
    
    authConnectBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }
        
        localStorage.setItem('matrix_test_username', username);
        localStorage.setItem('matrix_test_password', password);
        
        try {
            connectBtn.textContent = 'Connecting...';
            statusEl.textContent = 'Connecting...';
            authForm.style.display = 'none';
            
            matrixClient = new MatrixClient(MATRIX_ROOM_ID, MATRIX_SERVER);
            
            try {
                await matrixClient.connect(username, password);
                console.log('Connected with credentials');
            } catch (authError) {
                console.warn('Auth failed, trying guest mode:', authError);
                await matrixClient.connectAsGuest();
            }
            
            matrixClient.onMessage(async (message) => {
                displayMessage(message);
                
                // Process as command
                const result = await processLLMCommand(message.content);
                if (result && result.success) {
                    if (result.message) {
                        addSystemMessage(result.message);
                    }
                } else if (result && !result.success) {
                    addSystemMessage(`Error: ${result.error || 'Command failed'}`);
                }
            });
            
            connectBtn.textContent = 'Disconnect';
            statusEl.textContent = 'Connected';
            statusEl.className = 'status-indicator connected';
        } catch (error) {
            console.error('Failed to connect to Matrix:', error);
            connectBtn.textContent = 'Connect';
            statusEl.textContent = 'Connection Failed';
            statusEl.className = 'status-indicator disconnected';
            authForm.style.display = 'block';
            alert('Failed to connect to Matrix room: ' + error.message);
        }
    });
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            authConnectBtn.click();
        }
    });
}

function setupChatInput() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        chatInput.value = '';
        
        displayMessage({
            sender: 'You',
            content: message,
            timestamp: Date.now(),
        });
        
        if (matrixClient && matrixClient.isConnected) {
            try {
                await matrixClient.sendMessage(message);
            } catch (error) {
                console.error('Failed to send message:', error);
                addSystemMessage('Failed to send message to Matrix.');
            }
        }
        
        // Process as command
        const result = await processLLMCommand(message);
        if (result) {
            if (result.success) {
                if (result.result) {
                    addSystemMessage(`Computation result: ${result.result}`);
                } else if (result.message) {
                    addSystemMessage(result.message);
                }
            } else {
                addSystemMessage(`Error: ${result.error || 'Command failed'}`);
            }
        }
    };
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

async function processLLMCommand(message) {
    const lower = message.toLowerCase().trim();
    
    // Check if it's a drawing command
    const drawingKeywords = ['draw', 'create', 'make', 'add', 'show', 'display', 'plot', 'graph', 'sketch'];
    if (drawingKeywords.some(keyword => lower.includes(keyword))) {
        try {
            tldrawController.drawFromLLM(message);
            return { success: true, message: 'Drawing command executed' };
        } catch (error) {
            console.error('handleDrawingCommand error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Check if it's a computation command
    const computationKeywords = ['calculate', 'compute', 'solve', 'find', 'what is', 'derivative', 'integral', 'area', 'perimeter'];
    if (computationKeywords.some(keyword => lower.includes(keyword))) {
        // Could integrate with SageMath here
        return { success: false, error: 'Computation commands not yet implemented in test page' };
    }
    
    return null;
}

function displayMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    if (message.sender === 'You') {
        messageEl.classList.add('sender');
    }
    
    const senderName = document.createElement('div');
    senderName.className = 'sender-name';
    senderName.textContent = message.sender;
    messageEl.appendChild(senderName);
    
    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = message.content;
    messageEl.appendChild(content);
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
    messageEl.appendChild(timestamp);
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text) {
    displayMessage({
        sender: 'System',
        content: text,
        timestamp: Date.now(),
    });
}
