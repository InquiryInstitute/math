# Math Teaching Room

An interactive math teaching environment with Matrix chat, virtual blackboard, and SageMath integration.

## Features

- **Matrix Chat**: Real-time chat room for discussions
- **Interactive Blackboard**: Draw geometric shapes, lines, labels, and text
- **SageMath Integration**: Perform mathematical computations
- **LLM Control**: Natural language commands to control the blackboard
- **Interactive Parameters**: Sliders to adjust geometric parameters

## Usage

1. Open `index.html` in a web browser
2. Click "Connect" to join the Matrix chat room
3. Use the toolbar to select drawing tools
4. Draw on the blackboard or use natural language commands
5. Ask questions or request computations in the chat

## Drawing Tools

- **Select**: Select and move shapes
- **Line**: Draw lines
- **Circle**: Draw circles
- **Rectangle**: Draw rectangles
- **Polygon**: Draw polygons (click multiple points)
- **Text**: Add text labels
- **Label**: Add labeled markers
- **Erase**: Erase shapes

## Natural Language Commands

### Drawing Commands

- "Draw a circle with radius 50"
- "Draw a line from (100, 100) to (200, 200)"
- "Draw a rectangle with width 100 and height 50"
- "Add label 'A' at (300, 300)"
- "Write 'Theorem' at (500, 400)"

### Computation Commands

- "Calculate the area of a circle with radius 10"
- "Solve the equation x^2 + 5*x + 6 = 0"
- "Find the derivative of x^2"
- "Compute the integral of sin(x)"

### Parameter Commands

- "Set radius to 75"
- "Change angle to 45"

## SageMath Integration

The application uses SageMathCell for mathematical computations. SageMath can:

- Compute geometric properties (area, perimeter, etc.)
- Solve equations
- Calculate derivatives and integrals
- Perform matrix operations
- Plot functions

## Matrix Room Setup

Update the `MATRIX_ROOM_ID` in `app.js` to point to your Matrix room:

```javascript
const MATRIX_ROOM_ID = '!your-room-id:matrix.inquiry.institute';
```

## GitHub Pages Deployment

1. Push to the `main` branch
2. Enable GitHub Pages in repository settings
3. Select source branch (usually `main` or `gh-pages`)
4. The site will be available at `https://inquiryinstitute.github.io/math/`

## Development

The application uses:
- Konva.js for canvas manipulation
- Matrix JS SDK for chat
- SageMathCell for computations

All dependencies are loaded via CDN in `index.html`.
