const fs = require('fs');
let content = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');

content = content.replace(
  /messages: ChatMessage\[\];/, 
  "messages: ChatMessage[];\n  is_pinned?: boolean;"
);

content = content.replace(
  /Trash2, HelpCircle, FileText, ImageIcon, Lightbulb/, 
  "Trash2, HelpCircle, FileText, ImageIcon, Lightbulb, Pin, DownloadCloud, Edit3, Search, Copy, CheckCircle2"
);

content = content.replace(
  /const \[threads, setThreads\] = useState<ChatThread\[\]>\(\(\) => \{[\s\S]*?return \[\];\n  \}\);/,
  "const [threads, setThreads] = useState<ChatThread[]>([]);"
);

content = content.replace(
  /const \[activeThreadId, setActiveThreadId\] = useState<string \| null>\(\(\) => \{[\s\S]*?return null;\n  \}\);/,
  "const [activeThreadId, setActiveThreadId] = useState<string | null>(null);"
);

fs.writeFileSync('src/components/DcmsAiAssistant.tsx', content);
console.log("Patched");
