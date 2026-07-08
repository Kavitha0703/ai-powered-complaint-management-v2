import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Smartphone, Monitor, Download, Apple, Compass, Chrome, ArrowRight, Check, AlertCircle, Share2, Laptop
} from "lucide-react";

interface AppInstallModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppInstallModal({ isOpen: propIsOpen, onClose: propOnClose }: AppInstallModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop" | "unknown">("unknown");
  const [browserType, setBrowserType] = useState<"safari" | "chrome" | "edge" | "firefox" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [apkDownloading, setApkDownloading] = useState(false);

  // Sync prop open state
  useEffect(() => {
    if (propIsOpen !== undefined) setIsOpen(propIsOpen);
  }, [propIsOpen]);

  useEffect(() => {
    const handleOpenInstallModal = (e: Event) => setIsOpen(true);
    window.addEventListener("open-install-modal", handleOpenInstallModal);
    return () => window.removeEventListener("open-install-modal", handleOpenInstallModal);
  }, []);

  // OS & Browser Detection
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    // OS Detection
    if (/android/.test(ua)) {
      setDeviceType("android");
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType("ios");
    } else if (/windows|macintosh|linux|cros/.test(ua)) {
      setDeviceType("desktop");
    } else {
      setDeviceType("unknown");
    }

    // Browser Detection
    if (/safari/.test(ua) && !/chrome|crios|fxios/.test(ua)) {
      setBrowserType("safari");
    } else if (/edg/.test(ua)) {
      setBrowserType("edge");
    } else if (/chrome|crios/.test(ua)) {
      setBrowserType("chrome");
    } else if (/firefox|fxios/.test(ua)) {
      setBrowserType("firefox");
    } else {
      setBrowserType("other");
    }
  }, []);

  // PWA Prompt Capture
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
          if (relatedApps.length > 0) setIsInstalled(true);
        }).catch(console.error);
      } catch (err) {
        console.error("getInstalledRelatedApps error:", err);
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // App Installed Event
  useEffect(() => {
    const handleAppInstalledEvent = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if ("Notification" in window) Notification.requestPermission();
    };
    window.addEventListener("appinstalled", handleAppInstalledEvent);
    return () => window.removeEventListener("appinstalled", handleAppInstalledEvent);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const triggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  const handleApkDownload = () => {
    setApkDownloading(true);
    // Simulate APK generation/download delay
    setTimeout(() => {
      setApkDownloading(false);
      // In a real app this would trigger an actual APK download from the server
      const link = document.createElement('a');
      link.href = '#'; // Placeholder for real APK URL
      link.download = 'WorkplaceHub.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Downloading WorkplaceHub.apk. Please open the file to install once the download completes.");
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-[#020617]/85 backdrop-blur-sm z-[9999] transition-all"
      />

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[10000] p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="bg-[#0B1329] border border-slate-800 text-white rounded-3xl w-full max-w-md pointer-events-auto shadow-2xl overflow-hidden font-sans flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
            <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              {"Install Workplace Hub"}
            </h3>
            <button 
              onClick={handleClose}
              className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            
            {isInstalled ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">Installed Successfully</h4>
                  <p className="text-slate-400 text-sm mt-1">Workplace Hub is ready to use on your device.</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full h-12 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> Open Workplace Hub
                </button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2 mb-6">
                  <p className="text-slate-400 text-sm">
                    {deviceType === "android" && "For the best experience on Android, download the native app."}
                    {deviceType === "desktop" && "Install Workplace Hub as a native desktop application."}
                    {deviceType === "ios" && "Add Workplace Hub to your iPhone or iPad home screen."}
                    {deviceType === "unknown" && "Choose an installation method below."}
                  </p>
                </div>

                {/* 1. Android Flow */}
                {(deviceType === "android" || deviceType === "unknown") && (
                  <div className={`p-5 rounded-2xl border ${deviceType === "android" ? 'bg-blue-900/10 border-blue-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Smartphone className={`w-6 h-6 ${deviceType === "android" ? 'text-blue-400' : 'text-slate-400'}`} />
                      <div>
                        <h4 className="font-bold text-white text-sm">Android App</h4>
                        <p className="text-xs text-slate-400">Native APK, works offline, push notifications</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleApkDownload}
                      disabled={apkDownloading}
                      className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                        deviceType === "android" ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {apkDownloading ? <span className="animate-pulse">Generating APK...</span> : <><Download className="w-4 h-4" /> Download APK (18 MB)</>}
                    </button>
                  </div>
                )}

                {/* 2. Desktop Flow (Windows/Linux/ChromeOS/Mac) */}
                {(deviceType === "desktop" || deviceType === "unknown") && (
                  <div className={`p-5 rounded-2xl border ${deviceType === "desktop" ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Laptop className={`w-6 h-6 ${deviceType === "desktop" ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <h4 className="font-bold text-white text-sm">Desktop App</h4>
                        <p className="text-xs text-slate-400">Windows, Mac, Linux, ChromeOS</p>
                      </div>
                    </div>
                    
                    {deferredPrompt ? (
                      <button 
                        onClick={triggerPWAInstall}
                        className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                          deviceType === "desktop" ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                      >
                        <Download className="w-4 h-4" /> Install Desktop App
                      </button>
                    ) : (
                      <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                        <p className="text-xs text-slate-300 font-medium">
                          {browserType === "chrome" && "Click the install icon ( 🖥️ ) in the right side of your Chrome address bar, or open the Chrome menu (⋮) and select 'Install Workplace Hub'."}
                          {browserType === "edge" && "Click the 'App available' icon in your address bar, or open the Edge menu (...) and select 'Apps > Install this site as an app'."}
                          {browserType !== "chrome" && browserType !== "edge" && "To install as a desktop app, please open this site in Google Chrome or Microsoft Edge."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. iOS Flow */}
                {(deviceType === "ios" || deviceType === "unknown") && (
                  <div className={`p-5 rounded-2xl border ${deviceType === "ios" ? 'bg-purple-900/10 border-purple-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Apple className={`w-6 h-6 ${deviceType === "ios" ? 'text-purple-400' : 'text-slate-400'}`} />
                      <div>
                        <h4 className="font-bold text-white text-sm">iPhone & iPad</h4>
                        <p className="text-xs text-slate-400">Add to Home Screen</p>
                      </div>
                    </div>
                    
                    {browserType === "safari" ? (
                      <div className="space-y-2 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                        <p className="flex items-center gap-2"><span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-bold">1</span> Tap the <strong>Share</strong> button <Share2 className="w-3 h-3 inline text-blue-400"/></p>
                        <p className="flex items-center gap-2"><span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-bold">2</span> Scroll down and tap <strong>Add to Home Screen</strong></p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                        <p className="flex items-start gap-2 text-amber-400">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Apple requires you to open this page in <strong>Safari</strong> to install the app to your home screen.</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Continue in browser */}
                <div className="pt-2">
                  <button 
                    onClick={handleClose}
                    className="w-full h-11 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center"
                  >
                    Continue in Browser
                  </button>
                </div>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </>
  );
}
