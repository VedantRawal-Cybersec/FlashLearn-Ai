# Frontend conventions
- Keep Pixel Quest presentation in the existing global tokens, shared controls and SVG sprites so visual changes never require processing or data changes.
- Load remote fonts through document-head link elements, not CSS imports, so font loading is independent of the CSS compiler.