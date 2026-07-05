const fs = require('fs');

let code = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');

// Change `bottom-24` to `bottom-6 md:bottom-24` so it's lower on mobile.
code = code.replace(/className="fixed bottom-24 right-6 z-\[9999\]/g, 'className="fixed bottom-6 md:bottom-24 right-6 z-[9999]');

fs.writeFileSync('src/components/DcmsAiAssistant.tsx', code);
