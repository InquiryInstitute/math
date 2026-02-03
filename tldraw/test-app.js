/**
 * Test Application with tldraw
 * Coordinates Matrix chat, tldraw whiteboard, SageMath, and LLM controller
 */

// Initialize components
let tldrawEditor;
let tldrawController;
let mathGraphing;
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
    
    // Initialize ask-faculty client (Pythagoras)
    // Note: You'll need to set SUPABASE_URL and SUPABASE_ANON_KEY
    const supabaseUrl = window.SUPABASE_URL || 'https://qjqjqjqjqjqjqjqj.supabase.co';
    const supabaseAnonKey = window.SUPABASE_ANON_KEY || '';
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
    
    // Create a simple editor-like object that works with our controller
    // Note: Full tldraw integration requires React - this is a simplified version
    // that accepts LLM commands and draws on canvas
    const editor = {
        shapes: [],
        getViewportPageCenter: () => {
            const rect = container.getBoundingClientRect();
            return { x: rect.width / 2, y: rect.height / 2 };
        },
        createShape: (shapeConfig) => {
            console.log('Creating shape:', shapeConfig);
            const shape = {
                id: 'shape-' + Date.now(),
                ...shapeConfig,
            };
            editor.shapes.push(shape);
            
            // Draw the shape on a canvas
            drawShapeOnCanvas(container, shapeConfig);
            
            return shape;
        },
        getCurrentPageShapes: () => editor.shapes,
        deleteShapes: (ids) => {
            editor.shapes = editor.shapes.filter(s => !ids.includes(s.id));
            redrawCanvas(container, editor.shapes);
        },
    };

    tldrawEditor = editor;
    tldrawController = new TldrawController(editor);
    
    console.log('tldraw initialized (canvas-based)');
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
        
        // Process as command first (drawing, graphing, etc.)
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
        } else {
            // If not a command, ask Pythagoras
            if (askFacultyClient) {
                addSystemMessage('Asking Pythagoras...');
                const facultyResponse = await askFacultyClient.ask(message);
                if (facultyResponse.response) {
                    displayMessage({
                        sender: 'Pythagoras',
                        content: facultyResponse.response,
                        timestamp: Date.now(),
                    });
                } else if (facultyResponse.error) {
                    addSystemMessage(`Error asking Pythagoras: ${facultyResponse.error}`);
                }
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
    
    // Check if it's a graph equation command
    if ((lower.includes('graph') || lower.includes('plot')) && 
        (lower.includes('y =') || lower.includes('f(x)') || lower.match(/\w+\s*=\s*\w+/))) {
        try {
            if (mathGraphing) {
                const result = await mathGraphing.graphEquation(message);
                return result;
            } else {
                // Fallback to regular drawing
                tldrawController.drawFromLLM(message);
                return { success: true, message: 'Drawing command executed' };
            }
        } catch (error) {
            console.error('Graphing error:', error);
            return { success: false, error: error.message };
        }
    }
    
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
