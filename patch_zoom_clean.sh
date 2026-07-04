sed -i '1336,1368c\
                  {/* Google Camera Style Zoom Presets overlay */}\
                  <AnimatePresence>\
                  {showZoom && (\
                    <motion.div \
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}\
                      animate={{ opacity: 1, y: 0, scale: 1 }}\
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}\
                      className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-black/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 z-30 backdrop-blur-md"\
                    >\
                    {[0.5, 1, 2, 3, 5].map((z) => (\
                      <button\
                        key={z}\
                        onClick={(e) => {\
                          e.stopPropagation();\
                          setZoomFactor(z);\
                        }}\
                        className={`w-7 h-7 rounded-full text-[10px] font-mono font-black transition-all flex items-center justify-center ${\
                          zoomFactor === z ? "bg-amber-500 text-black font-black scale-110" : "text-slate-300 hover:text-white"\
                        }`}\
                      >\
                        {z}x\
                      </button>\
                    ))}\
                    </motion.div>\
                  )}\
                  </AnimatePresence>\
' src/components/DcmsCamera.tsx
