const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

const regex1 = /useEffect\(\(\) => \{\s*if \(!isOpen \|\| inline\) return;\s*const previousOverflow = document.body.style.overflow;\s*document.body.style.overflow = 'hidden';\s*return \(\) => \{\s*document.body.style.overflow = previousOverflow;\s*\};\s*\}, \[isOpen, inline\]\);/;

const replace1 = `useEffect(() => {
    if (!isOpen || inline) return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, inline]);`;

code = code.replace(regex1, replace1);

const regex2 = /useEffect\(\(\) => \{\s*if \(!inline\) \{\s*document.body.style.overflow = 'hidden';\s*return \(\) => \{\s*document.body.style.overflow = 'unset';\s*\};\s*\}\s*\}, \[inline\]\);/;

const replace2 = `useEffect(() => {
    if (!inline) {
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [inline]);`;

code = code.replace(regex2, replace2);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched GoogleCalendarPanel overflow");
