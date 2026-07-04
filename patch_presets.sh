sed -i '1652i\
                      {/* Capture Presets */}\
                      <div className="space-y-1.5">\
                        <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider">Capture Preset Mode</label>\
                        <div className="grid grid-cols-2 gap-2">\
                          {CAMERA_PRESETS.map((p) => (\
                            <button\
                              key={p.id}\
                              onClick={() => {\
                                setActiveMode(p.id);\
                              }}\
                              className={`px-3 py-2.5 rounded-xl text-left border transition-all flex flex-col justify-center ${\
                                activeMode === p.id\
                                  ? "bg-amber-500/15 border-amber-500/50 text-amber-400"\
                                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"\
                              }`}\
                            >\
                              <div className="flex items-center gap-1.5 mb-1">\
                                <p.icon className="w-3.5 h-3.5" />\
                                <span className="text-[11px] font-bold">{p.label}</span>\
                              </div>\
                              <span className="text-[9px] text-slate-500 truncate w-full">{p.desc}</span>\
                            </button>\
                          ))}\
                        </div>\
                      </div>\
' src/components/DcmsCamera.tsx
