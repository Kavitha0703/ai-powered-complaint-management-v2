const fs = require('fs');
let code = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');

code = code.replace(
  'const [loading, setLoading] = useState(false);\n  const [loadingText, setLoadingText] = useState("Thinking...");',
  'const [loading, setLoading] = useState(false);'
);

fs.writeFileSync('src/components/DcmsAiAssistant.tsx', code);
console.log("Fixed redeclaration");
