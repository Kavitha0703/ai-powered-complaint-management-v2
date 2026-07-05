const fs = require('fs');

let code = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');

const regex = /<div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse md:flex-row items-end md:items-center gap-3 font-sans transition-all duration-300">/;
const replacement = `<div className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col-reverse md:flex-row items-end md:items-center gap-3 font-sans transition-all duration-300">`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/DashboardLayout.tsx', code);
