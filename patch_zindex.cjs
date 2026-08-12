const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/z-50/g, 'z-[1000]');
  content = content.replace(/z-100/g, 'z-[1000]');
  fs.writeFileSync(file, content);
}

patchFile('src/components/GoogleCalendarPanel.tsx');
patchFile('src/components/GmailEmailCenterPanel.tsx');

// For AdminTeamChat.tsx, we need to be careful. The resize panel handles themselves have z-50.
let adminTeamChat = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');
// Replace fixed inset-0 backdrops
adminTeamChat = adminTeamChat.replace(/className="fixed inset-0[^"]*z-50/g, (match) => {
  return match.replace('z-50', 'z-[1000]');
});
// Replace z-50 that are used for modals, but leave ResizablePanel ones if they are in ResizablePanel component.
// Wait, ResizablePanel handles are in ResizablePanel.tsx.
// What has z-50 in AdminTeamChat?
// Context menus, dropdowns, etc. We probably shouldn't blindly replace all z-50.
fs.writeFileSync('src/pages/AdminTeamChat.tsx', adminTeamChat);

console.log("Done");
