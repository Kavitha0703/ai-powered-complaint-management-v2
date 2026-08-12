const fs = require('fs');

// Patch index.css
let css = fs.readFileSync('src/index.css', 'utf-8');
css += `\n
/* Modal Overlay Global Lock */
body.modal-open {
  overflow: hidden;
}

body.modal-open .cursor-col-resize {
  pointer-events: none !important;
  cursor: default !important;
}

/* Ensure backdrop covers everything */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
}
`;
fs.writeFileSync('src/index.css', css);

// Patch ResizablePanel.tsx
let panel = fs.readFileSync('src/components/ResizablePanel.tsx', 'utf-8');
const searchPanel = `  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow left click
    if (e.button !== 0) return;`;

const replacePanel = `  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow left click
    if (e.button !== 0) return;
    if (document.body.classList.contains('modal-open')) return;`;

panel = panel.replace(searchPanel, replacePanel);
fs.writeFileSync('src/components/ResizablePanel.tsx', panel);
console.log("Patched CSS and ResizablePanel");
