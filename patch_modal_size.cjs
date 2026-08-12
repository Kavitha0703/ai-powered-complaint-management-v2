const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

code = code.replace(
  "inline ? 'w-full' : 'w-[90vw] md:w-full md:max-w-[800px] h-[90vh] md:h-[600px]'",
  "inline ? 'w-full' : 'w-[92vw] max-w-[820px] h-[88vh] max-h-[620px]'"
);

// We need to make sure the inner scrolling is correct.
// The container has `flex flex-col` and `overflow-hidden`.
// The inner body has `flex-1 overflow-y-auto`.

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched modal size");
