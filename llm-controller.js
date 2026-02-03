/**
 * LLM Controller for Blackboard
 * Interprets natural language commands and controls the blackboard
 */

class LLMController {
    constructor(blackboard, sageIntegration) {
        this.blackboard = blackboard;
        this.sage = sageIntegration;
        this.apiEndpoint = null; // Will be set based on available API
    }

    /**
     * Process a message and determine if it's a blackboard command
     */
    async processMessage(message) {
        const lower = message.toLowerCase().trim();

        // Check if it's a drawing command
        if (this.isDrawingCommand(message)) {
            return await this.handleDrawingCommand(message);
        }

        // Check if it's a computation request
        if (this.isComputationCommand(message)) {
            return await this.handleComputationCommand(message);
        }

        // Check if it's a parameter control command
        if (this.isParameterCommand(message)) {
            return await this.handleParameterCommand(message);
        }

        return null; // Not a command, just a regular message
    }

    isDrawingCommand(message) {
        const keywords = ['draw', 'create', 'make', 'add', 'show', 'display', 'plot'];
        const lower = message.toLowerCase();
        return keywords.some(keyword => lower.includes(keyword));
    }

    isComputationCommand(message) {
        const keywords = ['calculate', 'compute', 'solve', 'find', 'what is', 'derivative', 'integral', 'area', 'perimeter'];
        const lower = message.toLowerCase();
        return keywords.some(keyword => lower.includes(keyword));
    }

    isParameterCommand(message) {
        const keywords = ['set', 'change', 'adjust', 'parameter', 'slider'];
        const lower = message.toLowerCase();
        return keywords.some(keyword => lower.includes(keyword));
    }

    async handleDrawingCommand(message) {
        try {
            // Use the blackboard's LLM instruction parser
            this.blackboard.drawFromLLM(message);
            return { success: true, message: 'Drawing command executed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async handleComputationCommand(message) {
        try {
            const lower = message.toLowerCase();

            // Area calculations
            if (lower.includes('area')) {
                if (lower.includes('circle')) {
                    const radiusMatch = message.match(/radius[:\s]+(\d+)/i) || message.match(/r[:\s]*=?\s*(\d+)/i);
                    const radius = radiusMatch ? parseFloat(radiusMatch[1]) : 1;
                    const result = await this.sage.computeGeometry('circle', { radius });
                    return { success: true, result, message: `Computed circle area with radius ${radius}` };
                }
                if (lower.includes('triangle')) {
                    // Extract triangle sides
                    const sides = message.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
                    if (sides) {
                        const result = await this.sage.computeGeometry('triangle', {
                            a: parseFloat(sides[1]),
                            b: parseFloat(sides[2]),
                            c: parseFloat(sides[3]),
                        });
                        return { success: true, result, message: 'Computed triangle area' };
                    }
                }
                if (lower.includes('rectangle')) {
                    const dims = message.match(/width[:\s]+(\d+).*height[:\s]+(\d+)/i);
                    if (dims) {
                        const result = await this.sage.computeGeometry('rectangle', {
                            width: parseFloat(dims[1]),
                            height: parseFloat(dims[2]),
                        });
                        return { success: true, result, message: 'Computed rectangle area' };
                    }
                }
            }

            // Solve equations
            if (lower.includes('solve') && lower.includes('equation')) {
                const eqMatch = message.match(/equation[:\s]+(.+)/i);
                if (eqMatch) {
                    const result = await this.sage.solveEquation(eqMatch[1].trim());
                    return { success: true, result, message: 'Solved equation' };
                }
            }

            // Derivatives
            if (lower.includes('derivative')) {
                const exprMatch = message.match(/derivative[:\s]+of[:\s]+(.+)/i);
                if (exprMatch) {
                    const result = await this.sage.derivative(exprMatch[1].trim());
                    return { success: true, result, message: 'Computed derivative' };
                }
            }

            // Integrals
            if (lower.includes('integral')) {
                const exprMatch = message.match(/integral[:\s]+of[:\s]+(.+)/i);
                if (exprMatch) {
                    const result = await this.sage.integral(exprMatch[1].trim());
                    return { success: true, result, message: 'Computed integral' };
                }
            }

            return { success: false, error: 'Could not parse computation command' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async handleParameterCommand(message) {
        try {
            const lower = message.toLowerCase();

            // Extract parameter name and value
            const paramMatch = message.match(/(\w+)[:\s]+(?:to|is|equals?|=)[:\s]+(\d+\.?\d*)/i);
            if (paramMatch) {
                const paramName = paramMatch[1];
                const paramValue = parseFloat(paramMatch[2]);

                // Check if parameter exists
                if (this.blackboard.parameters[paramName]) {
                    this.blackboard.parameters[paramName].value = paramValue;
                    this.blackboard.onParameterChange(paramName, paramValue);
                    this.blackboard.updateParameterControls();
                    return { success: true, message: `Set ${paramName} to ${paramValue}` };
                } else {
                    // Create new parameter
                    this.blackboard.addParameter(paramName, 0, 100, paramValue);
                    return { success: true, message: `Created parameter ${paramName} = ${paramValue}` };
                }
            }

            return { success: false, error: 'Could not parse parameter command' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Enhanced command parsing using LLM API (if available)
     */
    async parseWithLLM(message) {
        if (!this.apiEndpoint) {
            // Fallback to rule-based parsing
            return await this.processMessage(message);
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: {
                        availableTools: ['draw', 'compute', 'parameter'],
                        blackboardState: {
                            shapes: this.blackboard.shapes.length,
                            parameters: Object.keys(this.blackboard.parameters),
                        },
                    },
                }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('LLM API error:', error);
            // Fallback to rule-based parsing
            return await this.processMessage(message);
        }
    }
}
