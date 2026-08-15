const fs = require('fs');
let content = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf-8');

const targetInterval = `    setLoading(true);

      setLoadingText("Thinking...");
      let phase = 0;
      const phases = ["Loading context...", "Analyzing...", "Generating response..."];
      loadingIntervalRef.current = setInterval(() => {`;

const replacementInterval = `    setLoading(true);

      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      setLoadingText("Thinking...");
      let phase = 0;
      const phases = ["Loading context...", "Analyzing...", "Generating response..."];
      loadingIntervalRef.current = setInterval(() => {`;

content = content.replace(targetInterval, replacementInterval);

fs.writeFileSync('src/components/DcmsAiAssistant.tsx', content);
