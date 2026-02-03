# LLM Commands Test Guide

Test various natural language commands to control the whiteboard.

## Drawing Commands

### Basic Shapes

- `draw a square` - Draws a 100x100 square in the center
- `draw a circle` - Draws a circle with radius 50
- `draw a rectangle` - Draws a 100x80 rectangle
- `draw a triangle` - Draws an equilateral triangle
- `draw a line` - Draws a horizontal line
- `plot a line` - Same as draw a line

### With Parameters

- `draw a circle with radius 75`
- `draw a square size 150`
- `draw rectangle width 200 height 100`
- `draw line from 100,100 to 300,300`

### Graph/Plot Commands

- `graph` - Draws coordinate axes (x and y axes)
- `plot a graph` - Same as graph
- `graph a function` - Draws axes
- `plot y = x` - Draws axes and a line (simplified)

### Labels and Text

- `add label A` - Adds a labeled marker
- `label point B at (200, 300)`
- `write "Theorem"` - Adds text
- `add text "Pythagorean" at (400, 500)`

## Test Sequence

Try these commands in order:

1. `draw a square` - Should draw a square
2. `draw a circle radius 60` - Should draw a circle
3. `graph` - Should draw coordinate axes
4. `draw a triangle` - Should draw a triangle
5. `draw a line` - Should draw a horizontal line
6. `add label A` - Should add a labeled marker
7. `write "Test"` - Should add text

## Advanced Commands

- `draw rectangle width 150 height 100`
- `draw circle at (400, 300) with radius 50`
- `draw line from (100, 200) to (500, 400)`

## Troubleshooting

If a command doesn't work:
1. Check browser console for parsing errors
2. Try simpler commands first
3. Use explicit coordinates if needed
4. Check that the blackboard canvas is visible

## Expected Behavior

- Commands should execute immediately
- Shapes should appear on the whiteboard
- System should respond with "Drawing command executed"
- Errors should appear in chat if parsing fails
