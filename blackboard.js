/**
 * Interactive Blackboard with Geometry Drawing Tools
 * Uses Konva.js for canvas manipulation
 */

class Blackboard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(canvasId);
        
        // Get initial size
        const container = this.container.parentElement;
        const width = container ? container.clientWidth - 32 : 1200; // Account for padding
        const height = container ? container.clientHeight - 32 : 800;
        
        this.stage = new Konva.Stage({
            container: canvasId,
            width: width,
            height: height,
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        this.currentTool = 'select';
        this.shapes = [];
        this.currentShape = null;
        this.isDrawing = false;
        this.startPos = null;
        this.parameters = {};

        this.setupEventListeners();
        this.setupResizeHandler();
    }

    setupResizeHandler() {
        // Handle window resize for responsive canvas
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
            }, 100);
        });

        // Also handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resize();
            }, 100);
        });

        // Initial resize check
        this.resize();
    }

    resize() {
        const container = this.container.parentElement;
        if (!container) return;

        const padding = window.innerWidth <= 768 ? 16 : 32; // Less padding on mobile
        const width = container.clientWidth - padding;
        const height = container.clientHeight - padding;

        this.stage.width(width);
        this.stage.height(height);
        this.stage.draw();
    }

    setupEventListeners() {
        // Mouse events
        this.stage.on('mousedown', (e) => this.handleMouseDown(e));
        this.stage.on('mousemove', (e) => this.handleMouseMove(e));
        this.stage.on('mouseup', (e) => this.handleMouseUp(e));

        // Touch events for mobile
        this.stage.on('touchstart', (e) => {
            e.evt.preventDefault();
            this.handleMouseDown(e);
        });
        this.stage.on('touchmove', (e) => {
            e.evt.preventDefault();
            this.handleMouseMove(e);
        });
        this.stage.on('touchend', (e) => {
            e.evt.preventDefault();
            this.handleMouseUp(e);
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        this.stage.setAttr('cursor', this.getCursorForTool(tool));
    }

    getCursorForTool(tool) {
        const cursors = {
            select: 'default',
            line: 'crosshair',
            circle: 'crosshair',
            rectangle: 'crosshair',
            polygon: 'crosshair',
            text: 'text',
            label: 'text',
            erase: 'not-allowed',
        };
        return cursors[tool] || 'default';
    }

    handleMouseDown(e) {
        const pos = this.stage.getPointerPosition();
        this.startPos = pos;
        this.isDrawing = true;

        switch (this.currentTool) {
            case 'line':
                this.startLine(pos);
                break;
            case 'circle':
                this.startCircle(pos);
                break;
            case 'rectangle':
                this.startRectangle(pos);
                break;
            case 'polygon':
                this.addPolygonPoint(pos);
                break;
            case 'text':
                this.addText(pos);
                break;
            case 'label':
                this.addLabel(pos);
                break;
            case 'erase':
                this.eraseAt(pos);
                break;
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing || !this.startPos) return;

        const pos = this.stage.getPointerPosition();

        switch (this.currentTool) {
            case 'line':
                this.updateLine(pos);
                break;
            case 'circle':
                this.updateCircle(pos);
                break;
            case 'rectangle':
                this.updateRectangle(pos);
                break;
        }
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;

        const pos = this.stage.getPointerPosition();

        switch (this.currentTool) {
            case 'line':
                this.finishLine(pos);
                break;
            case 'circle':
                this.finishCircle(pos);
                break;
            case 'rectangle':
                this.finishRectangle(pos);
                break;
        }

        this.isDrawing = false;
    }

    // Line drawing
    startLine(pos) {
        this.currentShape = new Konva.Line({
            points: [pos.x, pos.y, pos.x, pos.y],
            stroke: '#ffffff',
            strokeWidth: 2,
            lineCap: 'round',
            lineJoin: 'round',
        });
        this.layer.add(this.currentShape);
    }

    updateLine(pos) {
        if (!this.currentShape) return;
        this.currentShape.points([this.startPos.x, this.startPos.y, pos.x, pos.y]);
        this.layer.draw();
    }

    finishLine(pos) {
        if (this.currentShape) {
            this.shapes.push(this.currentShape);
            this.currentShape = null;
        }
    }

    // Circle drawing
    startCircle(pos) {
        this.currentShape = new Konva.Circle({
            x: pos.x,
            y: pos.y,
            radius: 0,
            stroke: '#ffffff',
            strokeWidth: 2,
            fill: 'transparent',
        });
        this.layer.add(this.currentShape);
    }

    updateCircle(pos) {
        if (!this.currentShape) return;
        const radius = Math.sqrt(
            Math.pow(pos.x - this.startPos.x, 2) + Math.pow(pos.y - this.startPos.y, 2)
        );
        this.currentShape.radius(radius);
        this.layer.draw();
    }

    finishCircle(pos) {
        if (this.currentShape) {
            this.shapes.push(this.currentShape);
            this.currentShape = null;
        }
    }

    // Rectangle drawing
    startRectangle(pos) {
        this.currentShape = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            stroke: '#ffffff',
            strokeWidth: 2,
            fill: 'transparent',
        });
        this.layer.add(this.currentShape);
    }

    updateRectangle(pos) {
        if (!this.currentShape) return;
        const width = pos.x - this.startPos.x;
        const height = pos.y - this.startPos.y;
        this.currentShape.width(Math.abs(width));
        this.currentShape.height(Math.abs(height));
        this.currentShape.x(width < 0 ? pos.x : this.startPos.x);
        this.currentShape.y(height < 0 ? pos.y : this.startPos.y);
        this.layer.draw();
    }

    finishRectangle(pos) {
        if (this.currentShape) {
            this.shapes.push(this.currentShape);
            this.currentShape = null;
        }
    }

    // Polygon drawing
    polygonPoints = [];
    polygonShape = null;

    addPolygonPoint(pos) {
        this.polygonPoints.push(pos.x, pos.y);

        if (!this.polygonShape) {
            this.polygonShape = new Konva.Line({
                points: this.polygonPoints,
                stroke: '#ffffff',
                strokeWidth: 2,
                fill: 'transparent',
                closed: false,
            });
            this.layer.add(this.polygonShape);
        } else {
            this.polygonShape.points(this.polygonPoints);
        }

        // Add visual point marker
        const point = new Konva.Circle({
            x: pos.x,
            y: pos.y,
            radius: 4,
            fill: '#ffffff',
        });
        this.layer.add(point);
        this.layer.draw();
    }

    finishPolygon() {
        if (this.polygonShape && this.polygonPoints.length >= 6) {
            this.polygonShape.closed(true);
            this.shapes.push(this.polygonShape);
            this.polygonPoints = [];
            this.polygonShape = null;
        }
    }

    // Text
    addText(pos) {
        const text = prompt('Enter text:');
        if (!text) return;

        const textNode = new Konva.Text({
            x: pos.x,
            y: pos.y,
            text: text,
            fontSize: 24,
            fontFamily: 'Arial',
            fill: '#ffffff',
        });
        this.layer.add(textNode);
        this.shapes.push(textNode);
        this.layer.draw();
    }

    // Label (for edges, vertices, etc.)
    addLabel(pos) {
        const label = prompt('Enter label:');
        if (!label) return;

        const group = new Konva.Group({
            x: pos.x,
            y: pos.y,
        });

        const circle = new Konva.Circle({
            radius: 12,
            fill: '#0066cc',
            stroke: '#ffffff',
            strokeWidth: 2,
        });

        const text = new Konva.Text({
            text: label,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center',
            verticalAlign: 'middle',
            x: -6,
            y: -7,
        });

        group.add(circle);
        group.add(text);
        this.layer.add(group);
        this.shapes.push(group);
        this.layer.draw();
    }

    // Erase
    eraseAt(pos) {
        const shapes = this.layer.find('Shape');
        for (let shape of shapes) {
            if (shape === this.currentShape) continue;
            if (this.isPointInShape(pos, shape)) {
                shape.destroy();
                const index = this.shapes.indexOf(shape);
                if (index > -1) {
                    this.shapes.splice(index, 1);
                }
                this.layer.draw();
                break;
            }
        }
    }

    isPointInShape(pos, shape) {
        // Simple bounding box check
        const box = shape.getClientRect();
        return pos.x >= box.x && pos.x <= box.x + box.width &&
               pos.y >= box.y && pos.y <= box.y + box.height;
    }

    // Clear all
    clear() {
        this.layer.destroyChildren();
        this.shapes = [];
        this.currentShape = null;
        this.polygonPoints = [];
        this.polygonShape = null;
        this.layer.draw();
    }

    // LLM Control Methods
    drawFromLLM(instruction) {
        // Parse LLM instruction and draw accordingly
        // This is a high-level interface for the LLM to control the blackboard
        try {
            console.log('drawFromLLM called with:', instruction);
            const command = this.parseLLMInstruction(instruction);
            console.log('Parsed command:', command);
            if (command) {
                this.executeCommand(command);
                console.log('Command executed successfully');
            } else {
                throw new Error('Failed to parse command');
            }
        } catch (error) {
            console.error('Error executing LLM instruction:', error);
            throw error; // Re-throw so caller knows it failed
        }
    }

    parseLLMInstruction(instruction) {
        // Simple parser - can be enhanced with more sophisticated NLP
        if (!instruction || typeof instruction !== 'string') {
            throw new Error('Invalid instruction: ' + instruction);
        }
        
        const lower = instruction.toLowerCase().trim();
        console.log('Parsing instruction:', instruction, 'lower:', lower);
        
        // Get canvas center as default position
        const stageWidth = this.stage ? this.stage.width() : 1200;
        const stageHeight = this.stage ? this.stage.height() : 800;
        const centerX = stageWidth / 2;
        const centerY = stageHeight / 2;
        
        // Draw a circle
        if (lower.includes('circle') || lower.includes('draw circle') || lower.includes('plot circle')) {
            const match = instruction.match(/radius[:\s]+(\d+)/i) || instruction.match(/r[:\s]*=?\s*(\d+)/i);
            const radius = match ? parseInt(match[1]) : 50;
            const centerMatch = instruction.match(/center[:\s]+\((\d+)[,\s]+(\d+)\)/i) || 
                               instruction.match(/at[:\s]+\((\d+)[,\s]+(\d+)\)/i) ||
                               instruction.match(/(\d+)[,\s]+(\d+)/);
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

        // Draw a line - handle various formats (check this first before other shape checks)
        if (lower.includes('line')) {
            console.log('Matched line command');
            // Try to find explicit coordinates first
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
            
            // Try to find "from X,Y to X,Y" format
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
            
            // Default: draw a horizontal line in the center
            const length = Math.min(200, stageWidth * 0.3);
            console.log('Drawing default line at center:', centerX, centerY, 'length:', length);
            return {
                type: 'line',
                x1: centerX - length / 2,
                y1: centerY,
                x2: centerX + length / 2,
                y2: centerY,
            };
        }

        // Draw a square
        if (lower.includes('square') || (lower.includes('draw') && lower.includes('square'))) {
            const sizeMatch = instruction.match(/size[:\s]+(\d+)/i) || instruction.match(/(\d+)[\s]*x[\s]*\d+/i);
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
        if (lower.includes('rectangle') || lower.includes('rect') || lower.includes('draw rectangle') || lower.includes('plot rectangle')) {
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
        if (lower.includes('triangle') || (lower.includes('draw') && lower.includes('triangle'))) {
            const size = 100;
            const height = size * 0.866; // Equilateral triangle height
            return {
                type: 'polygon',
                points: [
                    centerX, centerY - height * 2/3,           // Top point
                    centerX - size/2, centerY + height * 1/3, // Bottom left
                    centerX + size/2, centerY + height * 1/3  // Bottom right
                ]
            };
        }

        // Graph/plot commands
        if (lower.includes('graph') || (lower.includes('plot') && (lower.includes('function') || lower.includes('graph')))) {
            // For now, draw axes and a simple line graph
            const axisLength = Math.min(300, stageWidth * 0.4);
            
            // Draw x-axis
            const xAxis = {
                type: 'line',
                x1: centerX - axisLength / 2,
                y1: centerY,
                x2: centerX + axisLength / 2,
                y2: centerY,
            };
            
            // Draw y-axis
            const yAxis = {
                type: 'line',
                x1: centerX,
                y1: centerY - axisLength / 2,
                x2: centerX,
                y2: centerY + axisLength / 2,
            };
            
            // Execute both axes
            this.executeCommand(xAxis);
            this.executeCommand(yAxis);
            
            // Try to parse function if provided
            const funcMatch = instruction.match(/y\s*=\s*([^,]+)/i) || instruction.match(/f\(x\)\s*=\s*([^,]+)/i);
            if (funcMatch) {
                // For simple linear functions, draw a line
                // This is a simplified version - could be enhanced
                return {
                    type: 'line',
                    x1: centerX - axisLength / 2,
                    y1: centerY - 50,
                    x2: centerX + axisLength / 2,
                    y2: centerY + 50,
                };
            }
            
            return xAxis; // Return x-axis as primary command
        }

        // Add label
        if (lower.includes('label') || lower.includes('mark') || lower.includes('add label')) {
            const labelMatch = instruction.match(/label[:\s]+['"]?(\w+)['"]?/i) ||
                              instruction.match(/['"]?(\w+)['"]?/);
            const posMatch = instruction.match(/at[:\s]+\((\d+)[,\s]+(\d+)\)/i);
            if (labelMatch) {
                return {
                    type: 'label',
                    text: labelMatch[1],
                    x: posMatch ? parseInt(posMatch[1]) : centerX,
                    y: posMatch ? parseInt(posMatch[2]) : centerY,
                };
            }
        }

        // Add text
        if (lower.includes('text') || lower.includes('write') || lower.includes('add text')) {
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

        // Handle "draw" with common shapes
        if (lower.includes('draw')) {
            // Draw a square by default if no shape specified
            if (!lower.includes('circle') && !lower.includes('line') && !lower.includes('rect') && !lower.includes('triangle')) {
                return {
                    type: 'rectangle',
                    x: centerX - 50,
                    y: centerY - 50,
                    width: 100,
                    height: 100,
                };
            }
        }

        // If we get here and it's a drawing command, try to draw a simple line
        if (lower.includes('plot') || lower.includes('show') || lower.includes('graph')) {
            return {
                type: 'line',
                x1: centerX - 100,
                y1: centerY,
                x2: centerX + 100,
                y2: centerY,
            };
        }

        throw new Error('Could not parse instruction: ' + instruction);
    }

    executeCommand(command) {
        switch (command.type) {
            case 'circle':
                const circle = new Konva.Circle({
                    x: command.x,
                    y: command.y,
                    radius: command.radius,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    fill: 'transparent',
                });
                this.layer.add(circle);
                this.shapes.push(circle);
                break;

            case 'line':
                const line = new Konva.Line({
                    points: [command.x1, command.y1, command.x2, command.y2],
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    lineCap: 'round',
                });
                this.layer.add(line);
                this.shapes.push(line);
                break;

            case 'rectangle':
                const rect = new Konva.Rect({
                    x: command.x,
                    y: command.y,
                    width: command.width,
                    height: command.height,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    fill: 'transparent',
                });
                this.layer.add(rect);
                this.shapes.push(rect);
                break;

            case 'polygon':
                const polygon = new Konva.Line({
                    points: command.points,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    fill: 'transparent',
                    closed: true,
                });
                this.layer.add(polygon);
                this.shapes.push(polygon);
                break;

            case 'label':
                const labelGroup = new Konva.Group({
                    x: command.x,
                    y: command.y,
                });
                const labelCircle = new Konva.Circle({
                    radius: 12,
                    fill: '#0066cc',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                });
                const labelText = new Konva.Text({
                    text: command.text,
                    fontSize: 14,
                    fontFamily: 'Arial',
                    fill: '#ffffff',
                    align: 'center',
                    verticalAlign: 'middle',
                    x: -6,
                    y: -7,
                });
                labelGroup.add(labelCircle);
                labelGroup.add(labelText);
                this.layer.add(labelGroup);
                this.shapes.push(labelGroup);
                break;

            case 'text':
                const text = new Konva.Text({
                    x: command.x,
                    y: command.y,
                    text: command.text,
                    fontSize: 24,
                    fontFamily: 'Arial',
                    fill: '#ffffff',
                });
                this.layer.add(text);
                this.shapes.push(text);
                break;
        }

        this.layer.draw();
    }

    // Parameter controls
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
                this.onParameterChange(name, param.value);
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

    onParameterChange(name, value) {
        // Override this method to handle parameter changes
        // This will be used to update shapes based on parameters
        console.log(`Parameter ${name} changed to ${value}`);
    }
}
