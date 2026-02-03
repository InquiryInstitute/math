/**
 * Test Application with tldraw
 * Coordinates Matrix chat, tldraw whiteboard, SageMath, and LLM controller
 */

// Initialize components
let tldrawEditor;
let tldrawController;
let mathGraphing;
let desmosIntegration;
let matrixClient;
let sageIntegration;
let askFacultyClient;

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
    
    // Initialize Desmos integration
    desmosIntegration = new DesmosIntegration();
    
    // Initialize ask-faculty client (Pythagoras)
    // Note: You can override SUPABASE_URL and SUPABASE_ANON_KEY via window variables
    // Default uses Inquiry.Institute Supabase project
    const supabaseUrl = window.SUPABASE_URL || 'https://xougqdomkoisrxdnagcj.supabase.co';
    const supabaseAnonKey = window.SUPABASE_ANON_KEY || 'sb_publishable_1Zt0VjMX57VdYC7dH-GG1A_RFZyuwc9';
    askFacultyClient = new AskFacultyClient(supabaseUrl, supabaseAnonKey);
    
    // Initialize math graphing (after tldraw is ready)
    setTimeout(() => {
        if (tldrawController) {
            mathGraphing = new MathGraphing(tldrawController, sageIntegration);
        }
    }, 500);
    
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
    
    // Setup clear Desmos button
    document.getElementById('clear-desmos-btn').addEventListener('click', () => {
        if (desmosIntegration) {
            desmosIntegration.clearAll();
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
    // tldraw is now initialized via React in tldraw-init.js
    // Wait for the editor to be available from the React component
    const checkEditor = setInterval(() => {
        if (window.tldrawEditor) {
            clearInterval(checkEditor);
            tldrawEditor = window.tldrawEditor;
            if (window.tldrawController) {
                tldrawController = window.tldrawController;
            } else if (typeof TldrawController !== 'undefined') {
                tldrawController = new TldrawController(tldrawEditor);
                window.tldrawController = tldrawController;
            }
            console.log('tldraw editor ready');
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkEditor);
        if (!tldrawEditor) {
            console.warn('tldraw editor not available after 5 seconds');
        }
    }, 5000);
}

// Helper function to draw shapes on canvas
function drawShapeOnCanvas(container, shape) {
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
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    if (shape.type === 'geo') {
        if (shape.props.geo === 'ellipse' || shape.props.geo === 'circle') {
            ctx.beginPath();
            ctx.ellipse(shape.x + shape.props.w / 2, shape.y + shape.props.h / 2, 
                       shape.props.w / 2, shape.props.h / 2, 0, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (shape.props.geo === 'rectangle') {
            ctx.strokeRect(shape.x, shape.y, shape.props.w, shape.props.h);
        } else if (shape.props.geo === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(shape.x + shape.props.w / 2, shape.y);
            ctx.lineTo(shape.x, shape.y + shape.props.h);
            ctx.lineTo(shape.x + shape.props.w, shape.y + shape.props.h);
            ctx.closePath();
            ctx.stroke();
        }
    } else if (shape.type === 'line') {
        const points = shape.props.points;
        ctx.beginPath();
        ctx.moveTo(shape.x + points.a1.x, shape.y + points.a1.y);
        ctx.lineTo(shape.x + points.a2.x, shape.y + points.a2.y);
        ctx.stroke();
    } else if (shape.type === 'text') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(shape.props.text, shape.x, shape.y);
    }
}

function redrawCanvas(container, shapes) {
    let canvas = container.querySelector('canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    shapes.forEach(shape => {
        drawShapeOnCanvas(container, shape);
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
                
                // Send to Pythagoras - LLM controls the whiteboard
                if (askFacultyClient) {
                    const facultyResponse = await askFacultyClient.ask(message.content);
                    if (facultyResponse.response) {
                        displayMessage({
                            sender: 'Pythagoras',
                            content: facultyResponse.response,
                            timestamp: Date.now(),
                        });
                        
                        // Execute any drawing commands from LLM response
                        await executeLLMDrawingCommands(facultyResponse.response);
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
        
        // Always ask Pythagoras - the LLM controls the whiteboard
        if (askFacultyClient) {
            addSystemMessage('Asking Pythagoras...');
            const facultyResponse = await askFacultyClient.ask(message);
            if (facultyResponse.response) {
                // Display the response
                displayMessage({
                    sender: 'Pythagoras',
                    content: facultyResponse.response,
                    timestamp: Date.now(),
                });
                
                // Parse and execute any drawing commands from the LLM response
                await executeLLMDrawingCommands(facultyResponse.response);
            } else if (facultyResponse.error) {
                addSystemMessage(`Error asking Pythagoras: ${facultyResponse.error}`);
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

/**
 * Execute drawing commands from LLM response
 * The LLM can specify drawing commands in its response
 */
async function executeLLMDrawingCommands(llmResponse) {
    if (!llmResponse || typeof llmResponse !== 'string') return;
    
    // Look for drawing commands in the response
    // Commands can be in JSON format: {"command": "draw", "type": "circle", ...}
    // Or natural language: "draw a circle", "graph y = x^2", etc.
    
    try {
        // Try to find JSON commands first
        const jsonMatch = llmResponse.match(/\{[\s\S]*"command"[\s\S]*"draw"[\s\S]*\}/);
        if (jsonMatch) {
            const command = JSON.parse(jsonMatch[0]);
            if (command.command === 'draw' && command.type) {
                await executeDrawingCommand(command);
                return;
            }
        }
        
        // Look for natural language drawing commands
        const drawingKeywords = ['draw', 'create', 'make', 'add', 'show', 'display', 'plot', 'graph', 'sketch'];
        const lower = llmResponse.toLowerCase();
        
        if (drawingKeywords.some(keyword => lower.includes(keyword))) {
            // Check if it's a graph equation command
            if ((lower.includes('graph') || lower.includes('plot')) && 
                (lower.includes('y =') || lower.includes('f(x)') || lower.match(/\w+\s*=\s*\w+/))) {
                if (mathGraphing) {
                    await mathGraphing.graphEquation(llmResponse);
                }
            } else {
                // Regular drawing command
                if (tldrawController) {
                    tldrawController.drawFromLLM(llmResponse);
                }
            }
        }
    } catch (error) {
        console.error('Error executing LLM drawing commands:', error);
    }
}

/**
 * Execute a structured drawing command from JSON
 */
async function executeDrawingCommand(command) {
    if (!tldrawController) return;
    
    try {
        switch (command.type) {
            case 'circle':
                tldrawController.executeCommand({
                    type: 'circle',
                    x: command.x || 400,
                    y: command.y || 300,
                    radius: command.radius || 50,
                });
                break;
                
            case 'line':
                tldrawController.executeCommand({
                    type: 'line',
                    x1: command.x1 || 300,
                    y1: command.y1 || 300,
                    x2: command.x2 || 500,
                    y2: command.y2 || 300,
                });
                break;
                
            case 'rectangle':
            case 'square':
                tldrawController.executeCommand({
                    type: 'rectangle',
                    x: command.x || 350,
                    y: command.y || 250,
                    width: command.width || (command.type === 'square' ? 100 : 150),
                    height: command.height || (command.type === 'square' ? 100 : 80),
                });
                break;
                
            case 'triangle':
                tldrawController.executeCommand({
                    type: 'triangle',
                    x: command.x || 400,
                    y: command.y || 300,
                    size: command.size || 100,
                });
                break;
                
            case 'graph':
            case 'graphFunction':
                if (command.equation && mathGraphing) {
                    await mathGraphing.graphEquation(command.equation, command.options);
                } else {
                    tldrawController.executeCommand({
                        type: 'graph',
                        x: command.x || 400,
                        y: command.y || 300,
                        length: command.length || 300,
                    });
                }
                break;
                
            case 'text':
                tldrawController.executeCommand({
                    type: 'text',
                    x: command.x || 400,
                    y: command.y || 300,
                    text: command.text || '',
                });
                break;
        }
    } catch (error) {
        console.error('Error executing drawing command:', error);
    }
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
    // Render KaTeX math if available
    if (typeof renderMathInElement !== 'undefined') {
        content.innerHTML = escapeHtml(message.content);
        renderMathInElement(content, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\[', right: '\\]', display: true},
                {left: '\\(', right: '\\)', display: false}
            ],
            throwOnError: false
        });
    } else {
        content.textContent = message.content;
    }
    messageEl.appendChild(content);
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
    messageEl.appendChild(timestamp);
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addSystemMessage(text) {
    displayMessage({
        sender: 'System',
        content: text,
        timestamp: Date.now(),
    });
}
