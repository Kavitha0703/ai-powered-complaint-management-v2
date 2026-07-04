const fs = require('fs');

let code = fs.readFileSync('src/pages/UserPages.tsx', 'utf8');

// Function to remove Accessibility, Privacy, and About blocks
// But we should NOT remove it from UserSettings.
// Let's first split the code into functions.
const parts = code.split(/(export function )/g);

let newCode = "";

for (let i = 0; i < parts.length; i++) {
  let part = parts[i];
  
  if (i > 0 && parts[i-1] === 'export function ') {
      // Check the function name
      if (part.startsWith('UserSettings(')) {
          // Keep it
          newCode += part;
      } else {
          // Remove the blocks
          const regex = /\s*\{\/\* Accessibility \*\/\}\s*<Card[\s\S]*?<\/Card>\s*\{\/\* Privacy \*\/\}\s*<Card[\s\S]*?<\/Card>\s*\{\/\* About \*\/\}\s*<Card[\s\S]*?<\/Card>/g;
          part = part.replace(regex, '');
          newCode += part;
      }
  } else {
      newCode += part;
  }
}

fs.writeFileSync('src/pages/UserPages.tsx', newCode);
