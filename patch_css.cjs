const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

if (!content.includes('calendar-open')) {
  content += `\n
/* Add this to hide resizer and prevent sidebar interactions while modal is open */
body.calendar-open .resize-cursor,
body.calendar-open .sidebar-resizer {
  pointer-events: none !important;
  opacity: 0 !important;
  cursor: default !important;
}
`;
  fs.writeFileSync('src/index.css', content);
}
