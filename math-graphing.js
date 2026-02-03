/**
 * Math Graphing Functions
 * Handles graphing algebraic equations on the whiteboard
 */

class MathGraphing {
    constructor(controller, sageIntegration) {
        this.controller = controller;
        this.sage = sageIntegration;
    }

    /**
     * Graph an algebraic equation
     * @param {string} equation - Equation like "y = x^2" or "f(x) = 2x + 1"
     * @param {object} options - Graphing options (xRange, yRange, step, etc.)
     */
    async graphEquation(equation, options = {}) {
        try {
            // Parse the equation
            const parsed = this.parseEquation(equation);
            
            // Get canvas dimensions
            const center = this.controller.editor.getViewportPageCenter();
            const xRange = options.xRange || [-5, 5];
            const yRange = options.yRange || [-5, 5];
            const step = options.step || 0.1;
            
            // Draw axes first
            this.drawAxes(center.x, center.y, options.axisLength || 400);
            
            // Compute points using SageMath or JavaScript
            const points = await this.computePoints(parsed, xRange, step, center, options);
            
            // Draw the curve
            this.drawCurve(points, center, options);
            
            return { success: true, message: `Graphed: ${equation}` };
        } catch (error) {
            console.error('Error graphing equation:', error);
            throw error;
        }
    }

    parseEquation(equation) {
        const lower = equation.toLowerCase();
        
        // Remove "y = " or "f(x) = "
        let expr = equation.replace(/^y\s*=\s*/i, '').replace(/^f\(x\)\s*=\s*/i, '').trim();
        
        // Simple parsing for common patterns
        return {
            expression: expr,
            original: equation,
        };
    }

    async computePoints(parsed, xRange, step, center, options) {
        const points = [];
        const [xMin, xMax] = xRange;
        
        // Try to use SageMath for computation
        if (this.sage && this.sage.isReady) {
            try {
                const code = `
var('x')
f(x) = ${parsed.expression}
points = [(x, f(x)) for x in srange(${xMin}, ${xMax}, ${step})]
print(points)
                `;
                const result = await this.sage.execute(code);
                // Parse SageMath output and convert to canvas coordinates
                // This is simplified - would need proper parsing
            } catch (error) {
                console.warn('SageMath computation failed, using JavaScript fallback:', error);
            }
        }
        
        // JavaScript fallback for simple equations
        for (let x = xMin; x <= xMax; x += step) {
            try {
                const y = this.evaluateExpression(parsed.expression, x);
                if (isFinite(y)) {
                    points.push({ x, y });
                }
            } catch (error) {
                // Skip invalid points
            }
        }
        
        return points;
    }

    evaluateExpression(expr, x) {
        // Simple expression evaluator for common math functions
        // Replace x with the value
        let code = expr.replace(/x/g, `(${x})`);
        
        // Replace common math functions
        code = code.replace(/\^/g, '**'); // Power operator
        code = code.replace(/sin\(/g, 'Math.sin(');
        code = code.replace(/cos\(/g, 'Math.cos(');
        code = code.replace(/tan\(/g, 'Math.tan(');
        code = code.replace(/exp\(/g, 'Math.exp(');
        code = code.replace(/log\(/g, 'Math.log(');
        code = code.replace(/sqrt\(/g, 'Math.sqrt(');
        code = code.replace(/abs\(/g, 'Math.abs(');
        
        // Evaluate safely
        try {
            return eval(code);
        } catch (error) {
            throw new Error(`Cannot evaluate expression: ${expr}`);
        }
    }

    drawAxes(centerX, centerY, length) {
        const halfLength = length / 2;
        
        // X-axis
        this.controller.editor.createShape({
            type: 'line',
            x: centerX - halfLength,
            y: centerY,
            props: {
                points: {
                    a1: { x: 0, y: 0, id: 'a1' },
                    a2: { x: length, y: 0, id: 'a2' },
                },
                stroke: '#ffffff',
                strokeWidth: 2,
            },
        });
        
        // Y-axis
        this.controller.editor.createShape({
            type: 'line',
            x: centerX,
            y: centerY - halfLength,
            props: {
                points: {
                    a1: { x: 0, y: 0, id: 'a1' },
                    a2: { x: 0, y: length, id: 'a2' },
                },
                stroke: '#ffffff',
                strokeWidth: 2,
            },
        });
    }

    drawCurve(points, center, options) {
        if (points.length < 2) return;
        
        const scale = options.scale || 50; // Pixels per unit
        const canvasPoints = points.map(p => ({
            x: center.x + p.x * scale,
            y: center.y - p.y * scale, // Invert y-axis
        }));
        
        // Draw as connected line segments
        for (let i = 0; i < canvasPoints.length - 1; i++) {
            const p1 = canvasPoints[i];
            const p2 = canvasPoints[i + 1];
            
            this.controller.editor.createShape({
                type: 'line',
                x: p1.x,
                y: p1.y,
                props: {
                    points: {
                        a1: { x: 0, y: 0, id: 'a1' },
                        a2: { x: p2.x - p1.x, y: p2.y - p1.y, id: 'a2' },
                    },
                    stroke: '#00ff00', // Green for graphs
                    strokeWidth: 2,
                },
            });
        }
    }

    /**
     * Graph multiple functions
     */
    async graphMultiple(equations, options = {}) {
        const colors = ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff8800'];
        
        for (let i = 0; i < equations.length; i++) {
            const equation = equations[i];
            const color = colors[i % colors.length];
            
            await this.graphEquation(equation, { ...options, color });
        }
    }
}
