const fs = require('fs');

let code = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');

const regex = /const defaultMsg: ChatMessage = {\s*id: "welcome_" \+ Date\.now\(\),\s*sender: "assistant",\s*text: greetingText,\s*timestamp: Date\.now\(\)\s*};/;

const replacement = `const defaultMsg: ChatMessage = {
      id: "welcome_" + Date.now(),
      sender: "assistant",
      text: greetingText,
      timestamp: Date.now(),
      quickActions: ["register_ticket", "view_tickets", "view_notices"]
    };`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/DcmsAiAssistant.tsx', code);
