import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play, 
  FileText,
  Paperclip
} from "lucide-react";
import { SupportAttachment } from "../types";

interface MediaGalleryProps {
  attachments: SupportAttachment[];
  onDelete?: (id: string) => void;
  allowEdit?: boolean;
}

export function MediaGallery({ attachments, onDelete, allowEdit = false }: MediaGalleryProps) {
  // Separate media (images & videos) from documents
  const mediaItems = useMemo(() => {
    return attachments.filter(a => a.type === "image" || a.type === "video");
  }, [attachments]);

  const documentItems = useMemo(() => {
    return attachments.filter(a => a.type === "document");
  }, [attachments]);

  // Lightbox States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch Swipe States
  const touchStartX = useRef<number | null>(null);

  // Reference to current active media
  const activeMedia = mediaItems[currentIndex];

  // Reset image transform values when navigation changes
  const resetTransforms = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mediaItems.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
    resetTransforms();
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mediaItems.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    resetTransforms();
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((z) => Math.min(z + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((z) => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation((r) => (r + 90) % 360);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeMedia) return;
    const link = document.createElement("a");
    link.href = activeMedia.dataUrl;
    link.download = activeMedia.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeMedia || !onDelete) return;

    const idToDelete = activeMedia.id;
    
    // Determine next index first
    if (mediaItems.length <= 1) {
      setLightboxOpen(false);
    } else {
      // If deleting the last item, shift index to the left
      if (currentIndex === mediaItems.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
      resetTransforms();
    }
    
    onDelete(idToDelete);
  };

  // Drag and Pan interaction handlers for zoomed images
  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1 || activeMedia?.type === "video") return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || zoom <= 1 || activeMedia?.type === "video") return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Set boundaries based on zoom level to keep panning constrained nicely
    const maxOffset = (zoom - 1) * 200;
    setPan({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY))
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Keyboard navigation & gestures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, currentIndex, mediaItems]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) return; // Disable swiping when zoomed-in
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || zoom > 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    
    // Swipe Threshold: 50px
    if (deltaX < -50) {
      handleNext();
    } else if (deltaX > 50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  if (attachments.length === 0) return null;

  return (
    <div className="space-y-3 font-sans" id="dcms-media-gallery">
      {/* WhatsApp-Style Core Layout Grid */}
      {mediaItems.length > 0 && (
        <div className="space-y-2">
          <div className={`grid gap-2 ${
            mediaItems.length === 1 ? "grid-cols-1" :
            mediaItems.length === 2 ? "grid-cols-2" :
            mediaItems.length === 3 ? "grid-cols-3" :
            "grid-cols-4" // 4+ items grid
          }`}>
            {mediaItems.slice(0, 4).map((item, idx) => {
              const isLastImage = idx === 3 && mediaItems.length > 4;
              const isVideo = item.type === "video";

              return (
                <div 
                  key={item.id} 
                  className={`aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden relative cursor-pointer group transition-all duration-300 hover:shadow-md ${
                    mediaItems.length === 1 ? "max-h-[340px] aspect-[16/10]" : ""
                  }`}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setLightboxOpen(true);
                    resetTransforms();
                  }}
                >
                  {isVideo ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                      <video src={item.dataUrl} className="w-full h-full object-cover opacity-80" muted playsInline />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-blue-600/90 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.dataUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover filter brightness-100 group-hover:brightness-95 transition-all duration-300 group-hover:scale-[1.02]" 
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Badge or filename tag overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-xs py-1 px-2.5 rounded-lg text-[9px] text-white/95 font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.name}
                  </div>

                  {/* Deletion cross (if edit allowed) */}
                  {allowEdit && onDelete && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-650 text-white flex items-center justify-center transition-colors shadow-sm z-10"
                      title="Remove attachment"
                    >
                      ×
                    </button>
                  )}

                  {/* +N overlay badge for WhatsApp 2x2 layout limit */}
                  {isLastImage && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center font-bold text-white transition-colors hover:bg-slate-950/70">
                      <span className="text-xl">+{mediaItems.length - 3}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-300/90 font-mono mt-1">See Gallery</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Docs attached list */}
      {documentItems.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {mediaItems.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Paperclip className="w-3.5 h-3.5 text-blue-500" />
              <span>Supporting Documents ({documentItems.length})</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {documentItems.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between gap-4 p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800/80 rounded-xl text-xs transition-colors hover:bg-slate-100/55"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 px-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-semibold text-[11px] text-slate-700 dark:text-slate-200">{doc.name}</span>
                    <span className="text-[9.5px] text-slate-400 font-medium uppercase font-mono mt-0.5">{(doc.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = doc.dataUrl;
                      link.download = doc.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                    title="Download document file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {allowEdit && onDelete && (
                    <button 
                      type="button" 
                      onClick={() => onDelete(doc.id)}
                      className="text-red-500 hover:text-red-700 font-bold p-1 px-2.5 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHATSAPP FULLSCREEN LIGHTBOX DIALOG */}
      <AnimatePresence>
        {lightboxOpen && activeMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-9999 flex flex-col justify-between"
          >
            {/* 1. Header Navigation and Utility Controls */}
            <div className="bg-slate-950/80 p-4 border-b border-slate-900 flex justify-between items-center text-white z-20">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono font-black text-cyan-400 tracking-widest uppercase">
                  LIGHTBOX VIEW ({currentIndex + 1} / {mediaItems.length})
                </span>
                <span className="text-xs font-bold font-mono text-slate-300 truncate max-w-[250px] sm:max-w-md mt-0.5">
                  {activeMedia.name}
                </span>
              </div>

              {/* Toolbar utility controls */}
              <div className="flex items-center gap-2 sm:gap-3.5">
                {activeMedia.type !== "video" && (
                  <>
                    <button 
                      onClick={handleZoomIn} 
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                      title="Zoom In (Max 4x)"
                    >
                      <ZoomIn className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={handleZoomOut} 
                      disabled={zoom === 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 hover:bg-slate-900 transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={handleRotate} 
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}
                <button 
                  onClick={handleDownload} 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
                {allowEdit && onDelete && (
                  <button 
                    onClick={handleDelete} 
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-950/40 transition-colors border border-red-900/50"
                    title="Delete Attachment"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
                <button 
                  onClick={() => setLightboxOpen(false)} 
                  className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white text-xs font-bold transition-colors ml-2 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </div>

            {/* 2. Main Content Display Scene */}
            <div 
              className="flex-1 w-full flex items-center justify-center relative select-none touch-none overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {activeMedia.type === "video" ? (
                <div className="w-full max-w-4xl p-2 relative flex items-center justify-center">
                  <video 
                    src={activeMedia.dataUrl} 
                    controls 
                    autoPlay 
                    className="max-h-[75vh] max-w-full rounded-xl bg-black border border-slate-900" 
                  />
                </div>
              ) : (
                <div 
                  className={`relative flex items-center justify-center transition-transform ${isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : ""}`}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  <img 
                    src={activeMedia.dataUrl} 
                    alt="Lightbox High-res Detail" 
                    className="max-h-[80vh] max-w-[95vw] sm:max-w-[80vw] object-contain transition-transform duration-200 rounded-lg"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Side Navigation Chevrons */}
              {mediaItems.length > 1 && (
                <>
                  <button 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-slate-800 bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-950 transition-colors hover:scale-105 z-10"
                    title="Previous Attachment"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-slate-800 bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-950 transition-colors hover:scale-105 z-10"
                    title="Next Attachment"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* 3. Bottom Scrolling Thumbnails Track */}
            {mediaItems.length > 1 && (
              <div className="bg-slate-950/90 p-3 pb-6 border-t border-slate-900/80 flex justify-center gap-2.5 overflow-x-auto select-none z-10 scrollbar-thin">
                {mediaItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      setCurrentIndex(idx);
                      resetTransforms();
                    }}
                    className={`w-14 h-11 rounded-xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                      currentIndex === idx 
                        ? "border-cyan-400 scale-105 shadow-md shadow-cyan-400/20" 
                        : "border-slate-800 opacity-50 hover:opacity-80"
                    }`}
                  >
                    {item.type === "video" ? (
                      <div className="w-full h-full bg-slate-900 relative flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-current text-slate-300" />
                      </div>
                    ) : (
                      <img src={item.dataUrl} alt="Thumbnail carousel" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
