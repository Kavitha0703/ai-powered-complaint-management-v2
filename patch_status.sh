sed -i '1353c\
                  {/* Real-time Status Overlay Indicator */}\
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/85 border border-slate-800/80 px-4 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 z-20">\
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>\
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">\
                      {cameraStatusMessage || `${facingMode === "environment" ? "Rear" : "Front"} Camera Active ✓`}\
                    </span>\
                  </div>\
' src/components/DcmsCamera.tsx
