const fs = require('fs');
let code = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');

const targetStr = `{/* Classification suggestions */}`;

const replaceStr = `{m.aiAnalysis && m.aiAnalysis.detectedIssue && (
  <div className="mt-3.5 p-3 bg-gradient-to-br from-indigo-950/40 to-blue-900/20 border border-indigo-500/20 rounded-xl space-y-2">
    <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1 font-mono">
        <Sparkles className="w-3 h-3 text-indigo-400" /> AI Analysis
      </span>
      {m.aiAnalysis.confidence && (
        <span className="text-[9px] font-bold text-slate-400 bg-black/30 px-1.5 py-0.5 rounded">
          Confidence: <span className="text-emerald-400">{m.aiAnalysis.confidence}</span>
        </span>
      )}
    </div>
    
    <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed">
      <div>
        <span className="text-slate-500 font-bold block mb-0.5">Detected Issue</span>
        <span className="text-slate-200 font-medium">{m.aiAnalysis.detectedIssue}</span>
      </div>
      <div>
        <span className="text-slate-500 font-bold block mb-0.5">Priority</span>
        <span className={\`font-medium \${m.aiAnalysis.priority === 'Urgent' || m.aiAnalysis.priority === 'Critical' ? 'text-rose-400' : 'text-amber-400'}\`}>{m.aiAnalysis.priority || 'Normal'}</span>
      </div>
      
      {m.aiAnalysis.businessImpact && (
        <div className="col-span-2">
          <span className="text-slate-500 font-bold block mb-0.5">Business Impact</span>
          <span className="text-slate-200 font-medium">{m.aiAnalysis.businessImpact}</span>
        </div>
      )}
      
      {m.aiAnalysis.rootCause && (
        <div className="col-span-2">
          <span className="text-slate-500 font-bold block mb-0.5">Likely Root Cause</span>
          <span className="text-slate-200 font-medium">{m.aiAnalysis.rootCause}</span>
        </div>
      )}
      
      {m.aiAnalysis.recommendedAction && (
        <div className="col-span-2">
          <span className="text-slate-500 font-bold block mb-0.5">Recommended Action</span>
          <span className="text-indigo-300 font-medium">{m.aiAnalysis.recommendedAction}</span>
        </div>
      )}
      
      <div className="flex items-center gap-4 col-span-2 pt-1 border-t border-indigo-500/10">
        {m.aiAnalysis.estimatedResolution && (
          <div>
            <span className="text-slate-500 font-bold mr-1">Est. Resolution:</span>
            <span className="text-slate-300 font-medium">{m.aiAnalysis.estimatedResolution}</span>
          </div>
        )}
        {m.aiAnalysis.sla && (
          <div>
            <span className="text-slate-500 font-bold mr-1">SLA:</span>
            <span className="text-slate-300 font-medium">{m.aiAnalysis.sla}</span>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/* Classification suggestions */}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/DcmsAiAssistant.tsx', code);
