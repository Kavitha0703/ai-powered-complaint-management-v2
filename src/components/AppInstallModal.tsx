import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Smartphone, QrCode, Clipboard, Share2, 
  Mail, ArrowRight, Check, AlertCircle, ArrowLeft,
  Smartphone as AndroidIcon, Laptop as WindowsIcon
} from "lucide-react";
import QRCode from "react-qr-code";

interface AppInstallModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppInstallModal({ isOpen: propIsOpen, onClose: propOnClose }: AppInstallModalProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"menu" | "install" | "scan" | "share" | "help">("menu");
  
  // Install states
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("desktop");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Mail simulator
  const [emailAddress, setEmailAddress] = useState("");
  const [mailSent, setMailSent] = useState(false);
  
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
      setCurrentView("menu");
    };

    window.addEventListener("open-install-modal", handleOpenInstallModal);
    return () => {
      window.removeEventListener("open-install-modal", handleOpenInstallModal);
    };
  }, []);

  // Sync PWA trigger capture
  useEffect(() => {
    // If we missed the event, check the global variable
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
      // Check if installed on Android Chrome but running in browser (only in top-level context)
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
      console.log("PWA Installed");
      setIsInstalled(true);
      setDeferredPrompt(null);
      // Ask for notification permission after successful installation
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
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType("ios");
    } else if (/android/.test(ua)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  // Handle local closing
  const handleClose = () => {
    setIsOpen(false);
    if (propOnClose) {
      propOnClose();
    }
    setMailSent(false);
    setTimeout(() => {
      setCurrentView("menu");
    }, 300); // reset after animation
  };

  // Trigger browser PWA setup
  const triggerNativePWAInstall = async () => {
    if (isInstalled) {
      handleClose();
      return;
    }
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        // Do NOT set isInstalled here manually. Let the appinstalled event handle it.
      }
    }
  };


  const getInstallUrl = () => {
    if (typeof window === "undefined") return "https://ai-powered-complaint-management-v2.vercel.app";
    // If running in AI Studio preview (*.run.app), force the production Vercel URL
    if (window.location.hostname.includes(".run.app")) {
      return "https://ai-powered-complaint-management-v2.vercel.app";
    }
    // Otherwise use origin
    return window.location.origin;
  };
  const installUrl = getInstallUrl();

  // Copy app distribution link
  const copyAppLink = () => {
    navigator.clipboard.writeText(installUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Trigger web native share API
  const triggerNativeShare = async () => {
    const shareData = {
      title: "Workplace Hub Portal",
      text: "Install the company operations dashboard.",
      url: installUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyAppLink();
      }
    } catch (err) {
      copyAppLink();
    }
  };

  // Dispatch simulated invite email
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;
    setMailSent(true);
    setTimeout(() => {
      // Reset after a delay
      setMailSent(false);
      setEmailAddress("");
    }, 4500);
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
          className="bg-[#0B1329] border border-slate-800 text-white rounded-3xl w-full max-w-md pointer-events-auto shadow-2xl overflow-hidden font-sans flex flex-col min-h-[450px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 relative">
            <div className="flex items-center">
              {currentView !== "menu" && (
                <button 
                  onClick={() => setCurrentView("menu")}
                  className="mr-3 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="font-extrabold text-white text-base tracking-tight">
                {currentView === "menu" ? "App Installer" : 
                 currentView === "scan" ? "Scan QR Code" :
                 currentView === "share" ? "Share Link" :
                 currentView === "install" ? "Install App" : "Help"}
              </h3>
            </div>
            <button 
              onClick={handleClose}
              className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col relative bg-slate-900/10">
            <AnimatePresence mode="wait">
              
              {currentView === "menu" && (
                <motion.div 
                  key="menu"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-5"
                >
                  <div className="text-center mb-2">
                    <h4 className="font-extrabold text-white text-xl">{"Choose Installation Method"}</h4>
                    <p className="text-slate-400 text-sm mt-2">
                      {"Workplace Hub is available as a lightweight PWA."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {isInstalled ? (
                      <button 
                        onClick={() => {
                          if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
                            window.location.href = "/";
                          } else {
                            handleClose();
                            alert("The app is already installed.\nPlease open Workplace Hub from your Home Screen.");
                          }
                        }}
                        className="w-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/50 rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                          <Check className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-emerald-400 text-sm">{"Open Workplace Hub"}</h5>
                          <p className="text-xs text-emerald-600/80 mt-0.5">{"Launch the installed application."}</p>
                        </div>
                      </button>
                    ) : (
                      <button 
                        onClick={() => setCurrentView("install")}
                        className="w-full bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-white text-sm">{"Install on this Device"}</h5>
                          <p className="text-xs text-slate-400 mt-0.5">{"Add to your home screen or dock."}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                      </button>
                    )}

                    <button 
                      onClick={() => setCurrentView("scan")}
                      className="w-full bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-white text-sm">{"Scan QR"}</h5>
                        <p className="text-xs text-slate-400 mt-0.5">{"Install on a different mobile phone."}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </button>

                    <button 
                      onClick={() => setCurrentView("share")}
                      className="w-full bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-white text-sm">{"Send Link"}</h5>
                        <p className="text-xs text-slate-400 mt-0.5">{"Share link via email or text."}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </button>
                    
                  </div>
                </motion.div>
              )}

              {currentView === "install" && (
                <motion.div 
                  key="install"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-6 text-center"
                >
                  <div className="w-20 h-20 bg-blue-600/20 rounded-3xl border border-blue-500/30 mx-auto flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xl">
                      {deviceType === "ios" ? "Add Workplace Hub to Home Screen" : "Install Workplace Hub"}
                    </h4>
                  </div>
                  
                  {isInstalled ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-2">
                        <Check className="w-5 h-5" />
                        <span className="text-sm uppercase tracking-wider">Installed Successfully</span>
                      </div>
                      <button
                        onClick={() => {
                          if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
                            window.location.href = "/";
                          } else {
                            handleClose();
                            alert("Your app has been installed.\nPlease open Workplace Hub from your Home Screen or App Drawer.");
                          }
                        }}
                        className="w-full h-12 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-950/40 border border-emerald-900 text-emerald-400"
                      >
                         <Check className="w-5 h-5" /> {"Open Workplace Hub"}
                      </button>
                    </div>
                  ) : deferredPrompt ? (
                    <button
                      onClick={triggerNativePWAInstall}
                      className="w-full h-12 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                    >
                      <Smartphone className="w-5 h-5" /> 
                      {deviceType === "desktop" ? "Install Desktop App (PWA)" : "Add to Home Screen (Recommended)"}
                    </button>
                  ) : (
                    <div className="space-y-4 text-left">
                      {deviceType === "android" && (
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
                          <p className="text-sm text-slate-300 mb-4">
                            Workplace Hub native Android application is currently in development.
                          </p>
                          <button disabled className="w-full h-12 font-extrabold text-sm uppercase tracking-wider rounded-xl bg-slate-700 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2">
                            Download APK (Coming Soon)
                          </button>
                        </div>
                      )}
                      
                      {deviceType === "desktop" && (
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                          <p className="text-sm text-slate-300 space-y-2">
                            <strong className="block text-white mb-2">Instructions:</strong>
                            <span className="block"><strong>Chrome / Edge / Brave:</strong> Menu → Install App</span>
                          </p>
                        </div>
                      )}
                      
                      {deviceType === "ios" && (
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                          <p className="text-sm text-slate-300 space-y-2">
                            <strong className="block text-white mb-2">Instructions:</strong>
                            <span className="block"><strong>Safari:</strong></span>
                            <span className="block">1. Tap the <strong>Share</strong> button (📤)</span>
                            <span className="block">2. Tap <strong>Add to Home Screen</strong></span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {currentView === "scan" && (
                <motion.div 
                  key="scan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-center mx-auto w-full space-y-6 text-center"
                >
                  <div>
                    <h4 className="font-extrabold text-white text-xl mb-1">{"Scan to Install"}</h4>
                    <p className="text-slate-400 text-sm">
                      {"Scan with any phone camera"}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-3xl inline-block mx-auto border-4 border-slate-700 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-transform hover:scale-105">
                    <QRCode value={installUrl} size={250} level="H" style={{ maxWidth: '100%', width: '100%', height: 'auto' }} />
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{"or open this link:"}</p>
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                        <span className="flex-1 text-slate-300 text-xs truncate text-left">{installUrl}</span>
                        <button 
                          onClick={copyAppLink}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentView === "share" && (
                <motion.div 
                  key="share"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-3xl border border-purple-500/30 mx-auto flex items-center justify-center mb-4">
                      <Share2 className="w-8 h-8 text-purple-400" />
                    </div>
                    <h4 className="font-extrabold text-white text-xl">{"Share Install Link"}</h4>
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                      {"Send the installation link to your coworkers or open it on another device."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={copyAppLink}
                      className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-700/50"
                    >
                      <Clipboard className="w-5 h-5 text-slate-400" />
                      {copied ? "Link Copied!" : "📋 Copy Install Link"}
                    </button>
                    <button 
                      onClick={triggerNativeShare}
                      className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-700/50"
                    >
                      <Share2 className="w-5 h-5 text-blue-400" />
                      {"📤 Share via System"}
                    </button>
                  </div>

                  <form onSubmit={handleSendEmail} className="pt-6 border-t border-slate-800/80 space-y-3">
                    <label className="text-sm font-bold text-slate-300">{"Email to device"}</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder={"you@company.com"}
                        value={emailAddress}
                        onChange={e => setEmailAddress(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 h-12 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={mailSent}
                        className="px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-emerald-600 text-white font-bold text-sm transition-colors cursor-pointer h-12 flex items-center justify-center"
                      >
                        {mailSent ? <Check className="w-5 h-5" /> : "Send"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {currentView === "help" && (
                <motion.div 
                  key="help"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col max-w-sm mx-auto w-full space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-3xl border border-slate-700 mx-auto flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="font-extrabold text-white text-xl">{"Installation Help"}</h4>
                  </div>
                    
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🍎</span>
                        <h5 className="font-extrabold text-base text-white">{"iOS / iPhone"}</h5>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed space-y-1">
                        <span className="block">{"1. Open the install link in"} <strong>{"Safari"}</strong>.</span>
                        <span className="block">{"2. Tap the"} <strong>{"Share"}</strong> {"button (📤) at the bottom."}</span>
                        <span className="block">{"3. Scroll down and tap"} <strong>{"Add to Home Screen"}</strong>.</span>
                      </p>
                    </div>

                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-3">
                        <AndroidIcon className="w-6 h-6 text-emerald-400" />
                        <h5 className="font-extrabold text-base text-white">{"Android"}</h5>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed space-y-1">
                        <span className="block">{"1. Open the install link in"} <strong>{"Chrome"}</strong>.</span>
                        <span className="block">{"2. A banner should appear at the bottom asking you to install."}</span>
                        <span className="block">{"3. If not, tap the three dots (⋮) and select"} <strong>{"Install app"}</strong>.</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
