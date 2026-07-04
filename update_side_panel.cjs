const fs = require('fs');

let code = fs.readFileSync('src/pages/UserPages.tsx', 'utf8');

const regex = /\{\/\* COMPLAINT QUALITY METRICS \(AI REPLACEMENT\) \*\/\}([\s\S]*?)<\/div>\s*(?:\r?\n){2,}/;

const newSidePanel = `{/* COMPLAINT QUALITY METRICS (AI REPLACEMENT) */}
        <div className="space-y-6 md:col-span-1">
          {/* AI Complaint Score / Assistant */}
          <Card className="border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <Sparkles className="w-24 h-24" />
            </div>
            <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/60">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> {"AI Complaint Score"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                </div>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">86%</span>
              </div>
              
              <div className="space-y-2.5 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{"Clear description"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="flex-1">{"Missing Location"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="flex-1">{"Missing Device Model"}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-bold uppercase tracking-wider mb-1">{"Suggested Improvement"}</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{"Mention the exact laptop serial number or asset tag."}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Auto Summary */}
          <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {"AI Auto Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-y-3">
                   <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{"Department"}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{department}</p>
                   </div>
                   <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{"Priority"}</p>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-500 mt-0.5">{severity}</p>
                   </div>
                   <div className="col-span-2">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{"Issue"}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-1">{title || '---'}</p>
                   </div>
                </div>
            </CardContent>
          </Card>

          {/* AI Suggested Solutions */}
          <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {"Try Before Submitting"}
              </CardTitle>
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent className="pt-3 pb-3 space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors flex items-center justify-between group">
                   <span>{"Restart Device"}</span>
                   <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </button>
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors flex items-center justify-between group">
                   <span>{"Clear Browser Cache"}</span>
                   <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </button>
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors flex items-center justify-between group">
                   <span>{"Reconnect Network"}</span>
                   <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </button>
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors flex items-center justify-between group">
                   <span>{"Update Drivers"}</span>
                   <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </button>
            </CardContent>
          </Card>

          {/* Required Evidence */}
          <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {"Recommended Uploads"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                   <div className={\`flex items-center gap-1.5 \${attachments.length > 0 ? 'text-emerald-500' : ''}\`}>
                      {attachments.length > 0 ? <CheckSquare className="w-3.5 h-3.5" /> : <div className="w-3 h-3 border-2 border-current rounded-sm opacity-50" />}
                      {"Screenshot"}
                   </div>
                   <div className="flex items-center gap-1.5 text-emerald-500">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {"Error Message"}
                   </div>
                   <div className="flex items-center gap-1.5 text-emerald-500">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {"Log File"}
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-current rounded-sm opacity-50" />
                      {"Video"}
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-current rounded-sm opacity-50" />
                      {"Invoice"}
                   </div>
                </div>
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{"Evidence Quality"}</span>
                      <span className="text-xs font-black text-emerald-500">{"Good"}</span>
                   </div>
                </div>
            </CardContent>
          </Card>

          {/* AI Attachment Analysis */}
          {attachments.length > 0 && (
            <Card className="border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-[#0B1222]">
              <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/60">
                <CardTitle className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" /> {"AI Image Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-500">
                       <CheckCircle2 className="w-3.5 h-3.5" /> {"Device Detected"}
                     </div>
                     <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-xs border border-slate-100 dark:border-slate-700">Dell Latitude 5420</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-500">
                       <CheckCircle2 className="w-3.5 h-3.5" /> {"Error Code"}
                     </div>
                     <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-xs border border-slate-100 dark:border-slate-700">0x0000007B</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-500">
                       <CheckCircle2 className="w-3.5 h-3.5" /> {"Screen Quality"}
                     </div>
                     <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Excellent</span>
                  </div>
                  <div className="mt-2 pt-3 border-t border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{"AI Confidence"}</span>
                     <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{"97%"}</span>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Estimated Waiting Time & Timeline */}
          <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {"Expected Resolution"}
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{"Current Queue"}</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{"4 Tickets"}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{"Avg Resolution"}</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{"3 Hours"}</p>
                 </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-[#11192A] rounded-xl border border-blue-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-300">{"Engineer Assigned"}</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-sm">{"Within 15 min"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{"Probability"}</span>
                  <span className="text-xs font-black text-emerald-500">{"96%"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Complaints Prevention & Duplicate Detection */}
          <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 px-4 py-2.5 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{"Possible Duplicate"}</span>
               </div>
               <button className="text-[10px] font-bold text-blue-600 hover:underline">{"[View #54860]"}</button>
            </div>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {"94 Similar Complaints Found"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{"89 Resolved"}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{"5 Open"}</span>
                 </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">{"Common Fix"}</p>
                 <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{"Driver Update / Firmware Patch"}</p>
              </div>
            </CardContent>
          </Card>

        </div>
`;

code = code.replace(regex, newSidePanel + "\n\n");
fs.writeFileSync('src/pages/UserPages.tsx', code);
