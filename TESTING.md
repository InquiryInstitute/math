# Testing Guide

## Quick Test: Ask Pythagoras About His Theorem

### Option 1: Direct Browser Test

1. **Open the test page:**
   - tldraw: https://math.inquiry.institute/tldraw/test.html
   - excalidraw: https://math.inquiry.institute/excalidraw/index.html

2. **Connect to Matrix (optional):**
   - Click "Connect" button
   - Enter Matrix username: `@custodian:matrix.inquiry.institute`
   - Enter Matrix password (stored in localStorage if previously saved)

3. **Ask Pythagoras:**
   - Type in the chat: "Can you explain your theorem?"
   - Or: "Explain the Pythagorean theorem"
   - Or: "What is a² + b² = c²?"

4. **Watch the response:**
   - Pythagoras will respond via ask-faculty
   - If he mentions graphing, Desmos calculators will appear
   - If he mentions drawing, shapes will appear on the whiteboard
   - Math formulas will render with KaTeX

### Option 2: Browser Console Test

Open browser console and run:

```javascript
// Set Supabase credentials if needed (optional, defaults are set)
window.SUPABASE_URL = 'https://xougqdomkoisrxdnagcj.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_1Zt0VjMX57VdYC7dH-GG1A_RFZyuwc9';

// Test asking Pythagoras directly
if (askFacultyClient) {
    askFacultyClient.ask("Can you explain your theorem?").then(result => {
        console.log('Pythagoras says:', result.response);
    });
}
```

### Option 3: Matrix Room Test

1. Connect to Matrix room `!math:matrix.inquiry.institute`
2. Send message: "Can you explain your theorem?"
3. The message will be sent to Pythagoras via ask-faculty
4. Response will appear in chat and may trigger whiteboard actions

## Expected Behavior

When you ask Pythagoras about his theorem:

1. **LLM Response**: Pythagoras will explain the theorem in his voice
2. **CAS Tool**: If computation is needed, the CAS edge function will be called
3. **Whiteboard Actions**: If Pythagoras mentions:
   - "Let me draw a right triangle" → Triangle appears on whiteboard
   - "Graph the relationship" → Desmos calculator appears
   - "Here's a diagram" → Shapes drawn via tldraw/excalidraw

## Troubleshooting

### No Response from Pythagoras

- Check browser console for errors
- Verify Supabase URL is correct: `https://xougqdomkoisrxdnagcj.supabase.co`
- Check that ask-faculty edge function is deployed
- Verify `a.pythagoras` exists in the faculty table

### Desmos Not Appearing

- Check that Desmos integration script is loaded
- Verify whiteboard container exists (`#tldraw-canvas` or `#excalidraw-wrapper`)
- Check browser console for JavaScript errors

### Matrix Connection Issues

- Verify Matrix server is accessible: `https://matrix.inquiry.institute`
- Check Matrix credentials are correct
- Room ID should be: `!math:matrix.inquiry.institute`

## Example Questions to Test

1. "Can you explain your theorem?"
2. "What is a² + b² = c²?"
3. "Draw a right triangle and label the sides"
4. "Graph y = x²"
5. "Show me a 3-4-5 triangle"
6. "Calculate the hypotenuse of a triangle with legs 3 and 4"
