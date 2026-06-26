const fs = require('fs');
const files = [
  'src/pages/UserPages.tsx',
  'src/pages/AdminPages.tsx',
  'src/pages/AdminCommunicationCenter.tsx',
  'src/components/DashboardLayout.tsx',
  'src/App.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match any dark:bg-[XXX] possibly followed by /YY 
  content = content.replace(/bg-white\s+dark:bg-\[#[A-Za-z0-9]+\](\/[0-9]+)?/g, 'bg-white dark:bg-[#0B1222]');
  // Also fix any places where I accidentally left a trailing /50 attached to a replaced color
  content = content.replace(/bg-white\s+dark:bg-\[#0B1222\](\/[0-9]+)+/g, 'bg-white dark:bg-[#0B1222]');
  
  // Also find other standalone dark:bg-[...] that should match the card color
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
