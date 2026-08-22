const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

code = code.replace(
  /const finalizeMeetingCreation = \(title: string, participants: string\[\], adminName: string, roomId: string, link: string\) => \{/,
  `const finalizeMeetingCreation = (title: string, participants: string[], adminName: string, roomId: string, link: string, spaceName?: string) => {`
);

code = code.replace(
  /call_summary: \{\s*title: title,\s*type: "video",\s*meet_link: link,\s*meet_status: "Waiting",\s*participants: participants,\s*duration: "0:00"\s*\}/,
  `call_summary: {
        title: title,
        type: "video",
        meet_link: link,
        meet_status: "Waiting",
        participants: participants,
        duration: "0:00",
        space_name: spaceName,
        started_at: new Date().toISOString()
      }`
);

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
