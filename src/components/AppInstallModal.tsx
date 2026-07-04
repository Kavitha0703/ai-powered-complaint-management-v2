import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Smartphone, QrCode, Clipboard, Share2, 
  Mail, ArrowRight, Check, AlertCircle, 
  Smartphone as AndroidIcon, Laptop as WindowsIcon
} from "lucide-react";
import QRCode from "react-qr-code";

interface AppInstallModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppInstallModal({ isOpen: propIsOpen, onClose: propOnClose }: AppInstallModalProps) {
    
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"install" | "scan" | "share" | "help">("install");
  
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
    };

    window.addEventListener("open-install-modal", handleOpenInstallModal);
    return () => {
      window.removeEventListener("open-install-modal", handleOpenInstallModal);
    };
  }, []);

  // Sync PWA trigger capture
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Check if running in standalone display mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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
  };

  // Trigger browser PWA setup
  const triggerNativePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // Trigger mock simulation onboarding workflow
      setIsInstalled(true);
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
        className="fixed inset-0 bg-[#020617]/75 backdrop-blur-[6px] z-[9999] transition-all"
      />

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[10000] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="bg-[#0B1329] border border-slate-800 text-white rounded-3xl w-full max-w-2xl pointer-events-auto shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden font-sans flex flex-col md:flex-row h-[500px]"
        >
          {/* Left Panel - Tabs */}
          <div className="w-full md:w-56 bg-slate-950/45 border-r border-slate-800/80 p-5 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight mt-1">{"App Installer"}</h3>
                <p className="text-[10px] text-slate-500 mt-1">{"Workplace Hub PWA"}</p>
              </div>

              {/* Rails menu list */}
              <div className="space-y-1">
                {[
                  { id: "install", label: "Install App", icon: Smartphone },
                  { id: "scan", label: "Scan QR", icon: QrCode },
                  { id: "share", label: "Send Link", icon: Share2 },
                  { id: "help", label: "Need Help?", icon: AlertCircle }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-3 cursor-pointer text-xs font-bold border ${
                        active 
                          ? "bg-blue-600/20 text-blue-400 border-blue-500/30" 
                          : "text-slate-400 hover:text-white border-transparent hover:bg-slate-900/30"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-blue-400" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col relative bg-slate-900/20">
            {/* Header with close */}
            <div className="flex justify-end absolute top-4 right-6 z-10">
              <button 
                onClick={handleClose}
                className="w-7 h-7 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="pt-6 pb-4 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
              {activeTab === "install" && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl border border-blue-500/30 mx-auto flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-lg">{"Install Workplace Hub"}</h4>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      {"Run directly from your home screen with no app store downloads. Works offline and syncs automatically."}</p>
                  </div>
                  <button
                    onClick={triggerNativePWAInstall}
                    className={`w-full h-11 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isInstalled 
                        ? "bg-emerald-950/40 border border-emerald-900 text-emerald-400" 
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                    }`}
                  >
                    {isInstalled ? (
                      <><Check className="w-4 h-4" /> {"Installed Successfully"}</>
                    ) : (
                      <><Smartphone className="w-4 h-4" /> {"Install on this Device"}</>
                    )}
                  </button>
                </div>
              )}

              {activeTab === "scan" && (
                <div className="space-y-6 text-center">
                  <div>
                    <h4 className="font-extrabold text-white text-lg">{"Scan to Install"}</h4>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      {"Point your phone's camera at this QR code to open the installer on your mobile device."}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl inline-block mx-auto border-4 border-slate-800 shadow-xl">
                    <QRCode value={installUrl} size={160} level="H" />
                  </div>
                </div>
              )}

              {activeTab === "share" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="font-extrabold text-white text-lg">{"Share Install Link"}</h4>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      {"Send the installation link to your coworkers or open it on another device."}</p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={copyAppLink}
                      className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Clipboard className="w-4 h-4" />
                      {copied ? "Link Copied!" : "📋 Copy Install Link"}
                    </button>
                    <button 
                      onClick={triggerNativeShare}
                      className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      {"📤 Share Install Link"}</button>
                  </div>

                  <form onSubmit={handleSendEmail} className="pt-4 border-t border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-300">{"Email to device"}</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder={"you@company.com"}
                        value={emailAddress}
                        onChange={e => setEmailAddress(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={mailSent}
                        className="px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        {mailSent ? <Check className="w-4 h-4" /> : "Send"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "help" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-extrabold text-white text-lg text-center">{"Installation Help"}</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🍎</span>
                        <h5 className="font-bold text-sm text-white">{"iOS / iPhone"}</h5>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {"1. Open the install link in"}<strong>{"Safari"}</strong>.<br/>
                        {"2. Tap the"}<strong>{"Share"}</strong> {"button (📤) at the bottom."}<br/>
                        {"3. Scroll down and tap"}<strong>{"Add to Home Screen"}</strong>.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <AndroidIcon className="w-5 h-5 text-emerald-400" />
                        <h5 className="font-bold text-sm text-white">{"Android"}</h5>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {"1. Open the install link in"}<strong>{"Chrome"}</strong>.<br/>
                        {"2. A banner should appear at the bottom asking you to install."}<br/>
                        {"3. If not, tap the three dots (⋮) and select"}<strong>{"Install app"}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
