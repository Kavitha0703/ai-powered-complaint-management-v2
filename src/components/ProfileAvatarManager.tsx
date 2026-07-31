import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "../lib/AuthContext";
import { Camera, Trash, Check, X, UploadCloud, AlertCircle } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../lib/cropImage";

export function ProfileAvatarManager({ children }: { children?: React.ReactNode }) {
  const { dbUser, updateAvatar } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  
  // Modals
  const [showOptions, setShowOptions] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Editor State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Invalid file type.");
        return;
      }
      setError("");
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowOptions(false);
        setShowEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(imageSrc!, croppedAreaPixels);
      await updateAvatar(croppedImage);
      setShowEditor(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
      setError("Failed to save cropped image.");
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveAvatar = async () => {
    try {
      setLoading(true);
      await updateAvatar("");
      setShowConfirmDelete(false);
      setShowOptions(false);
    } catch(e) {
      console.error(e);
      setError("Failed to remove avatar");
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = dbUser?.avatar_url;
  const initials = dbUser?.name?.[0] || dbUser?.email?.[0] || 'K';

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
      <div className="flex-shrink-0 relative group"
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}>
        <div 
          onClick={() => setShowOptions(true)}
          className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-5xl text-white font-black border-4 border-white dark:border-slate-800 shadow-xl font-sans relative transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <span>{initials.toUpperCase()}</span>
          )}
          
          <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Camera className="w-8 h-8 text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 text-center md:text-left">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            {dbUser?.name || "User"}
          </h3>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
            {dbUser?.email}
          </p>
          {children}
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer border-none"
          >
            <UploadCloud className="w-4 h-4" />
            {avatarUrl ? "Change Photo" : "Upload Photo"}
          </button>

          {avatarUrl && (
             <button 
               onClick={() => setShowConfirmDelete(true)} 
               className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
             >
               <Trash className="w-4 h-4 text-rose-400" />
               Remove Photo
             </button>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/jpeg, image/png, image/webp" 
          onChange={handleFileChange} 
        />
        
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-2 justify-center md:justify-start">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      {/* Options Modal */}
      {showOptions && !showEditor && !showConfirmDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOptions(false)}>
          <div className="bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Profile Photo Options</h4>
              <button onClick={() => setShowOptions(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button 
                onClick={() => { setShowOptions(false); fileInputRef.current?.click(); }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                {avatarUrl ? "Upload New Photo" : "Upload Photo"}
              </button>
              {avatarUrl && (
                <button 
                  onClick={() => { setShowOptions(false); setShowConfirmDelete(true); }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium text-red-600 dark:text-red-400"
                >
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Trash className="w-4 h-4" />
                  </div>
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && imageSrc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Reposition & Zoom Photo</h4>
              <button onClick={() => { setShowEditor(false); setImageSrc(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative h-64 sm:h-80 w-full bg-slate-100/50 dark:bg-slate-950/50">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 space-y-6 bg-white dark:bg-[#0B1222]">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom Level"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button 
                  onClick={() => { setShowEditor(false); setImageSrc(null); }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCrop}
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer border-none"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Remove Profile Photo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to remove your custom profile photo? Your profile will revert to your modern gradient initials avatar.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveAvatar}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash className="w-4 h-4" />}
                Remove Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
