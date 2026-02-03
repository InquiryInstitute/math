/**
 * Interactive Blackboard with Geometry Drawing Tools
 * Uses Konva.js for canvas manipulation
 */

class Blackboard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.stage = new Konva.Stage({
            container: canvasId,
            width: 1200,
            height: 800,
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
            const command = this.parseLLMInstruction(instruction);
            this.executeCommand(command);
        } catch (error) {
            console.error('Error executing LLM instruction:', error);
        }
    }

    parseLLMInstruction(instruction) {
        // Simple parser - can be enhanced with more sophisticated NLP
        const lower = instruction.toLowerCase();
        
        // Draw a circle
        if (lower.includes('circle') || lower.includes('draw circle')) {
            const match = instruction.match(/radius[:\s]+(\d+)/i) || instruction.match(/r[:\s]*=?\s*(\d+)/i);
            const radius = match ? parseInt(match[1]) : 50;
            const centerMatch = instruction.match(/center[:\s]+\((\d+)[,\s]+(\d+)\)/i);
            const center = centerMatch 
                ? { x: parseInt(centerMatch[1]), y: parseInt(centerMatch[2]) }
                : { x: 600, y: 400 };
            
            return {
                type: 'circle',
                x: center.x,
                y: center.y,
                radius: radius,
            };
        }

        // Draw a line
        if (lower.includes('line') || lower.includes('draw line')) {
            const points = instruction.match(/\((\d+)[,\s]+(\d+)\)/g);
            if (points && points.length >= 2) {
                const p1 = points[0].match(/(\d+)[,\s]+(\d+)/);
                const p2 = points[1].match(/(\d+)[,\s]+(\d+)/);
                return {
                    type: 'line',
                    x1: parseInt(p1[1]),
                    y1: parseInt(p1[2]),
                    x2: parseInt(p2[1]),
                    y2: parseInt(p2[2]),
                };
            }
        }

        // Draw a rectangle
        if (lower.includes('rectangle') || lower.includes('rect')) {
            const match = instruction.match(/width[:\s]+(\d+).*height[:\s]+(\d+)/i);
            if (match) {
                return {
                    type: 'rectangle',
                    x: 400,
                    y: 300,
                    width: parseInt(match[1]),
                    height: parseInt(match[2]),
                };
            }
        }

        // Add label
        if (lower.includes('label') || lower.includes('mark')) {
            const labelMatch = instruction.match(/label[:\s]+['"]?(\w+)['"]?/i);
            const posMatch = instruction.match(/at[:\s]+\((\d+)[,\s]+(\d+)\)/i);
            if (labelMatch) {
                return {
                    type: 'label',
                    text: labelMatch[1],
                    x: posMatch ? parseInt(posMatch[1]) : 600,
                    y: posMatch ? parseInt(posMatch[2]) : 400,
                };
            }
        }

        // Add text
        if (lower.includes('text') || lower.includes('write')) {
            const textMatch = instruction.match(/['"]([^'"]+)['"]/);
            const posMatch = instruction.match(/at[:\s]+\((\d+)[,\s]+(\d+)\)/i);
            if (textMatch) {
                return {
                    type: 'text',
                    text: textMatch[1],
                    x: posMatch ? parseInt(posMatch[1]) : 600,
                    y: posMatch ? parseInt(posMatch[2]) : 400,
                };
            }
        }

        throw new Error('Could not parse instruction');
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
