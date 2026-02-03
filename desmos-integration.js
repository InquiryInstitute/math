/**
 * Desmos Integration
 * Handles embedding and controlling Desmos calculators on the whiteboard
 */

class DesmosIntegration {
    constructor() {
        this.calculators = [];
        this.counter = 0;
    }

    /**
     * Create a Desmos calculator widget on the whiteboard
     * @param {object} options - Calculator options
     * @param {string} options.expression - Expression to graph (e.g., "y = x^2")
     * @param {number} options.x - X position on canvas
     * @param {number} options.y - Y position on canvas
     * @param {number} options.width - Width of calculator
     * @param {number} options.height - Height of calculator
     * @param {object} options.bounds - Viewport bounds {left, right, bottom, top}
     * @returns {HTMLElement} The calculator container element
     */
    createCalculator(options = {}) {
        const {
            expression = '',
            x = 100,
            y = 100,
            width = 400,
            height = 300,
            bounds = null,
        } = options;

        // Create container for Desmos calculator
        const container = document.createElement('div');
        container.className = 'desmos-calculator-container';
        container.id = `desmos-calc-${this.counter++}`;
        container.style.position = 'absolute';
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        container.style.border = '2px solid #ffffff';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';
        container.style.backgroundColor = '#ffffff';
        container.style.zIndex = '1000';

        // Create iframe for Desmos calculator
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Build Desmos calculator URL
        const calculatorUrl = this.buildCalculatorUrl(expression, bounds);
        iframe.src = calculatorUrl;
        
        container.appendChild(iframe);

        // Store calculator reference
        this.calculators.push({
            id: container.id,
            container,
            iframe,
            expression,
        });

        return container;
    }

    /**
     * Build Desmos calculator URL with expression
     */
    buildCalculatorUrl(expression, bounds = null) {
        const baseUrl = 'https://www.desmos.com/calculator';
        const params = new URLSearchParams();
        
        if (expression) {
            // Convert expression to Desmos format
            // Desmos uses expressions like: y=x^2
            const desmosExpr = this.convertToDesmosExpression(expression);
            params.set('expr', desmosExpr);
        }
        
        if (bounds) {
            params.set('xAxis', `${bounds.left},${bounds.right}`);
            params.set('yAxis', `${bounds.bottom},${bounds.top}`);
        }
        
        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    }

    /**
     * Convert mathematical expression to Desmos format
     */
    convertToDesmosExpression(expression) {
        // Handle common formats:
        // "y = x^2" -> "y=x^2"
        // "f(x) = 2x + 1" -> "y=2x+1"
        // "x^2 + y^2 = 25" -> "x^2+y^2=25"
        
        let expr = expression.trim();
        
        // Replace f(x) = with y =
        expr = expr.replace(/f\(x\)\s*=\s*/gi, 'y=');
        
        // Remove spaces around operators
        expr = expr.replace(/\s*=\s*/g, '=');
        expr = expr.replace(/\s*\+\s*/g, '+');
        expr = expr.replace(/\s*-\s*/g, '-');
        expr = expr.replace(/\s*\*\s*/g, '*');
        expr = expr.replace(/\s*\/\s*/g, '/');
        expr = expr.replace(/\s*\^\s*/g, '^');
        
        // Encode for URL
        return encodeURIComponent(expr);
    }

    /**
     * Graph a function on Desmos
     * @param {string} expression - Function expression (e.g., "y = x^2", "f(x) = sin(x)")
     * @param {object} options - Graphing options
     */
    graphFunction(expression, options = {}) {
        const container = document.getElementById('tldraw-canvas') || 
                         document.getElementById('excalidraw-wrapper');
        
        if (!container) {
            console.error('Whiteboard container not found');
            return null;
        }

        // Get container dimensions for positioning
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const calculatorOptions = {
            expression,
            x: options.x || centerX - 200,
            y: options.y || centerY - 150,
            width: options.width || 400,
            height: options.height || 300,
            bounds: options.bounds || {
                left: -10,
                right: 10,
                bottom: -10,
                top: 10,
            },
        };

        const calculatorElement = this.createCalculator(calculatorOptions);
        container.appendChild(calculatorElement);

        return calculatorElement;
    }

    /**
     * Graph multiple functions
     */
    graphMultiple(expressions, options = {}) {
        const results = [];
        const spacing = options.spacing || 50;
        
        expressions.forEach((expr, index) => {
            const calcOptions = {
                ...options,
                y: (options.y || 100) + (index * (options.height || 300) + spacing),
            };
            results.push(this.graphFunction(expr, calcOptions));
        });

        return results;
    }

    /**
     * Remove a calculator
     */
    removeCalculator(calculatorId) {
        const calculator = this.calculators.find(c => c.id === calculatorId);
        if (calculator) {
            calculator.container.remove();
            this.calculators = this.calculators.filter(c => c.id !== calculatorId);
        }
    }

    /**
     * Remove all calculators
     */
    clearAll() {
        this.calculators.forEach(calc => calc.container.remove());
        this.calculators = [];
    }

    /**
     * Parse LLM instruction for Desmos commands
     */
    parseDesmosCommand(instruction) {
        const lower = instruction.toLowerCase();
        
        // Check for Desmos-specific commands
        if (lower.includes('desmos') || lower.includes('graph') || lower.includes('plot')) {
            // Extract function expression
            const funcMatch = instruction.match(/y\s*=\s*([^,]+)/i) || 
                            instruction.match(/f\(x\)\s*=\s*([^,]+)/i) ||
                            instruction.match(/graph\s+(.+?)(?:\s+from|\s+to|$)/i) ||
                            instruction.match(/plot\s+(.+?)(?:\s+from|\s+to|$)/i);
            
            if (funcMatch) {
                return {
                    type: 'graph',
                    expression: funcMatch[1].trim(),
                };
            }
        }
        
        return null;
    }
}
