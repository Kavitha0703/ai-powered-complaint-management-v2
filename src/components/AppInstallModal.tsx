import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Smartphone, Share2, Check, Download, AlertCircle, Laptop as WindowsIcon
} from "lucide-react";

interface AppInstallModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppInstallModal({ isOpen: propIsOpen, onClose: propOnClose }: AppInstallModalProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Install states
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("desktop");
  const [browserType, setBrowserType] = useState<"firefox" | "samsung" | "chrome" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Sync prop open state
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  // Listen to global open events
  useEffect(() => {
    const handleOpenInstallModal = (e: Event) => {
      setIsOpen(true);
    };

    window.addEventListener("open-install-modal", handleOpenInstallModal);
    return () => {
      window.removeEventListener("open-install-modal", handleOpenInstallModal);
    };
  }, []);

  // Sync PWA trigger capture
  useEffect(() => {
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        
    // Check if running in standalone display mode
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    } else if ("getInstalledRelatedApps" in navigator && window.self === window.top) {
      try {
        (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
          if (relatedApps.length > 0) {
            setIsInstalled(true);
          }
        }).catch(console.error);
      } catch (err) {
        console.error("getInstalledRelatedApps error:", err);
      }
    }
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Browser-native installation success listener
  useEffect(() => {
    const handleAppInstalledEvent = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if ("Notification" in window) {
        Notification.requestPermission();
      }
    };
    window.addEventListener("appinstalled", handleAppInstalledEvent);
    return () => {
      window.removeEventListener("appinstalled", handleAppInstalledEvent);
    };
  }, []);

  // Auto detect user device type
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    let device: "android" | "ios" | "desktop" = "desktop";
    if (/iphone|ipad|ipod/.test(ua)) {
      device = "ios";
    } else if (/android/.test(ua)) {
      device = "android";
    }
    setDeviceType(device);

    if (/firefox/.test(ua)) {
      setBrowserType("firefox");
    } else if (/samsungbrowser/.test(ua)) {
      setBrowserType("samsung");
    } else if (/chrome|crios|edge|edg/.test(ua)) {
      setBrowserType("chrome");
    } else {
      setBrowserType("other");
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const triggerNativePWAInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error("Failed to trigger prompt:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-[#020617]/85 backdrop-blur-sm transition-all"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative bg-[#0B1329] border border-slate-800 text-white rounded-3xl w-full max-w-md pointer-events-auto shadow-2xl overflow-hidden font-sans flex flex-col min-h-[400px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
            <h3 className="font-extrabold text-white text-base tracking-tight">
              Install App
            </h3>
            <button 
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-6 flex flex-col justify-center text-center">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={deviceType}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                {/* Visual Icon Preview */}
                <div className="mb-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 inline-block">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-extrabold text-lg text-white">Workplace Hub</h4>
                  <p className="text-xs text-slate-400 mt-1">Your icon will look like this</p>
                </div>

                {isInstalled ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-2">
                      <Check className="w-5 h-5" />
                      <span className="text-sm uppercase tracking-wider">Installed Successfully</span>
                    </div>
                    <button
                      onClick={() => handleClose()}
                      className="w-full h-12 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-950/40 border border-emerald-900 text-emerald-400"
                    >
                       Open Workplace Hub
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Android Logic */}
                    {deviceType === "android" && (
                      <div className="space-y-4 text-left">
                        {deferredPrompt ? (
                          <button
                            onClick={triggerNativePWAInstall}
                            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Download className="w-5 h-5" />
                            Install Workplace Hub
                          </button>
                        ) : browserType === "firefox" ? (
                          <div className="bg-orange-950/30 border border-orange-900/50 p-4 rounded-xl text-center">
                            <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-300">
                              Firefox on Android only supports adding shortcuts, not full app installation.
                            </p>
                            <p className="text-sm font-bold text-orange-400 mt-2">
                              Please open this link in Chrome or Edge to install the full app.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                            <h5 className="font-extrabold text-base text-white mb-3">Install Instructions</h5>
                            <p className="text-sm text-slate-300 leading-relaxed space-y-2">
                              <span className="block">1. Tap the browser menu (⋮)</span>
                              <span className="block">2. Select <strong>Add to Home screen</strong> or <strong>Install app</strong></span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Desktop Logic */}
                    {deviceType === "desktop" && (
                      <div className="space-y-4">
                        {deferredPrompt ? (
                          <button
                            onClick={triggerNativePWAInstall}
                            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <WindowsIcon className="w-5 h-5" />
                            Install Desktop App
                          </button>
                        ) : (
                          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 text-left">
                            <h5 className="font-extrabold text-base text-white mb-3">Browser Installation</h5>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              Look for the install icon (desktop with down arrow) in the right side of your address bar to install this app on your computer.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* iOS Logic */}
                    {deviceType === "ios" && (
                      <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 text-left">
                        <h5 className="font-extrabold text-base text-white mb-3">Install Instructions</h5>
                        <p className="text-sm text-slate-300 leading-relaxed space-y-2">
                          <span className="block">1. Tap the <strong>Share</strong> button (📤) in Safari.</span>
                          <span className="block">2. Scroll down and select <strong>Add to Home Screen</strong>.</span>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
