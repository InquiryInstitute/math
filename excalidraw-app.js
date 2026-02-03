/**
 * Excalidraw Test Application
 * Coordinates Matrix chat, Excalidraw whiteboard, SageMath, and LLM controller
 */

// Initialize components
let excalidrawAPI;
let excalidrawController;
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
    // Initialize Excalidraw
    await initializeExcalidraw();
    
    // Initialize SageMath
    sageIntegration = new SageIntegration();
    
    // Setup Matrix connection
    setupMatrixConnection();
    
    // Setup chat input
    setupChatInput();
    
    // Setup clear button
    document.getElementById('clear-excalidraw-btn').addEventListener('click', () => {
        if (confirm('Clear the entire whiteboard?')) {
            excalidrawController.clear();
        }
    });

    // Setup export button
    document.getElementById('export-btn').addEventListener('click', () => {
        const elements = excalidrawAPI.getSceneElements();
        const data = JSON.stringify(elements, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'whiteboard-export.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Setup prompt button
    document.getElementById('show-prompt-btn').addEventListener('click', () => {
        showLLMPrompt();
    });

    document.getElementById('close-prompt-btn').addEventListener('click', () => {
        document.getElementById('prompt-modal').style.display = 'none';
    });
}

async function initializeExcalidraw() {
    const container = document.getElementById('excalidraw-wrapper');
    
    // Wait for Excalidraw to be available
    if (typeof window.Excalidraw === 'undefined') {
        console.log('Waiting for Excalidraw to load...');
        setTimeout(initializeExcalidraw, 100);
        return;
    }
    
    try {
        // Excalidraw is a React component, so we need to use React to render it
        // For now, create a simplified API wrapper that works with our controller
        const api = {
            elements: [],
            getSceneElements: () => api.elements,
            getAppState: () => ({
                scrollX: 0,
                scrollY: 0,
                width: container.clientWidth,
                height: container.clientHeight,
            }),
            addElements: (newElements) => {
                newElements.forEach(el => {
                    el.id = el.id || 'el-' + Date.now() + '-' + Math.random();
                    api.elements.push(el);
                });
                drawElementsOnCanvas(container, api.elements);
            },
            updateScene: (data) => {
                if (data.elements) {
                    api.elements = data.elements;
                    drawElementsOnCanvas(container, api.elements);
                }
            },
        };
        
        excalidrawAPI = api;
        excalidrawController = new ExcalidrawController(api);
        
        console.log('Excalidraw initialized (simplified canvas-based)');
    } catch (error) {
        console.error('Error initializing Excalidraw:', error);
    }
}

// Helper function to draw Excalidraw elements on canvas
function drawElementsOnCanvas(container, elements) {
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.background = '#2d2d1e';
        container.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    elements.forEach(element => {
        if (element.type === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(
                element.x + element.width / 2,
                element.y + element.height / 2,
                element.width / 2,
                element.height / 2,
                0, 0, 2 * Math.PI
            );
            ctx.stroke();
        } else if (element.type === 'rectangle') {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
        } else if (element.type === 'line') {
            if (element.points && element.points.length >= 2) {
                ctx.beginPath();
                ctx.moveTo(element.points[0][0], element.points[0][1]);
                for (let i = 1; i < element.points.length; i++) {
                    ctx.lineTo(element.points[i][0], element.points[i][1]);
                }
                ctx.stroke();
            }
        } else if (element.type === 'text') {
            ctx.font = `${element.fontSize || 20}px Arial`;
            ctx.fillText(element.text, element.x, element.y);
        }
    });
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
            excalidrawController.drawFromLLM(message);
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

function showLLMPrompt() {
    const promptContent = document.getElementById('prompt-content');
    const prompt = getLLMPrompt();
    promptContent.textContent = prompt;
    document.getElementById('prompt-modal').style.display = 'block';
}

function getLLMPrompt() {
    return `You are an AI assistant controlling a whiteboard drawing application. You can communicate with the whiteboard using natural language commands or structured JSON.

NATURAL LANGUAGE COMMANDS:
- "draw a square" - Draws a square
- "draw a circle radius 50" - Draws a circle with radius 50
- "graph" - Draws coordinate axes
- "draw a line from (100, 100) to (200, 200)" - Draws a line
- "draw a triangle" - Draws a triangle
- "write 'Hello'" - Adds text

JSON COMMANDS (for more precise control):
You can also send JSON commands in this format:

{
  "command": "draw",
  "type": "circle|rectangle|line|triangle|graph|text",
  "params": {
    "x": 400,
    "y": 300,
    "radius": 50,
    "width": 100,
    "height": 80,
    "points": [[x1, y1], [x2, y2]],
    "text": "Label text"
  }
}

GRAPHING ALGEBRAIC EQUATIONS:
To graph an equation like y = x^2 + 2x + 1:
1. First draw axes: "graph" or "draw coordinate axes"
2. Then describe the function: "graph y = x^2 + 2x + 1"
3. The system will compute points and draw the curve

The whiteboard understands both natural language and JSON, so you can use whichever is more convenient.`;
}
