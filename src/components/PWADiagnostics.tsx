import React, { useEffect, useState } from "react";
import { Check, X, Smartphone, Server, FileText, Monitor, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function PWADiagnostics() {
  const [manifestDetected, setManifestDetected] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [swActive, setSwActive] = useState(false);
  const [beforeInstallAvailable, setBeforeInstallAvailable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [relatedAppsInstalled, setRelatedAppsInstalled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>("default");
  
  const buildVersion = "2.4.9";
  const buildDate = new Date().toISOString();
  
  useEffect(() => {
    // 1. Manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    setManifestDetected(!!manifestLink);

    // 2. Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setSwRegistered(true);
          if (reg.active) setSwActive(true);
        }
      });
    }

    // 3. BeforeInstallPrompt (we check if global flag was captured, though we cannot listen to it if it already fired)
    if ((window as any).deferredInstallPrompt) {
      setBeforeInstallAvailable(true);
    }
    const handleBIP = () => setBeforeInstallAvailable(true);
    window.addEventListener("beforeinstallprompt", handleBIP);

    // 4. Standalone
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsStandalone(true);
    } else if ("getInstalledRelatedApps" in navigator && window.self === window.top) {
      try {
        (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
          if (relatedApps.length > 0) {
            setRelatedAppsInstalled(true);
          }
        }).catch(console.error);
      } catch (err) {
        console.error("getInstalledRelatedApps error:", err);
      }
    }

    // 5. Notifications
    if ("Notification" in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus("unsupported");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBIP);
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Server className="w-6 h-6 text-emerald-400" />
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">App Diagnostics & PWA Status</h2>
          <p className="text-sm text-slate-400">Technical details for debugging application installation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Build Information</h3>
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Version</span>
              <span className="font-mono font-bold text-white">{buildVersion}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Build Date</span>
              <span className="font-mono text-white text-xs">{format(new Date(buildDate), "MMM d, yyyy h:mm a")}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Environment</span>
              <span className="font-mono text-emerald-400 font-bold">Production</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">PWA Capabilities</h3>
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3">
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Web Manifest</span>
              {manifestDetected ? <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="w-4 h-4"/> Detected</span> : <span className="flex items-center gap-1.5 text-red-400"><X className="w-4 h-4"/> Missing</span>}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Service Worker</span>
              {swRegistered ? <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="w-4 h-4"/> Registered ({swActive ? "Active" : "Waiting"})</span> : <span className="flex items-center gap-1.5 text-red-400"><X className="w-4 h-4"/> Not Registered</span>}
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Install Prompt Event</span>
              <span className={`flex items-center gap-1.5 font-mono ${beforeInstallAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
                {beforeInstallAvailable ? "Captured" : "Not Captured"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Display Mode</span>
              <span className="flex items-center gap-1.5 text-blue-400 font-mono">
                {isStandalone ? "standalone" : "browser"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">App Installed (Chrome API)</span>
              <span className={`flex items-center gap-1.5 font-mono ${relatedAppsInstalled ? 'text-emerald-400' : 'text-slate-400'}`}>
                {relatedAppsInstalled ? "Yes" : "No / Unsupported"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Notifications</span>
              <span className={`flex items-center gap-1.5 font-mono ${notificationStatus === 'granted' ? 'text-emerald-400' : notificationStatus === 'denied' ? 'text-red-400' : 'text-amber-400'}`}>
                {notificationStatus}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
