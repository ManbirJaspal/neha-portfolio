# Neha Jaspal: portfolio

Static site, no build step for the code. `index.html`, `css/site.css` and ES modules in `js/`.

- `js/field.js`: the WebGL particle field (three.js)
- `js/chat.js`: the working recreation of the eBay.ai returns chat
- `js/cases.js`: the three case studies
- `js/app.js`: navigation, work cards, skills graph, ask panel
- `js/media.js`: one switch for where images load from

Images are copied from the old Framer site at deploy time by `tools/build-images.mjs` and served from `img/`.
To change copy, edit `index.html` (home) or `js/cases.js` (case studies) and push to `main`.
