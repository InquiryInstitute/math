/**
 * SageMath Integration
 * Uses SageMathCell for mathematical computations
 */

class SageIntegration {
    constructor() {
        this.sageCells = [];
        this.isReady = false;
        this.initSageCell();
    }

    initSageCell() {
        // Initialize SageMathCell
        if (typeof sagecell !== 'undefined') {
            sagecell.makeSagecell({
                inputLocation: '#sage-cell',
                hide: ['editor', 'evalButton', 'fullScreen', 'permalink'],
                autoeval: true,
            });
            this.isReady = true;
            this.updateStatus('ready');
        } else {
            console.error('SageMathCell not loaded');
            this.updateStatus('error');
        }
    }

    updateStatus(status) {
        const statusEl = document.getElementById('sage-status');
        if (statusEl) {
            statusEl.textContent = status === 'ready' ? 'Ready' : 'Error';
            statusEl.className = `status-indicator ${status === 'ready' ? 'connected' : 'disconnected'}`;
        }
    }

    /**
     * Execute Sage code and return result
     */
    async execute(code) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                reject(new Error('SageMathCell not ready'));
                return;
            }

            // Create a temporary sagecell
            const tempDiv = document.createElement('div');
            tempDiv.id = `sage-temp-${Date.now()}`;
            document.body.appendChild(tempDiv);

            sagecell.makeSagecell({
                inputLocation: `#${tempDiv.id}`,
                hide: ['editor', 'evalButton', 'fullScreen', 'permalink'],
                autoeval: true,
                callback: (cell) => {
                    cell.evaluate();
                    
                    // Wait for result
                    const checkResult = setInterval(() => {
                        try {
                            const result = cell.getOutput();
                            if (result) {
                                clearInterval(checkResult);
                                document.body.removeChild(tempDiv);
                                resolve(result);
                            }
                        } catch (error) {
                            // Still waiting
                        }
                    }, 100);

                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkResult);
                        document.body.removeChild(tempDiv);
                        reject(new Error('Sage computation timeout'));
                    }, 10000);
                },
            });
        });
    }

    /**
     * Compute geometric properties
     */
    async computeGeometry(shape, params) {
        let code = '';

        switch (shape) {
            case 'circle':
                code = `
var('r')
area = pi * r^2
circumference = 2 * pi * r
print(f"Area: {area}")
print(f"Circumference: {circumference}")
print(f"With r = {params.radius}:")
print(f"Area = {pi * params.radius^2}")
print(f"Circumference = {2 * pi * params.radius}")
                `;
                break;

            case 'triangle':
                code = `
var('a', 'b', 'c')
# Using Heron's formula
s = (a + b + c) / 2
area = sqrt(s * (s - a) * (s - b) * (s - c))
print(f"Area (Heron's formula): {area}")
print(f"With sides {params.a}, {params.b}, {params.c}:")
s_val = (params.a + params.b + params.c) / 2
area_val = sqrt(s_val * (s_val - params.a) * (s_val - params.b) * (s_val - params.c))
print(f"Area = {area_val}")
                `;
                break;

            case 'rectangle':
                code = `
var('w', 'h')
area = w * h
perimeter = 2 * (w + h)
diagonal = sqrt(w^2 + h^2)
print(f"Area: {area}")
print(f"Perimeter: {perimeter}")
print(f"Diagonal: {diagonal}")
print(f"With w = {params.width}, h = {params.height}:")
print(f"Area = {params.width * params.height}")
print(f"Perimeter = {2 * (params.width + params.height)}")
print(f"Diagonal = {sqrt(params.width^2 + params.height^2)}")
                `;
                break;

            case 'polygon':
                code = `
var('n', 's')
# Regular polygon
area = (n * s^2) / (4 * tan(pi / n))
perimeter = n * s
print(f"Area (regular {n}-gon): {area}")
print(f"Perimeter: {perimeter}")
                `;
                break;
        }

        if (code) {
            return await this.execute(code);
        }
    }

    /**
     * Solve equations
     */
    async solveEquation(equation, variable = 'x') {
        const code = `
var('${variable}')
eq = ${equation}
solutions = solve(eq, ${variable})
print(f"Solutions: {solutions}")
show(solutions)
        `;
        return await this.execute(code);
    }

    /**
     * Plot function
     */
    async plotFunction(expression, xRange = [-10, 10], yRange = null) {
        const code = `
var('x')
f(x) = ${expression}
p = plot(f, (x, ${xRange[0]}, ${xRange[1]}))
if ${yRange !== null}:
    p.ymin(${yRange[0]})
    p.ymax(${yRange[1]})
show(p)
        `;
        return await this.execute(code);
    }

    /**
     * Compute derivatives
     */
    async derivative(expression, variable = 'x', order = 1) {
        const code = `
var('${variable}')
f(${variable}) = ${expression}
df = diff(f, ${variable}, ${order})
print(f"Derivative: {df}")
show(df)
        `;
        return await this.execute(code);
    }

    /**
     * Compute integrals
     */
    async integral(expression, variable = 'x', bounds = null) {
        let code = '';
        if (bounds) {
            code = `
var('${variable}')
f(${variable}) = ${expression}
result = integral(f, ${variable}, ${bounds[0]}, ${bounds[1]})
print(f"Definite integral: {result}")
show(result)
            `;
        } else {
            code = `
var('${variable}')
f(${variable}) = ${expression}
result = integral(f, ${variable})
print(f"Indefinite integral: {result}")
show(result)
            `;
        }
        return await this.execute(code);
    }

    /**
     * Matrix operations
     */
    async matrixOperation(operation, matrix1, matrix2 = null) {
        let code = '';
        switch (operation) {
            case 'multiply':
                code = `
A = matrix(${JSON.stringify(matrix1)})
B = matrix(${JSON.stringify(matrix2)})
result = A * B
print(f"Result: {result}")
show(result)
                `;
                break;
            case 'determinant':
                code = `
A = matrix(${JSON.stringify(matrix1)})
det = A.determinant()
print(f"Determinant: {det}")
show(det)
                `;
                break;
            case 'inverse':
                code = `
A = matrix(${JSON.stringify(matrix1)})
inv = A.inverse()
print(f"Inverse: {inv}")
show(inv)
                `;
                break;
        }
        if (code) {
            return await this.execute(code);
        }
    }
}
