const fs = require('fs');
let code = fs.readFileSync('src/components/ProductTour.tsx', 'utf-8');

const targetStr = `  // Contextual tips for inactivity (Passive)`;
const idx = code.indexOf(targetStr);
const endIdx = code.indexOf(`  }, [location.pathname, activeTour, activeTip]);`, idx);

if (idx !== -1 && endIdx !== -1) {
  const toReplace = code.substring(idx, endIdx + `  }, [location.pathname, activeTour, activeTip]);`.length);
  code = code.replace(toReplace, '  // Removed contextual tips for inactivity');
  fs.writeFileSync('src/components/ProductTour.tsx', code);
  console.log("Patched ProductTour.tsx");
} else {
  console.log("Could not find boundaries");
}
