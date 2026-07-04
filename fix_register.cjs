const fs = require('fs');
let code = fs.readFileSync('src/pages/UserPages.tsx', 'utf8');

const regex = /\/\* Accessibility \*\/\s*<Card[\s\S]*?<\/Card>\s*\/\* Privacy \*\/\s*<Card[\s\S]*?<\/Card>\s*\/\* About \*\/\s*<Card[\s\S]*?<\/Card>/g;

const newCards = `
        {/* COMPLAINT QUALITY METRICS (AI REPLACEMENT) */}
        <div className="space-y-6 md:col-span-1">
          {/* AI Completeness Meter */}
          <Card className="border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-[#0B1222] shadow-sm">
            <CardHeader className="pb-3 border-b border-blue-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-blue-600 dark:text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> {"Complaint Quality"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                </div>
                <span className="text-sm font-black text-blue-600 dark:text-cyan-400">86%</span>
              </div>
              
              <div className="space-y-2.5 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{"Clear description"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{"Department identified"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{"Missing exact location"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{"Missing device details"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions & Resolution Prediction */}
          <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {"AI Predictions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-[#11192A] rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{"Estimated SLA"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800 dark:text-white">{"4 Hours"}</span>
                  <Badge variant="outline" className="border-blue-200 text-blue-600 dark:border-blue-900 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/30 text-[9px]">{"Standard"}</Badge>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-[#11192A] rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{"Likely Root Cause"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-300">{"Hardware Failure"}</span>
                  <span className="text-[10px] text-emerald-500 font-bold">{"92% Match"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Complaints Prevention */}
          <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {"Similar Complaints Found"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{"Printer offline in marketing"}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-bold">{"Resolved"}</span>
                    <span className="text-[10px] text-slate-400">{"Yesterday"}</span>
                  </div>
                </div>
                <div className="py-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{"WiFi dropping intermittently"}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">{"In Progress"}</span>
                    <span className="text-[10px] text-slate-400">{"2 hours ago"}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full h-8 text-[10px] font-bold mt-2 border-slate-200 dark:border-slate-700">
                {"Is this the same issue?"}
              </Button>
            </CardContent>
          </Card>
        </div>
`;

code = code.replace(regex, newCards);
fs.writeFileSync('src/pages/UserPages.tsx', code);
