# Frontend conventions
- Keep Pixel Quest presentation in the existing global tokens, shared controls and SVG sprites so visual changes never require processing or data changes.
- Load remote fonts through document-head link elements, not CSS imports, so font loading is independent of the CSS compiler.
- Keep avatar customization and battle records in a separate persisted player store; study session and quiz progress must remain unchanged by duels.
- AI arena opponents use a local difficulty-based quiz simulation over existing AI-generated study questions; label the mode versus AI, never as online human multiplayer.