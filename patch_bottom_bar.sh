sed -i '2300,2335c\
      {/* ================= BOTTOM CAPTURE BAR & PHOTOS STRIP ================= */}\
      <div className="bg-[#0b0f19] border-t border-slate-850 px-4 py-4 shrink-0">\
        {/* Gallery Strip of Multi-Photos currently captured (Only show if > 0) */}\
        {capturedPhotos.length > 0 && (\
          <div className="flex items-center gap-3 overflow-x-auto py-1 mb-4">\
            <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-850">\
              <span className="text-[10px] uppercase font-mono font-black text-slate-500 tracking-wider">\
                Captures ({capturedPhotos.length})\
              </span>\
            </div>\
            <div className="flex items-center gap-2.5">\
              {capturedPhotos.map((photo, i) => (\
                <div \
                  key={photo.id}\
                  className="w-16 h-16 rounded-xl border border-slate-800 overflow-hidden relative shrink-0 group"\
                >\
                  <img referrerPolicy="no-referrer" src={photo.dataUrl} alt="Captured preview" className="w-full h-full object-cover" />\
                  <button\
                    onClick={() => removeCapturedPhoto(photo.id)}\
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-all opacity-0 group-hover:opacity-100 shadow"\
                  >\
                    <Trash2 className="w-3 h-3 text-white" />\
                  </button>\
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[8px] font-mono font-bold text-slate-300 py-0.5">\
                    #{i+1}\
                  </div>\
                </div>\
              ))}\
            </div>\
          </div>\
        )}\
\
        {/* Action Controls based on current active screen state */}\
        <div className="flex items-center justify-between gap-4 w-full">\
' src/components/DcmsCamera.tsx
