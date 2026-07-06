const fs = require('fs');
let code = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');

// Find loading state declaration
code = code.replace(
  'const [loading, setLoading] = useState(false);',
  'const [loading, setLoading] = useState(false);\n  const [loadingText, setLoadingText] = useState("Thinking...");'
);

// Find setLoading(true) in handleSendMessage
code = code.replace(
  'setLoading(true);',
  `setLoading(true);
      setLoadingText("Thinking...");
      let phase = 0;
      const phases = ["Loading context...", "Analyzing...", "Generating response..."];
      const loadingInterval = setInterval(() => {
        if (phase < phases.length) {
          setLoadingText(phases[phase]);
          phase++;
        }
      }, 1000);`
);

// Find setLoading(false) in handleSendMessage
code = code.replace(
  /setLoading\(false\);/g,
  `clearInterval(loadingInterval);\n          setLoading(false);`
);

// The loadingInterval variable will be out of scope in the catch block unless we attach it to a ref.
// Let's attach it to a ref.
code = code.replace(
  'const messagesEndRef = useRef<HTMLDivElement>(null);',
  'const messagesEndRef = useRef<HTMLDivElement>(null);\n  const loadingIntervalRef = useRef<any>(null);'
);

code = code.replace(
  'const loadingInterval = setInterval',
  'loadingIntervalRef.current = setInterval'
);

code = code.replace(
  /clearInterval\(loadingInterval\);/g,
  'if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);'
);

// Find where the loading text is rendered
const renderRegex = /<span className="relative flex h-2\.5 w-2\.5 shrink-0">[\s\S]*?<\/span>\s*<\/span>\s*<\/div>/g;
code = code.replace(
  renderRegex,
  `<span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{loadingText}</span>
                </div>`
);

fs.writeFileSync('src/components/DcmsAiAssistant.tsx', code);
console.log("Patched streaming UI");
