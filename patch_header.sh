sed -i '1231,1268c\
      {/* ================= HEADER CONTROLS BAR ================= */}\
      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-12 px-4 flex items-center justify-between z-50 pointer-events-none">\
        <div className="flex items-center gap-3 pointer-events-auto">\
          <button \
            onClick={onClose}\
            className="w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all cursor-pointer text-white border border-white/10"\
          >\
            <ArrowLeft className="w-5 h-5" />\
          </button>\
        </div>\
\
        <div className="flex items-center gap-2 pointer-events-auto">\
          {screen === "capture" && capturedPhotos.length > 0 && (\
            <button\
              onClick={handleFinalizeAllCaptures}\
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-extrabold text-[12px] uppercase tracking-wider text-white rounded-full shadow-lg transition-all cursor-pointer"\
            >\
              Done ({capturedPhotos.length})\
            </button>\
          )}\
\
          {screen === "capture" && (\
            <button\
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}\
              className="w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all cursor-pointer text-white border border-white/10 shadow"\
              title="Camera Settings"\
            >\
              <Settings className="w-5 h-5" />\
            </button>\
          )}\
          {screen === "preview" && (\
            <div className="flex gap-2">\
              <button \
                onClick={applyAutoEnhance}\
                disabled={autoEnhanced}\
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${autoEnhanced ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-lg hover:scale-105"}`}\
              >\
                <Sparkles className="w-4 h-4" />\
                {autoEnhanced ? "Enhanced ✓" : "AI Enhance"}\
              </button>\
            </div>\
          )}\
        </div>\
      </div>\
' src/components/DcmsCamera.tsx
