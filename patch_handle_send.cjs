const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

const target = `    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();
    if (customMsgText === undefined) {
      setCommentInput("");
    }`;

const replacement = `    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();
    setTimeout(() => scrollToBottom("smooth"), 50);
    if (customMsgText === undefined) {
      setCommentInput("");
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
