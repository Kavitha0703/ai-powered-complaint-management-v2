const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

// I'll add useEffect just below the useState declarations
const useEffectStr = `
  useEffect(() => {
    if (!inline) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [inline]);
`;

code = code.replace(
  "const [addMeet, setAddMeet] = useState(true);",
  "const [addMeet, setAddMeet] = useState(true);\n" + useEffectStr
);

// We need to make sure useEffect is imported.
// It is imported from 'react'. It's already there because useState is used.

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched body overflow");
