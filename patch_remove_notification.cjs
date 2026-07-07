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
        localStorage.setItem('showInstallSuccess', 'true');
        window.dispatchEvent(new Event('appinstalled'));
      }
    } else {
      // Trigger mock simulation onboarding workflow
      setIsInstalled(true);
      localStorage.setItem('showInstallSuccess', 'true');
      window.dispatchEvent(new Event('appinstalled'));
    }
    handleClose();
  };
`;

code = code.replace(
  /\/\/ Trigger browser PWA setup[\s\S]*?const getInstallUrl = \(\) => {/,
  replacement + "\n\n  const getInstallUrl = () => {"
);

fs.writeFileSync('src/components/AppInstallModal.tsx', code);
console.log("Patched AppInstallModal.tsx to remove notification");
