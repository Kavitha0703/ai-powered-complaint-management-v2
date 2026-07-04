sed -i '1336c\
                  {/* Google Camera Style Zoom Presets overlay */}\
                  <AnimatePresence>\
                  {showZoom && (\
                    <motion.div \
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}\
                      animate={{ opacity: 1, y: 0, scale: 1 }}\
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}\
                      className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-black/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 z-30 backdrop-blur-md"\
                    >
' src/components/DcmsCamera.tsx

sed -i '1355c\
                    </motion.div>\
                  )}\
                  </AnimatePresence>
' src/components/DcmsCamera.tsx

sed -i '1357,1368d' src/components/DcmsCamera.tsx
