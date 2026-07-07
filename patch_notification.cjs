const fs = require('fs');
let code = fs.readFileSync('src/components/AppInstallModal.tsx', 'utf8');

const replacement = `
  // Trigger browser PWA setup
  const triggerNativePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        showInstallNotification();
      }
    } else {
      // Trigger mock simulation onboarding workflow
      setIsInstalled(true);
      showInstallNotification();
    }
  };

  const showInstallNotification = () => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification("App Installed", {
        body: "Workplace Hub has been successfully installed on your device.",
        icon: "/logo-192.png"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("App Installed", {
            body: "Workplace Hub has been successfully installed on your device.",
            icon: "/logo-192.png"
          });
        }
      });
    }
  };
`;

code = code.replace(
  /\/\/ Trigger browser PWA setup[\s\S]*?const getInstallUrl = \(\) => {/,
  replacement + "\n\n  const getInstallUrl = () => {"
);

fs.writeFileSync('src/components/AppInstallModal.tsx', code);
console.log("Patched AppInstallModal.tsx");
