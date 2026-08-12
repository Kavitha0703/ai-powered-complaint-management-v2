const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// 1. Remove the span with quiet-alchemy
code = code.replace(
  /<span className="px-2 py-0.5 rounded-full text-\[10px\] font-bold bg-indigo-500\/10 text-indigo-300 border border-indigo-500\/30 flex items-center gap-1">[\s\S]*?Project quiet-alchemy-0lkqp[\s\S]*?<\/span>/,
  ''
);

// 2. Change width and height of modal
code = code.replace(
  "inline ? 'w-full' : 'max-w-2xl w-full max-h-[90vh]'",
  "inline ? 'w-full' : 'w-[90vw] md:w-full md:max-w-[800px] h-[90vh] md:h-[600px]'"
);

// 3. Add useEffect for body overflow hidden
const useEffectBodyStr = `
  useEffect(() => {
    if (isOpen && !inline) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, inline]);
`;

if (!code.includes("document.body.style.overflow = 'hidden'")) {
  const useAuthIdx = code.indexOf('const { user } = useAuth();');
  if (useAuthIdx !== -1) {
    code = code.substring(0, useAuthIdx) + useEffectBodyStr + '\n  ' + code.substring(useAuthIdx);
  }
}

// 4. Also fix the CalendarMonthView component to add Color, Task etc? No, they want me to just fix the UI.
// And "color customization" might be something they want.
fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched GoogleCalendarPanel modal styles");
