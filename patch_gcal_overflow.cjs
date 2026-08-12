const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

const regex1 = /useEffect\(\(\) => \{\s*if \(isOpen && !inline\) \{\s*document\.body\.style\.overflow = 'hidden';\s*\} else \{\s*document\.body\.style\.overflow = '';\s*\}\s*return \(\) => \{ document\.body\.style\.overflow = ''; \};\s*\}, \[isOpen, inline\]\);/;
code = code.replace(regex1, '');

const regex2 = /useEffect\(\(\) => \{\s*if \(!inline\) \{\s*document\.body\.style\.overflow = 'hidden';\s*return \(\) => \{\s*document\.body\.style\.overflow = 'unset';\s*\};\s*\}\s*\}, \[inline\]\);/;

const fixedEffect = `useEffect(() => {
    if (!isOpen || inline) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, inline]);`;

code = code.replace(regex2, fixedEffect);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched gcal overflow");
