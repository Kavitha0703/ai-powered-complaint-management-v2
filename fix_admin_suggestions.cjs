const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPages.tsx', 'utf-8');

const target1 = `  const handleViewTicket = async (ticket: any) => {`;
const fetchLogic = `
  const fetchAiSuggestion = async () => {
    if (!selectedTicket) return;
    setLoadingSuggestion(true);
    setAiSuggestion("");
    try {
      const response = await fetch("/api/gemini/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: selectedTicket.description, category: selectedTicket.issue_type }),
      });
      const data = await response.json();
      if (data.solutions && Array.isArray(data.solutions)) {
        setAiSuggestion(
          data.solutions
            .map((s: string, idx: number) => \`\${idx + 1}. \${s}\`)
            .join("\\n"),
        );
      } else if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      } else if (data.error) {
        setAiSuggestion(\`AI analysis is temporarily unavailable. Please try again. (\${data.error})\`);
      } else {
        setAiSuggestion("No automated recommendation summary generated.");
      }
    } catch (err) {
      console.error(err);
      setAiSuggestion("AI analysis is temporarily unavailable. Please try again.");
    } finally {
      setLoadingSuggestion(false);
    }
  };

`;

content = content.replace(target1, fetchLogic + target1);

const uiTarget = `                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100 bg-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-full px-3 py-1 w-fit shadow-xs border border-blue-400/20">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                        {"Gemini AI Resolution Suggestions"}</div>
                      {loadingSuggestion ? (
                        <div className="text-xs text-[#64748B] dark:text-slate-405 italic flex items-center gap-2 py-3 font-mono">
                          <div className="w-2 h-2 bg-blue-500 animate-ping rounded-full"></div>
                          {"Consulting cognitive database & writing expert \
                          suggestion..."}</div>
                      ) : (
                        <div className="text-xs text-slate-700 dark:text-slate-200 space-y-1 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {aiSuggestion}
                        </div>
                      )}`;

const newUI = `                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100 bg-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-full px-3 py-1 w-fit shadow-xs border border-blue-400/20">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                          {"Gemini AI Resolution Suggestions"}
                        </div>
                        {!aiSuggestion && !loadingSuggestion && (
                          <button onClick={fetchAiSuggestion} className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                            Generate AI Suggestions
                          </button>
                        )}
                      </div>
                      {loadingSuggestion ? (
                        <div className="text-xs text-[#64748B] dark:text-slate-405 italic flex items-center gap-2 py-3 font-mono">
                          <div className="w-2 h-2 bg-blue-500 animate-ping rounded-full"></div>
                          {"Consulting cognitive database & writing expert \
                          suggestion..."}</div>
                      ) : aiSuggestion ? (
                        <div className="text-xs text-slate-700 dark:text-slate-200 space-y-1 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {aiSuggestion}
                          <div className="mt-3 text-right">
                             <button onClick={fetchAiSuggestion} className="text-[10px] text-blue-500 hover:underline font-bold cursor-pointer">Retry Analysis</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">No suggestions generated yet.</div>
                      )}`;

content = content.replace(uiTarget, newUI);

fs.writeFileSync('src/pages/AdminPages.tsx', content);
