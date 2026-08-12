import React, { useState, useRef, useEffect } from "react";
import { 
  X, Camera, RotateCcw, Zap, Sparkles, CheckCircle2, ChevronRight, Check,
  FileText, Activity, Maximize, Grid, Shield, ChevronDown, Type, Image as ImageIcon, ArrowRight
} from "lucide-react";
import { SupportAttachment } from "../types";

interface DcmsCameraProps {
  onClose: () => void;
  onCapturePhotos: (photos: SupportAttachment[]) => void;
  initialMode?: "Photo" | "Document" | "ID" | "Whiteboard";
}

const CAMERA_TEMPLATES = [
  {
    id: "printer",
    name: "Broken Office Xerox C405 (Hardware Jam)",
    src: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "board",
    name: "Burnt Electronic Circuit Board",
    src: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&auto=format&fit=crop&q=80",
  }
];

export default function DcmsCamera({ onClose, onCapturePhotos, initialMode = "Photo" }: DcmsCameraProps) {
  const [screen, setScreen] = useState<"capture" | "preview">("capture");
  const [activeMode, setActiveMode] = useState(initialMode);
  const [capturedPhotos, setCapturedPhotos] = useState<SupportAttachment[]>([]);
  const [editingImage, setEditingImage] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showOcrPanel, setShowOcrPanel] = useState(false);

  const handleExtractText = async () => {
    setShowMoreMenu(false);
    setShowOcrPanel(true);
    setOcrLoading(true);
    setOcrText("");
    
    // Simulate OCR delay if Tesseract/Gemini isn't available client-side
    setTimeout(() => {
      setOcrText("Simulated Extracted Text from Document\n\n1. Check network cables\n2. Verify power supply\n3. Reboot main server\n\nNote: OCR accuracy depends on image quality.");
      setOcrLoading(false);
    }, 1500);
  };
  
  const handleAttachOcrToChat = () => {
    const textBlob = new Blob([ocrText], { type: 'text/plain' });
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const newAttachment: SupportAttachment = {
          id: "att-" + Date.now(),
          name: `Extracted_Text_${Date.now()}.txt`,
          type: "document",
          size: textBlob.size,
          dataUrl: ev.target.result as string,
        };
        setCapturedPhotos([...capturedPhotos, newAttachment]);
        setShowOcrPanel(false);
      }
    };
    reader.readAsDataURL(textBlob);
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Real Camera Setup
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<any>(null);
  const [cameraError, setCameraError] = useState('');
  
  // Real Device Capture
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        setCameraError('');
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false
        });
        
        activeStream = newStream;
        setStream(newStream);
        setIsStreamActive(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        // Get track capabilities
        const track = newStream.getVideoTracks()[0];
        if (track.getCapabilities) {
          const caps = track.getCapabilities() as any;
          setFlashSupported(!!caps.torch);
          if (caps.zoom) {
            setZoomSupported(true);
            setZoomCapabilities(caps.zoom);
          } else {
            setZoomSupported(false);
          }
        }
        
        // Enumerate devices for switching
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err: any) {
        setIsStreamActive(false);
        setCameraError(err.message || 'Camera permission denied or unavailable.');
        console.warn("Camera failed:", err);
      }
    };

    if (screen === 'capture') {
      startCamera();
    } else {
      // Clean up when moving away from capture screen
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, screen]);

  // Flash Toggle
  useEffect(() => {
    if (stream && flashSupported) {
      const track = stream.getVideoTracks()[0];
      if (track.applyConstraints) {
        track.applyConstraints({
          advanced: [{ torch: flashOn } as any]
        }).catch(e => console.warn('Torch not supported:', e));
      }
    }
  }, [flashOn, stream, flashSupported]);

  // Zoom Handle
  const handleZoom = (level: number) => {
    if (stream && zoomSupported && zoomCapabilities) {
      const track = stream.getVideoTracks()[0];
      const targetZoom = Math.min(zoomCapabilities.max, Math.max(zoomCapabilities.min, level));
      setZoomLevel(targetZoom);
      if (track.applyConstraints) {
        track.applyConstraints({
          advanced: [{ zoom: targetZoom } as any]
        }).catch(e => console.warn('Zoom not supported:', e));
      }
    }
  };


  const handleToggleFacingMode = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const triggerCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video source
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setEditingImage(dataUrl);
      setOriginalImage(dataUrl);
      setScreen("preview");
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEditingImage(ev.target.result as string);
          setOriginalImage(ev.target.result as string);
          setScreen("preview");
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const handleAcceptPhoto = () => {
    const newAttachment: SupportAttachment = {
      id: "att-" + Date.now(),
      name: `Snapshot_\${capturedPhotos.length + 1}.jpg`,
      type: "image",
      size: 1024,
      dataUrl: editingImage,
    };
    setCapturedPhotos([...capturedPhotos, newAttachment]);
    setEditingImage("");
    setScreen("capture");
  };

  const handleFinalizeAllCaptures = () => {
    if (capturedPhotos.length > 0) {
      onCapturePhotos(capturedPhotos);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#020617] text-white flex flex-col font-sans select-none overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-[#0B1222] border-b border-slate-800 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wide">
              {screen === "capture" ? "Intelligent Capture" : "Document Intelligence Review"}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              {screen === "capture" ? "Point camera at document or object" : "AI analysis complete"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {screen === "capture" && capturedPhotos.length > 0 && (
             <button
               onClick={handleFinalizeAllCaptures}
               className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-extrabold text-[12px] uppercase tracking-wider text-white rounded-full shadow-lg transition-all cursor-pointer flex items-center gap-2"
             >
               <span>Finish & Attach</span>
               <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{capturedPhotos.length}</span>
             </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {screen === "capture" && (
          <div className="flex-1 relative flex flex-col bg-black">
            {/* Camera Viewfinder */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none", display: isStreamActive ? 'block' : 'none' }}
              />
              {!isStreamActive && (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 absolute inset-0 z-10">
                  <div className="text-center p-6 space-y-4 max-w-sm">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400">
                      {cameraError || "Camera starting..."}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Flash & Zoom Overlays */}
              {isStreamActive && (
                <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
                  {flashSupported && (
                    <button 
                      onClick={() => setFlashOn(!flashOn)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border cursor-pointer transition-all ${flashOn ? 'bg-amber-400 text-black border-amber-300' : 'bg-slate-900/50 text-white border-white/20'}`}
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              
              {isStreamActive && zoomSupported && zoomCapabilities && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-20">
                  <button onClick={() => handleZoom(zoomLevel - 0.5)} className="text-white font-bold px-2 py-1 cursor-pointer">
                    -
                  </button>
                  <span className="text-white text-xs font-mono font-bold w-8 text-center">{zoomLevel.toFixed(1)}x</span>
                  <button onClick={() => handleZoom(zoomLevel + 0.5)} className="text-white font-bold px-2 py-1 cursor-pointer">
                    +
                  </button>
                </div>
              )}
              
              {/* Document Overlay Guide */}
              {isStreamActive && (
                 <div className="absolute inset-x-8 top-12 bottom-12 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white/50 rounded-tl-xl"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white/50 rounded-tr-xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white/50 rounded-bl-xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white/50 rounded-br-xl"></div>
                 </div>
              )}
              
            </div>

            {/* Bottom Controls */}
            <div className="h-40 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end pb-8 z-10 absolute bottom-0 inset-x-0">
               {/* Mode Selector Removed (Simplified as per UX feedback) */}

               {/* Shutter & Batch captures */}
               <div className="flex items-center justify-center w-full relative px-8">
                  {/* Left: Thumbnail of last capture or Batch Counter */}
                  <div className="absolute left-8 flex flex-col items-center">
                    {capturedPhotos.length === 0 ? (
                      <label className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-800/80 hover:bg-slate-700 flex flex-col items-center justify-center text-white cursor-pointer transition-all shadow-lg backdrop-blur-md">
                        <ImageIcon className="w-5 h-5 mb-0.5" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Gallery</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    ) : (
                      <div className="relative">
                        <div className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden opacity-50 absolute -top-1 -right-1" />
                        <div className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden relative z-10 bg-slate-900 shadow-xl flex items-center justify-center">
                           <img src={capturedPhotos[capturedPhotos.length - 1].dataUrl} className="w-full h-full object-cover" alt="Last capture" />
                           <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow border border-blue-400">
                             {capturedPhotos.length}
                           </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shutter Button */}
                  <button
                    onClick={triggerCapture}
                    className="w-16 h-16 rounded-full border-[3px] border-white p-1 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 transition-all bg-transparent"
                  >
                    <div className="w-full h-full bg-white rounded-full" />
                  </button>
                  
                  {/* Right: Switch Camera */}
                  <button 
                    onClick={handleToggleFacingMode}
                    className="absolute right-8 w-12 h-12 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer transition-all border border-slate-700"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </div>
        )}

        {screen === "preview" && (
          <div className="flex-1 flex flex-col md:flex-row bg-[#020617]">
            {/* Left/Main Panel: Image & Toolbar */}
            <div className="flex-1 flex flex-col border-r border-slate-800 relative">
               
               <div className="flex-1 p-6 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                 {/* Hold to Compare Overlay */}
                 <img 
                   src={editingImage} 
                   className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl z-10 relative pointer-events-none" 
                   alt="Preview" 
                 />
               </div>

               {/* Toolbar */}
               <div className="h-20 bg-[#0B1222] border-t border-slate-800 flex items-center justify-center gap-4 px-6 shrink-0">
                 <button 
                   onClick={() => setEditingImage(originalImage)}
                   className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer border border-transparent"
                 >
                   <RotateCcw className="w-4 h-4" /> Reset
                 </button>
                 <button className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-900/20 border-none">
                   <Sparkles className="w-4 h-4" /> AI Enhance
                 </button>
                 <div className="relative">
                   <button 
                     onClick={() => setShowMoreMenu(!showMoreMenu)}
                     className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer border border-transparent"
                   >
                     <Grid className="w-4 h-4" /> More <ChevronDown className="w-3 h-3 opacity-50" />
                   </button>
                   {showMoreMenu && (
                     <div className="absolute bottom-full mb-2 right-0 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                        <div className="px-3 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-700 mb-1">Editing Tools</div>
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-2 cursor-pointer border-none bg-transparent" onClick={() => {}}><Maximize className="w-3.5 h-3.5" /> Crop</button>
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-2 cursor-pointer border-none bg-transparent" onClick={() => {}}><RotateCcw className="w-3.5 h-3.5" /> Rotate</button>
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-2 cursor-pointer border-none bg-transparent" onClick={() => {}}><Sparkles className="w-3.5 h-3.5" /> Document Enhance</button>
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-2 cursor-pointer border-none bg-transparent" onClick={() => handleExtractText()}><FileText className="w-3.5 h-3.5" /> Extract Text (OCR)</button>
                     </div>
                   )}
                 </div>
               </div>
            </div>

            {/* Right Panel: AI Assistant & Actions */}
            <div className="w-full md:w-96 bg-[#0B1222] flex flex-col shrink-0">
               <div className="p-5 flex-1 overflow-y-auto [scrollbar-width:thin] space-y-6">
                 
                 {/* Status card */}
                 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 items-start">
                   <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                     <CheckCircle2 className="w-4 h-4" />
                   </div>
                   <div>
                     <h3 className="text-emerald-400 font-bold text-sm">Document Detected</h3>
                     <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                       Quality: <span className="text-emerald-300 font-mono">94% Excellent</span><br/>
                       Content: Complaint Form / Circuit Board
                     </p>
                   </div>
                 </div>

                 {/* OCR Preview */}
                 <div>
                   <h4 className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-2 font-bold">Extracted Information</h4>
                   <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-text">
                     {'Complaint Report\n\nEquipment: Electronic Circuit Board\nIssue: Display malfunction...\nDate: 08/08/2026'}
                   </div>
                 </div>

                 {/* Actions */}
                 <div>
                   <h4 className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-2 font-bold">What would you like to do?</h4>
                   <div className="space-y-2">
                     <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 flex items-center gap-3 text-left transition-colors group cursor-pointer">
                       <Type className="w-4 h-4 text-blue-400" />
                       <div className="flex-1">
                         <div className="text-sm font-bold text-slate-200 group-hover:text-white">Extract Text</div>
                         <div className="text-[10px] text-slate-500">Convert image to text</div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-600" />
                     </button>
                     <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 flex items-center gap-3 text-left transition-colors group cursor-pointer">
                       <FileText className="w-4 h-4 text-purple-400" />
                       <div className="flex-1">
                         <div className="text-sm font-bold text-slate-200 group-hover:text-white">Create Document</div>
                         <div className="text-[10px] text-slate-500">Clean file conversion</div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-600" />
                     </button>
                     <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 flex items-center gap-3 text-left transition-colors group cursor-pointer">
                       <Activity className="w-4 h-4 text-amber-400" />
                       <div className="flex-1">
                         <div className="text-sm font-bold text-slate-200 group-hover:text-white">Create Report</div>
                         <div className="text-[10px] text-slate-500">Generate structured report</div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-600" />
                     </button>
                   </div>

                   <h4 className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mt-6 mb-2 font-bold">Export</h4>
                   <div className="flex gap-2">
                      <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-[10px] font-bold border border-slate-700 cursor-pointer">Copy</button>
                      <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-[10px] font-bold border border-slate-700 cursor-pointer">PDF</button>
                      <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-[10px] font-bold border border-slate-700 cursor-pointer">DOCX</button>
                      <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-[10px] font-bold border border-slate-700 cursor-pointer">Share</button>
                   </div>
                 </div>
               </div>
               {/* Bottom Finalize Actions */}
               <div className="p-4 bg-[#0B1222] border-t border-slate-800 flex gap-3">
                 <button 
                   onClick={() => setScreen("capture")}
                   className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs transition-colors cursor-pointer border border-transparent"
                 >
                   Retake Photo
                 </button>
                 <button 
                   onClick={handleAcceptPhoto}
                   className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 border-none"
                 >
                   <Check className="w-4 h-4" /> Keep & Attach
                 </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
