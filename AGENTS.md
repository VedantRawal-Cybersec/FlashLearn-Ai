# Frontend conventions
- Keep Pixel Quest presentation in the existing global tokens, shared controls and SVG sprites so visual changes never require processing or data changes.
- Load remote fonts through document-head link elements, not CSS imports, so font loading is independent of the CSS compiler.
- Keep avatar customization and battle records in a separate persisted player store; study session and quiz progress must remain unchanged by duels.
- AI arena opponents use a local difficulty-based quiz simulation over existing AI-generated study questions; label the mode versus AI, never as online human multiplayer.
- Share validated study-generation options between the source form and generation function so both input paths follow the same contract.
- Ground exam practice with curated, dated official reference excerpts rather than per-request search calls to keep costs low and provenance explicit.
- Persist generation provenance in the first quiz question's existing JSON payload and reconstruct it on session load to avoid schema changes and retain history compatibility.