const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace(/import\s*\{\s*LanguageProvider\s*\}\s*from\s*['"]\.\/lib\/LanguageContext\.tsx['"];?\s*/g, '');
appTsx = appTsx.replace(/<LanguageProvider>/g, '');
appTsx = appTsx.replace(/<\/LanguageProvider>/g, '');
fs.writeFileSync('src/App.tsx', appTsx);

let aiAss = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');
aiAss = aiAss.replace(/import\s*\{\s*useLanguage\s*\}\s*from\s*['"]\.\.\/lib\/LanguageContext\.tsx['"];?\s*/g, '');
aiAss = aiAss.replace(/const\s*\{\s*language\s*\}\s*=\s*useLanguage\(\);?/g, '');
fs.writeFileSync('src/components/DcmsAiAssistant.tsx', aiAss);

console.log("LanguageContext usages removed.");
