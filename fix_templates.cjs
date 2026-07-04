const fs = require('fs');
let code = fs.readFileSync('src/pages/UserPages.tsx', 'utf8');

const target = `              {/* Ticket Templates Quick Select */}
              <div className="bg-slate-50 dark:bg-slate-900/25 border border-slate-150 dark:border-slate-800/80 p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">{"⚡ Click a template to instantly prefill:"}</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {TICKET_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setTitle(tpl.title);
                        setType(tpl.type);
                        setDepartment(tpl.department);
                        setDesc(tpl.desc);
                      }}
                      className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors py-1 px-2.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <span>{tpl.icon}</span> {tpl.label}
                    </button>
                  ))}
                </div>
              </div>`;

const replacement = `              {/* AI Smart Templates */}
              <div className="bg-transparent border-none p-0 rounded-none space-y-3 mb-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white">
                    <Sparkles className="w-4 h-4 text-blue-500" /> {"AI Smart Templates"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {"Choose a template to automatically fill the complaint form using AI."}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                  {TICKET_TEMPLATES.map((tpl, i) => {
                    const isSelected = title === tpl.title && type === tpl.type;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTitle(tpl.title);
                          setType(tpl.type);
                          setDepartment(tpl.department);
                          setDesc(tpl.desc);
                        }}
                        className={\`group relative flex flex-col items-start p-3 text-left rounded-xl transition-all duration-300 cursor-pointer overflow-hidden \${
                          isSelected
                            ? "bg-gradient-to-br from-blue-600 to-cyan-500 border-transparent shadow-md transform scale-[0.98]"
                            : "bg-slate-50 dark:bg-[#141B2D] border border-slate-200 dark:border-[#2B4EFF] hover:dark:bg-[#1A2850] hover:border-blue-400 hover:dark:border-[#3B82F6] hover:shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                        }\`}
                      >
                        <div className="relative z-10 w-full flex items-center gap-2 mb-1">
                          <span className={\`text-base \${isSelected ? 'text-white' : 'text-blue-500 dark:text-[#4EA8FF]'}\`}>{tpl.icon}</span>
                          <span className={\`text-xs font-bold leading-tight \${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'} group-hover:dark:text-white\`}>
                            {tpl.label}
                          </span>
                        </div>
                        
                        <div className={\`relative z-10 w-full transition-all duration-300 \${isSelected ? 'mt-2 h-auto opacity-100' : 'h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 group-hover:mt-2'}\`}>
                          {!isSelected ? (
                            <div className="flex flex-col gap-1.5 overflow-hidden">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{"AI Prefills:"}</p>
                              <ul className="text-[9px] space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-500 dark:text-cyan-400" /> {"Department"}</li>
                                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-blue-500 dark:text-cyan-400" /> {"Category"}</li>
                              </ul>
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-white flex items-center gap-1">
                               <CheckCircle2 className="w-3.5 h-3.5 text-white" /> {"AI Prepared"}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/UserPages.tsx', code);
