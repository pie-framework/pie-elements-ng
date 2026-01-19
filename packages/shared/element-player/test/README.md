# Element Player Standalone Test

This directory contains a standalone test page for the `<pie-element-player>` web component.

## Testing Instructions

### Prerequisites

- Element player must be built
- Hotspot element must be built
- Local ESM CDN must be running

### Steps

1. **Build the element player** (if not already built):
   ```bash
   cd packages/shared/element-player
   bun run build
   ```

2. **Start local-esm-cdn** (in a separate terminal):
   ```bash
   bun run local-esm-cdn
   ```
   This will start on port 5179.

3. **Build the hotspot element** (in another terminal):
   ```bash
   bun run build --filter @pie-element/hotspot
   ```

4. **Serve the test page** (from the element-player directory):
   ```bash
   cd packages/shared/element-player
   bun run test:serve
   ```
   This will start an HTTP server on port 5175.

5. **Open the test page** in your browser:
   ```
   http://localhost:5175/test/index.html
   ```

### Verification Checklist

Open the browser console and verify:

- ✅ No errors in console
- ✅ "✓ pie-element-player custom element is defined" appears
- ✅ "✓ Element player initialized successfully" appears
- ✅ Hotspot element renders with clickable areas
- ✅ Mode switcher shows Gather/View/Evaluate options
- ✅ Session panel shows session state as JSON
- ✅ Clicking mode buttons changes the mode
- ✅ Clicking hotspot areas updates the session
- ✅ Switching to Evaluate mode shows scoring panel
- ✅ Reset button clears the session
- ✅ All UI elements are styled correctly

### Expected Behavior

**In Gather Mode:**
- User can click on hotspot areas
- Session updates with clicked coordinates
- Session panel shows the updated answers array

**In View Mode:**
- Same as Gather but typically read-only (depends on element implementation)

**In Evaluate Mode:**
- Controller is called to score the session
- Scoring panel appears with score results
- Correct/incorrect feedback may be shown

**Reset Button:**
- Clears all session data
- Switches back to Gather mode
- Element resets to initial state

### Troubleshooting

**Element doesn't load:**
- Check that local-esm-cdn is running on port 5179
- Check that hotspot element is built (`packages/elements-react/hotspot/dist/index.js` exists)
- Check browser console for import errors

**No scoring in Evaluate mode:**
- Check that controller is available (`packages/elements-react/hotspot/dist/controller/index.js` exists)
- Check browser console for controller errors

**HTTP server won't start:**
- Check if port 5175 is already in use
- Try a different port: `python3 -m http.server 5176`
- Update the URL accordingly
