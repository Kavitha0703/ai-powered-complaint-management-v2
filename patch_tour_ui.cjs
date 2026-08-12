const fs = require('fs');
let code = fs.readFileSync('src/components/ProductTour.tsx', 'utf-8');

const targetStr = `  // Removed contextual tips for inactivity`;
const idx = code.indexOf(targetStr);
const endIdx = code.indexOf(`    );\n  }`, idx);

if (idx !== -1 && endIdx !== -1) {
  const toReplace = code.substring(idx, endIdx + `    );\n  }`.length);
  code = code.replace(toReplace, '  // Removed contextual tips for inactivity\n\n  if (!activeTour) return null;');
  fs.writeFileSync('src/components/ProductTour.tsx', code);
  console.log("Patched ProductTour UI correctly");
} else {
  console.log("Could not find boundaries");
}
