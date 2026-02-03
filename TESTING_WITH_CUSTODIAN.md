# Testing with Custodian Account

## Quick Start

1. **Open the Math Teaching Room**: https://math.inquiry.institute
2. **Click "Connect"** button
3. **Username is pre-filled**: `@custodian:matrix.inquiry.institute`
4. **Enter password**: Your custodian Matrix password
5. **Click "Connect"** or press Enter

## Test Commands

Once connected, try these commands in the chat:

### Drawing Commands
- `plot a line` - Draws a horizontal line in the center
- `draw circle radius 50` - Draws a circle
- `draw rectangle width 100 height 80` - Draws a rectangle
- `add label A` - Adds a labeled marker
- `write "Test"` - Adds text to the blackboard

### Computation Commands
- `calculate the area of a circle with radius 10`
- `solve the equation x^2 + 5*x + 6 = 0`
- `find the derivative of x^2`

### Parameter Commands
- `set radius to 75`
- `change angle to 45`

## Matrix Room

The app connects to: `!math:matrix.inquiry.institute`

Make sure:
- The room exists on your Matrix server
- The custodian account has access to the room
- The room is configured for the math teaching use case

## Troubleshooting

### Connection Fails
- Check that `@custodian:matrix.inquiry.institute` exists on your Matrix server
- Verify the password is correct
- Check browser console for error messages
- Try guest mode (will be read-only)

### Commands Not Working
- Check browser console for parsing errors
- Try simpler commands first (e.g., `plot a line`)
- Verify the blackboard canvas is visible and responsive

### Matrix Room Not Found
- Create the room: `!math:matrix.inquiry.institute`
- Invite custodian to the room
- Make sure the room is accessible
