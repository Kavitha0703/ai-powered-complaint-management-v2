const fs = require('fs');

let code = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');

// Hide Install App
code = code.replace(/<button\s+id="tour-install-app"\s+onClick=\{\(\) => window\.dispatchEvent\(new CustomEvent\("open-install-modal"\)\)\}\s+className="/, 
  '<button id="tour-install-app" onClick={() => window.dispatchEvent(new CustomEvent("open-install-modal"))} className="hidden md:flex ');

// Hide Theme Toggle
code = code.replace(/<button\s+id="tour-theme-toggle"\s+onClick=\{\(\) => setTheme\(theme === 'dark' \? 'light' : 'dark'\)\}\s+className="/, 
  '<button id="tour-theme-toggle" onClick={() => setTheme(theme === \'dark\' ? \'light\' : \'dark\')} className="hidden md:flex ');

// Hide Notification Bell
code = code.replace(/<div className="relative">\s*<button\s+id="tour-notification-bell"/, 
  '<div className="relative hidden md:block">\n              <button id="tour-notification-bell"');

fs.writeFileSync('src/components/DashboardLayout.tsx', code);
