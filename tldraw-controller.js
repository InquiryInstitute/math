/**
 * tldraw Controller for Blackboard
 * Adapts LLM commands to work with tldraw
 */

class TldrawController {
    constructor(editor) {
        this.editor = editor;
        this.parameters = {};
    }

    /**
     * Process LLM instruction and draw on tldraw canvas
     */
    drawFromLLM(instruction) {
        try {
            console.log('TldrawController: Processing instruction:', instruction);
            const command = this.parseLLMInstruction(instruction);
            this.executeCommand(command);
            return { success: true, message: 'Drawing command executed' };
        } catch (error) {
            console.error('Error executing LLM instruction:', error);
            throw error;
        }
    }

    parseLLMInstruction(instruction) {
        if (!instruction || typeof instruction !== 'string') {
            throw new Error('Invalid instruction: ' + instruction);
        }

        const lower = instruction.toLowerCase().trim();
        console.log('Parsing instruction:', instruction);

        // Get canvas center
        const viewportCenter = this.editor.getViewportPageCenter();
        const centerX = viewportCenter.x;
        const centerY = viewportCenter.y;

        // Draw a circle
        if (lower.includes('circle')) {
            const match = instruction.match(/radius[:\s]+(\d+)/i) || instruction.match(/r[:\s]*=?\s*(\d+)/i);
            const radius = match ? parseInt(match[1]) : 50;
            const centerMatch = instruction.match(/center[:\s]+\((\d+)[,\s]+(\d+)\)/i) || 
                               instruction.match(/at[:\s]+\((\d+)[,\s]+(\d+)\)/i);
            const center = centerMatch 
                ? { x: parseInt(centerMatch[1]), y: parseInt(centerMatch[2]) }
                : { x: centerX, y: centerY };
            
            return {
                type: 'circle',
                x: center.x,
                y: center.y,
                radius: radius,
            };
        }

        // Draw a line
        if (lower.includes('line')) {
            const points = instruction.match(/\((\d+)[,\s]+(\d+)\)/g);
            if (points && points.length >= 2) {
                const p1 = points[0].match(/(\d+)[,\s]+(\d+)/);
                const p2 = points[1].match(/(\d+)[,\s]+(\d+)/);
                if (p1 && p2) {
                    return {
                        type: 'line',
                        x1: parseInt(p1[1]),
                        y1: parseInt(p1[2]),
                        x2: parseInt(p2[1]),
                        y2: parseInt(p2[2]),
                    };
                }
            }
            
            const fromToMatch = instruction.match(/from[:\s]+(\d+)[,\s]+(\d+)[\s]+to[:\s]+(\d+)[,\s]+(\d+)/i);
            if (fromToMatch) {
                return {
                    type: 'line',
                    x1: parseInt(fromToMatch[1]),
                    y1: parseInt(fromToMatch[2]),
                    x2: parseInt(fromToMatch[3]),
                    y2: parseInt(fromToMatch[4]),
                };
            }
            
            // Default: horizontal line
            const length = 200;
            return {
                type: 'line',
                x1: centerX - length / 2,
                y1: centerY,
                x2: centerX + length / 2,
                y2: centerY,
            };
        }

        // Draw a square
        if (lower.includes('square')) {
            const sizeMatch = instruction.match(/size[:\s]+(\d+)/i);
            const size = sizeMatch ? parseInt(sizeMatch[1]) : 100;
            
            return {
                type: 'rectangle',
                x: centerX - size / 2,
                y: centerY - size / 2,
                width: size,
                height: size,
            };
        }

        // Draw a rectangle
        if (lower.includes('rectangle') || lower.includes('rect')) {
            const match = instruction.match(/width[:\s]+(\d+).*height[:\s]+(\d+)/i);
            const width = match ? parseInt(match[1]) : 100;
            const height = match ? parseInt(match[2]) : 80;
            
            return {
                type: 'rectangle',
                x: centerX - width / 2,
                y: centerY - height / 2,
                width: width,
                height: height,
            };
        }

        // Draw a triangle
        if (lower.includes('triangle')) {
            const size = 100;
            const height = size * 0.866;
            return {
                type: 'triangle',
                x: centerX,
                y: centerY,
                size: size,
                height: height,
            };
        }

        // Graph/plot commands
        if (lower.includes('graph') || (lower.includes('plot') && lower.includes('graph'))) {
            const axisLength = 300;
            
            // Return multiple commands for axes
            return {
                type: 'graph',
                x: centerX,
                y: centerY,
                length: axisLength,
            };
        }

        // Add text
        if (lower.includes('text') || lower.includes('write')) {
            const textMatch = instruction.match(/['"]([^'"]+)['"]/) ||
                             instruction.match(/text[:\s]+(.+?)(?:\s+at|\s*$)/i) ||
                             instruction.match(/write[:\s]+(.+?)(?:\s+at|\s*$)/i);
            const posMatch = instruction.match(/at[:\s]+\((\d+)[,\s]+(\d+)\)/i);
            if (textMatch) {
                return {
                    type: 'text',
                    text: textMatch[1].trim(),
                    x: posMatch ? parseInt(posMatch[1]) : centerX,
                    y: posMatch ? parseInt(posMatch[2]) : centerY,
                };
            }
        }

        // Default: draw a square if just "draw"
        if (lower.includes('draw') && !lower.includes('circle') && !lower.includes('line') && !lower.includes('rect') && !lower.includes('triangle')) {
            return {
                type: 'rectangle',
                x: centerX - 50,
                y: centerY - 50,
                width: 100,
                height: 100,
            };
        }

        throw new Error('Could not parse instruction: ' + instruction);
    }

    executeCommand(command) {
        const { editor } = this;
        
        switch (command.type) {
            case 'circle':
                editor.createShape({
                    type: 'geo',
                    x: command.x - command.radius,
                    y: command.y - command.radius,
                    props: {
                        w: command.radius * 2,
                        h: command.radius * 2,
                        geo: 'ellipse',
                        fill: 'none',
                        color: 'white',
                        dash: 'draw',
                        size: 'm',
                    },
                });
                break;

            case 'line':
                editor.createShape({
                    type: 'line',
                    x: command.x1,
                    y: command.y1,
                    props: {
                        points: {
                            a1: { x: 0, y: 0, id: 'a1' },
                            a2: { x: command.x2 - command.x1, y: command.y2 - command.y1, id: 'a2' },
                        },
                        color: 'white',
                        size: 'm',
                    },
                });
                break;

            case 'rectangle':
                editor.createShape({
                    type: 'geo',
                    x: command.x,
                    y: command.y,
                    props: {
                        w: command.width,
                        h: command.height,
                        geo: 'rectangle',
                        fill: 'none',
                        color: 'white',
                        dash: 'draw',
                        size: 'm',
                    },
                });
                break;

            case 'triangle':
                const size = command.size;
                const h = command.height;
                editor.createShape({
                    type: 'geo',
                    x: command.x - size / 2,
                    y: command.y - h * 2/3,
                    props: {
                        w: size,
                        h: h,
                        geo: 'triangle',
                        fill: 'none',
                        color: 'white',
                        dash: 'draw',
                        size: 'm',
                    },
                });
                break;

            case 'graph':
                // Draw x-axis
                editor.createShape({
                    type: 'line',
                    x: command.x - command.length / 2,
                    y: command.y,
                    props: {
                        points: {
                            a1: { x: 0, y: 0, id: 'a1' },
                            a2: { x: command.length, y: 0, id: 'a2' },
                        },
                        color: 'white',
                        size: 'm',
                    },
                });
                
                // Draw y-axis
                editor.createShape({
                    type: 'line',
                    x: command.x,
                    y: command.y - command.length / 2,
                    props: {
                        points: {
                            a1: { x: 0, y: 0, id: 'a1' },
                            a2: { x: 0, y: command.length, id: 'a2' },
                        },
                        color: 'white',
                        size: 'm',
                    },
                });
                break;

            case 'text':
                editor.createShape({
                    type: 'text',
                    x: command.x,
                    y: command.y,
                    props: {
                        text: command.text,
                        color: 'white',
                        size: 'm',
                        font: 'draw',
                        align: 'start',
                    },
                });
                break;
        }
    }

    clear() {
        const shapes = this.editor.getCurrentPageShapes();
        this.editor.deleteShapes(shapes.map(s => s.id));
    }

    // Parameter controls (similar to blackboard)
    addParameter(name, min, max, value, step = 1) {
        this.parameters[name] = { min, max, value, step };
        this.updateParameterControls();
    }

    updateParameterControls() {
        const container = document.getElementById('sliders-container');
        if (!container) return;

        container.innerHTML = '';

        for (const [name, param] of Object.entries(this.parameters)) {
            const control = document.createElement('div');
            control.className = 'slider-control';

            const label = document.createElement('label');
            label.textContent = name;
            control.appendChild(label);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = param.min;
            slider.max = param.max;
            slider.value = param.value;
            slider.step = param.step;
            slider.addEventListener('input', (e) => {
                param.value = parseFloat(e.target.value);
                valueDisplay.textContent = param.value;
            });
            control.appendChild(slider);

            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'value';
            valueDisplay.textContent = param.value;
            control.appendChild(valueDisplay);

            container.appendChild(control);
        }
    }
}
