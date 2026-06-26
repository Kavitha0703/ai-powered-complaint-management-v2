const fs = require('fs');

const file = 'src/pages/AdminPages.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard stats card backgrounds
content = content.replace(/bg-amber-50\/[0-9]+ dark:bg-amber-95[0-9]\/[0-9]+/g, 'bg-white dark:bg-[#0B1222]');
content = content.replace(/bg-blue-50\/[0-9]+ dark:bg-blue-95[0-9]\/[0-9]+/g, 'bg-white dark:bg-[#0B1222]');
content = content.replace(/bg-green-50\/[0-9]+ dark:bg-green-95[0-9]\/[0-9]+/g, 'bg-white dark:bg-[#0B1222]');
content = content.replace(/bg-red-50\/[0-9]+ dark:bg-red-95[0-9]\/[0-9]+/g, 'bg-white dark:bg-[#0B1222]');
content = content.replace(/bg-purple-50\/[0-9]+ dark:bg-purple-95[0-9]\/[0-9]+/g, 'bg-white dark:bg-[#0B1222]');
content = content.replace(/bg-cyan-50\/[0-9]+ dark:bg-cyan-95[0-9]\/[0-9]+/g, 'bg-white dark:bg-[#0B1222]');

// The 3 notice card backgrounds
content = content.replace(/bg-blue-50\/50 dark:bg-slate-900\/10/g, 'bg-white dark:bg-[#0B1222]');
content = content.replace(/bg-indigo-50\/50 dark:bg-slate-900\/10/g, 'bg-white dark:bg-[#0B1222]');
content = content.replace(/bg-emerald-50\/50 dark:bg-slate-900\/10/g, 'bg-white dark:bg-[#0B1222]');


fs.writeFileSync(file, content);
console.log('Fixed', file);
