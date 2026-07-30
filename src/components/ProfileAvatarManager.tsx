import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "../lib/AuthContext";
import { Camera, Trash, Check, X, UploadCloud, AlertCircle, Image as ImageIcon, Layers, Shapes } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../lib/cropImage";

const AVATAR_GROUPS = [
  {
    title: "Modern",
    icon: <Layers className="w-4 h-4" />,
    avatars: [
      { id: "mod-1", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Modern1&backgroundColor=f8fafc" },
      { id: "mod-2", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Modern2&backgroundColor=f8fafc" },
      { id: "mod-3", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Modern3&backgroundColor=f8fafc" },
      { id: "mod-4", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Modern4&backgroundColor=f8fafc" },
      { id: "mod-5", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Modern5&backgroundColor=f8fafc" },
      { id: "mod-6", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Modern6&backgroundColor=f8fafc" },
    ]
  },
  {
    title: "Innovation",
    icon: <ImageIcon className="w-4 h-4" />,
    avatars: [
      { id: "inn-1", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Inn1&backgroundColor=f8fafc" },
      { id: "inn-2", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Inn2&backgroundColor=f8fafc" },
      { id: "inn-3", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Inn3&backgroundColor=f8fafc" },
      { id: "inn-4", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Inn4&backgroundColor=f8fafc" },
      { id: "inn-5", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Inn5&backgroundColor=f8fafc" },
      { id: "inn-6", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Inn6&backgroundColor=f8fafc" },
    ]
  },
  {
    title: "Lifestyle",
    icon: <Shapes className="w-4 h-4" />,
    avatars: [
      { id: "life-1", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Life1&backgroundColor=f8fafc" },
      { id: "life-2", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Life2&backgroundColor=f8fafc" },
      { id: "life-3", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Life3&backgroundColor=f8fafc" },
      { id: "life-4", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Life4&backgroundColor=f8fafc" },
      { id: "life-5", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Life5&backgroundColor=f8fafc" },
      { id: "life-6", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Life6&backgroundColor=f8fafc" },
    ]
  },
  {
    title: "Future",
    icon: <ImageIcon className="w-4 h-4" />,
    avatars: [
      { id: "fut-1", url: "https://api.dicebear.com/7.x/micah/svg?seed=Fut1&backgroundColor=f8fafc" },
      { id: "fut-2", url: "https://api.dicebear.com/7.x/micah/svg?seed=Fut2&backgroundColor=f8fafc" },
      { id: "fut-3", url: "https://api.dicebear.com/7.x/micah/svg?seed=Fut3&backgroundColor=f8fafc" },
      { id: "fut-4", url: "https://api.dicebear.com/7.x/micah/svg?seed=Fut4&backgroundColor=f8fafc" },
      { id: "fut-5", url: "https://api.dicebear.com/7.x/micah/svg?seed=Fut5&backgroundColor=f8fafc" },
      { id: "fut-6", url: "https://api.dicebear.com/7.x/micah/svg?seed=Fut6&backgroundColor=f8fafc" },
    ]
  },
  {
    title: "Cosmic",
    icon: <Shapes className="w-4 h-4" />,
    avatars: [
      { id: "cos-1", url: "https://api.dicebear.com/7.x/rings/svg?seed=Cos1&backgroundColor=f8fafc" },
      { id: "cos-2", url: "https://api.dicebear.com/7.x/rings/svg?seed=Cos2&backgroundColor=f8fafc" },
      { id: "cos-3", url: "https://api.dicebear.com/7.x/rings/svg?seed=Cos3&backgroundColor=f8fafc" },
      { id: "cos-4", url: "https://api.dicebear.com/7.x/rings/svg?seed=Cos4&backgroundColor=f8fafc" },
      { id: "cos-5", url: "https://api.dicebear.com/7.x/rings/svg?seed=Cos5&backgroundColor=f8fafc" },
      { id: "cos-6", url: "https://api.dicebear.com/7.x/rings/svg?seed=Cos6&backgroundColor=f8fafc" },
    ]
  }
];

export function ProfileAvatarManager({ children }: { children?: React.ReactNode }) {
  const { dbUser, updateAvatar } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  
  // Modals
  const [showOptions, setShowOptions] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
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

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
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

  const selectDefaultAvatar = async (url: string) => {
    try {
      setLoading(true);
      await updateAvatar(url);
      setShowPicker(false);
      setShowOptions(false);
    } catch (e) {
      console.error(e);
      setError("Failed to set avatar");
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
  const initials = dbUser?.name?.[0] || dbUser?.email?.[0] || 'U';

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
      <div className="flex-shrink-0 relative group"
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}>
        <div 
          onClick={() => setShowOptions(true)}
          className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-5xl text-slate-700 dark:text-slate-300 font-bold border-4 border-white dark:border-slate-800 shadow-sm font-sans relative transition-all duration-300 cursor-pointer hover:shadow-md"
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
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs shadow-sm flex items-center gap-2 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Photo
          </button>
          
          <button 
            onClick={() => setShowPicker(true)} 
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs shadow-sm flex items-center gap-2 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Choose Default
          </button>

          {avatarUrl && (
             <button 
               onClick={() => setShowConfirmDelete(true)} 
               className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-900/50 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition-colors flex items-center gap-2"
             >
               <Trash className="w-4 h-4" />
               Remove
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
      {showOptions && !showPicker && !showEditor && !showConfirmDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOptions(false)}>
          <div className="bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Change Profile Photo</h4>
              <button onClick={() => setShowOptions(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button 
                onClick={() => { setShowOptions(false); fileInputRef.current?.click(); }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                Upload a Photo
              </button>
              <button 
                onClick={() => { setShowOptions(false); setShowPicker(true); }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                Choose a Default Avatar
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

      {/* Avatar Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Choose an Avatar</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a professional illustration for your profile</p>
              </div>
              <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              {AVATAR_GROUPS.map((group, gIdx) => (
                <div key={gIdx}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {group.icon}
                    </div>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{group.title}</h5>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4">
                    {group.avatars.map(avatar => (
                      <button 
                        key={avatar.id}
                        onClick={() => selectDefaultAvatar(avatar.url)}
                        className="aspect-square rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:scale-105 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#0B1222] group bg-slate-50 dark:bg-slate-900"
                      >
                        <img src={avatar.url} alt="Avatar option" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && imageSrc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Adjust Profile Photo</h4>
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
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button 
                  onClick={() => { setShowEditor(false); setImageSrc(null); }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCrop}
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
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
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Remove Photo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to remove your profile photo? This will revert to a default initial avatar.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveAvatar}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
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
