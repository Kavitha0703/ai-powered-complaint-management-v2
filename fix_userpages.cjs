const fs = require('fs');
let content = fs.readFileSync('src/pages/UserPages.tsx', 'utf-8');
content = content.replace(`  // Autosave when form values modify
  useEffect(() => {
  useEffect(() => {
    return () => {
      if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
    };
  }, []);
    // Avoid autosaving if user is editing an existing ticket (which has editTicketId)`, `  // Autosave when form values modify
  useEffect(() => {
    return () => {
      if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    // Avoid autosaving if user is editing an existing ticket (which has editTicketId)`);
fs.writeFileSync('src/pages/UserPages.tsx', content);
