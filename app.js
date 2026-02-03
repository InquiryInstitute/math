/**
 * Main Application
 * Coordinates Matrix chat, blackboard, SageMath, and LLM controller
 */

// Initialize components
let blackboard;
let matrixClient;
let sageIntegration;
let llmController;

// Matrix room configuration
const MATRIX_ROOM_ID = '!math:matrix.inquiry.institute'; // Update with actual room ID
const MATRIX_SERVER = 'https://matrix.inquiry.institute';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize blackboard
    blackboard = new Blackboard('blackboard');
    
    // Initialize SageMath
    sageIntegration = new SageIntegration();
    
    // Initialize LLM controller
    llmController = new LLMController(blackboard, sageIntegration);
    
    // Setup tool buttons
    setupToolButtons();
    
    // Setup Matrix connection
    setupMatrixConnection();
    
    // Setup chat input
    setupChatInput();
    
    // Setup clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
        if (confirm('Clear the entire blackboard?')) {
            blackboard.clear();
        }
    });
}

function setupToolButtons() {
    const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            toolButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Set tool
            const tool = btn.getAttribute('data-tool');
            blackboard.setTool(tool);
        });
    });
}

function setupMatrixConnection() {
    const connectBtn = document.getElementById('connect-btn');
    const statusEl = document.getElementById('matrix-status');
    
    connectBtn.addEventListener('click', async () => {
        if (matrixClient && matrixClient.isConnected) {
            // Disconnect
            matrixClient.disconnect();
            connectBtn.textContent = 'Connect';
            statusEl.textContent = 'Disconnected';
            statusEl.className = 'status-indicator disconnected';
        } else {
            // Prompt for username and password
            const username = prompt('Enter Matrix username (e.g., @user:matrix.inquiry.institute):');
            if (!username) return;
            
            const password = prompt('Enter Matrix password:');
            if (!password) return;
            
            try {
                connectBtn.textContent = 'Connecting...';
                statusEl.textContent = 'Connecting...';
                
                matrixClient = new MatrixClient(MATRIX_ROOM_ID, MATRIX_SERVER);
                
                // Try to connect with credentials, fallback to guest if it fails
                try {
                    await matrixClient.connect(username, password);
                } catch (authError) {
                    console.warn('Auth failed, trying guest mode:', authError);
                    await matrixClient.connectAsGuest();
                }
                
                // Listen for messages
                matrixClient.onMessage(async (message) => {
                    displayMessage(message);
                    
                    // Check if message is a command for the blackboard
                    const result = await llmController.processMessage(message.content);
                    if (result && result.success) {
                        // Optionally send a response back to chat
                        if (result.message) {
                            addSystemMessage(result.message);
                        }
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
                alert('Failed to connect to Matrix room: ' + error.message);
            }
        }
    });
}

function setupChatInput() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Clear input
        chatInput.value = '';
        
        // Display user message
        displayMessage({
            sender: 'You',
            content: message,
            timestamp: Date.now(),
        });
        
        // Send to Matrix if connected
        if (matrixClient && matrixClient.isConnected) {
            try {
                await matrixClient.sendMessage(message);
            } catch (error) {
                console.error('Failed to send message:', error);
                addSystemMessage('Failed to send message to Matrix.');
            }
        }
        
        // Process as command
        const result = await llmController.processMessage(message);
        if (result && result.success) {
            if (result.result) {
                addSystemMessage(`Computation result: ${result.result}`);
            } else if (result.message) {
                addSystemMessage(result.message);
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

// Example: Add some default parameters
blackboard?.addParameter('radius', 0, 200, 50);
blackboard?.addParameter('angle', 0, 360, 0, 1);

// Handle parameter changes to update shapes
if (blackboard) {
    const originalOnParameterChange = blackboard.onParameterChange.bind(blackboard);
    blackboard.onParameterChange = (name, value) => {
        originalOnParameterChange(name, value);
        
        // Update shapes based on parameters
        // Example: Update circle radius
        if (name === 'radius') {
            const circles = blackboard.shapes.filter(s => s instanceof Konva.Circle);
            circles.forEach(circle => {
                circle.radius(value);
            });
            blackboard.layer.draw();
        }
    };
}
