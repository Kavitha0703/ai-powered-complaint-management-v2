const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

const regex = /\/\/ Sync and populate Meeting History state from all logged call messages[\s\S]*?setMeetings\(Array\.from\(callsMap\.values\(\)\)\);/g;

const replacement = `// Sync and populate Meeting History state from all logged call messages
    // Ensure we only show meetings for THIS channel
    const callMessages = filtered.filter(m => m.call_summary);
    
    // Filter out meetings that this user has cleared for this channel
    const clearedMeetingsStr = localStorage.getItem("dcms_cleared_meetings") || "[]";
    let clearedMeetings = [];
    try { clearedMeetings = JSON.parse(clearedMeetingsStr); } catch (e) {}
    
    const callHistoryList = callMessages
      .filter(m => !clearedMeetings.includes(m.id))
      .map(m => {
      const summary = m.call_summary;
      const title = summary.title || m.text.replace(/^Created a Google Meet: /, "").replace(/^Scheduled a Google Meet: /, "") || "Google Meet";
      const timestamp = summary.createdAt || m.created_at || m.time;
      const dateObj = new Date(timestamp);
      const formattedTime = isNaN(dateObj.getTime()) ? (m.time || "Recently") : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const durationText = summary.meet_status === "Ended" && summary.duration 
        ? summary.duration 
        : (summary.meet_status === "Live" ? "🟢 Live" : summary.meet_status === "Waiting" ? "🟡 Waiting" : summary.duration || "Google Meet");
      
      const participantsList = (summary.joinedParticipants && summary.joinedParticipants.length > 0)
        ? summary.joinedParticipants
        : (summary.participants && summary.participants.length > 0 ? summary.participants : [summary.organizerName || m.sender_name]);

      return {
        id: m.id,
        type: summary.type || "video",
        title: title,
        participants: participantsList,
        duration: durationText,
        timestamp: formattedTime
      };
    });
    
    setMeetings(callHistoryList);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
