# Testing Commands Guide

## Matrix Authentication

When you click "Connect", you'll be prompted for:
- **Username**: Your Matrix username (e.g., `@user:matrix.inquiry.institute`)
- **Password**: Your Matrix password

If authentication fails, it will fall back to guest mode (read-only).

## Supported Drawing Commands

### Lines
- `plot a line`
- `draw line`
- `plot line`
- `draw a line from 100,100 to 200,200`
- `line from (100, 100) to (200, 200)`

### Circles
- `draw circle`
- `plot circle`
- `draw a circle with radius 50`
- `circle radius 75`
- `circle at (300, 400) with radius 60`

### Rectangles
- `draw rectangle`
- `plot rectangle`
- `rectangle width 100 height 80`
- `draw rectangle 150x100`

### Labels
- `add label A`
- `label B at (200, 300)`
- `mark point C`

### Text
- `write "Hello"`
- `add text "Theorem"`
- `text "Pythagorean" at (400, 500)`

## Example Test Sequence

1. **Connect to Matrix** - Click "Connect" and enter credentials
2. **Test simple line**: Type `plot a line` in chat
3. **Test circle**: Type `draw circle radius 50`
4. **Test rectangle**: Type `draw rectangle width 100 height 80`
5. **Test label**: Type `add label A`
6. **Test text**: Type `write "Test"`

## Natural Language Variations

The parser handles various phrasings:
- "plot", "draw", "create", "show", "display"
- "a line", "line", "lines"
- "circle", "circle with radius X", "circle at (X,Y)"
- Coordinates can be in format: `(100, 200)` or `100,200`

## Troubleshooting

If a command doesn't work:
1. Check browser console for error messages
2. Try a simpler command first
3. Use explicit coordinates: `line from (100, 100) to (200, 200)`
4. Check that the blackboard canvas is visible and responsive
