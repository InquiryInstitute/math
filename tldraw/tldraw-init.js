/**
 * tldraw Initialization
 * Loads tldraw as an ES module and initializes it with React
 */

// Import tldraw as ES module from esm.sh (more reliable than jsdelivr)
import { Tldraw } from 'https://esm.sh/tldraw@2';
import 'https://esm.sh/tldraw@2/tldraw.css';

// Wait for React and DOM to be ready
function waitForReact() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        setTimeout(waitForReact, 100);
        return;
    }
    initializeTldrawReact();
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForReact);
} else {
    waitForReact();
}

function initializeTldrawReact() {
    const container = document.getElementById('tldraw-canvas');
    if (!container) {
        console.error('tldraw container not found');
        return;
    }

    // Create React root
    const root = ReactDOM.createRoot(container);
    
    // Render tldraw component
    root.render(
        React.createElement(Tldraw, {
            onMount: (editor) => {
                console.log('tldraw editor mounted:', editor);
                // Store editor globally for controller access
                window.tldrawEditor = editor;
                
                // Wait for TldrawController to be available
                const initController = setInterval(() => {
                    if (typeof TldrawController !== 'undefined') {
                        clearInterval(initController);
                        window.tldrawController = new TldrawController(editor);
                        console.log('tldraw controller initialized');
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => clearInterval(initController), 5000);
            },
        })
    );
    
    console.log('tldraw React component initialized');
}
