const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const injection = `
window.addEventListener('appinstalled', () => {
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
});
`;

if (!code.includes("window.addEventListener('appinstalled'")) {
  code = code.replace("createRoot", injection + "\ncreateRoot");
  fs.writeFileSync('src/main.tsx', code);
  console.log("Patched main.tsx");
}
