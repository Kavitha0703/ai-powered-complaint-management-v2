const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const oldHandle = `  const handleCreateGoogleMeet = async (title: string, participants: string[]) => {
    const isConnected = !!sessionStorage.getItem("google_workspace_access_token");
    
    if (!isConnected) {
      sessionStorage.setItem("pendingMeetRoomId", activeRoomId);
      sessionStorage.setItem("pendingMeetTitle", title);
      sessionStorage.setItem("pendingMeetParticipants", JSON.stringify(participants));
      googleLogin();
      return;
    }

    try {
      const { createGoogleCalendarEvent } = await import('../lib/google/calendar');
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      const newEvent = await createGoogleCalendarEvent({
        summary: title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        addGoogleMeet: true,
        type: 'Team',
        visibility: 'Team',
        userId: user?.id
      });
      
      const meetLink = newEvent.hangoutLink;
      if (meetLink) {
        window.open(meetLink, '_blank');
        finalizeMeetingCreation(title, participants, user?.name || "Admin", activeRoomId, meetLink);
      } else {
        console.error("Failed to generate meet link.");
      }
    } catch (e) {
      console.error("Error creating Google Meet:", e);
    }
  };`;

const newHandle = `  const handleCreateGoogleMeet = async (title: string, participants: string[]) => {
    const accessToken = sessionStorage.getItem("google_workspace_access_token");
    
    if (!accessToken) {
      sessionStorage.setItem("pendingMeetRoomId", activeRoomId);
      sessionStorage.setItem("pendingMeetTitle", title);
      sessionStorage.setItem("pendingMeetParticipants", JSON.stringify(participants));
      googleLogin();
      return;
    }

    try {
      const { createMeetSpace } = await import('../lib/google/meet_api');
      const spaceData = await createMeetSpace(accessToken);
      
      const meetLink = spaceData.meetingUri;
      if (meetLink) {
        window.open(meetLink, '_blank');
        finalizeMeetingCreation(title, participants, user?.name || "Admin", activeRoomId, meetLink, spaceData.name);
      } else {
        console.error("Failed to generate meet link.");
      }
    } catch (e) {
      console.error("Error creating Google Meet:", e);
      alert("Google authorization failed. We couldn't connect your Google account. Please try again or choose another Google account.");
      sessionStorage.removeItem("google_workspace_access_token");
    }
  };`;

if(code.includes('handleCreateGoogleMeet = async (title: string, participants: string[]) => {')) {
  code = code.replace(oldHandle, newHandle);
  fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
  console.log("Patched");
} else {
  console.log("Not found");
}
