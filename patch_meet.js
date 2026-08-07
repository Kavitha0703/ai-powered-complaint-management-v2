const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

code = code.replace(/const activeMeeting = getActiveMeetingForRoom\(activeRoomId\);/g, 'const activeMeeting = getActiveMeetingForRoom(roomIdToUse);');
code = code.replace(/sessionStorage.setItem\("pendingMeetRoomId", activeRoomId\);/g, 'sessionStorage.setItem("pendingMeetRoomId", roomIdToUse);');
code = code.replace(/room_id: activeRoomId,/g, 'room_id: roomIdToUse,');

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
