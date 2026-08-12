const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');
const search = `    } catch (err) {
        console.error(err);
      }
    }
  });`;
const inject = `
  const finalizeMeetingCreation = (title: string, participants: string[], adminName: string, roomId: string, link: string) => {
    const msgId = "meet_" + Date.now();
    const newMsg: ChatMessage = {
      id: msgId,
      room_id: roomId,
      sender_id: currentAdminId,
      sender_name: adminName,
      text: "",
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      message_status: "sent",
      call_summary: {
        id: msgId,
        title: title,
        type: "video",
        meet_link: link,
        meet_status: "Waiting",
        participants: participants
      }
    };
    const saved = localStorage.getItem("dcms_chat_messages_v4");
    const allMsg = saved ? JSON.parse(saved) : [];
    const combined = [...allMsg, newMsg];
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();
    setTimeout(() => scrollToBottom("smooth"), 50);
  };
`;
code = code.replace(search, search + inject);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
