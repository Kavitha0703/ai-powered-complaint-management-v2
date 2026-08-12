const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');
const searchStr = `    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();
    if (customMsgText === undefined) {
      setCommentInput("");
    }`;
const replacementStr = `    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();
    setTimeout(() => scrollToBottom("smooth"), 50);
    if (customMsgText === undefined) {
      setCommentInput("");
    }`;
// Let's trim and replace using indexOf to be safe against line endings
const searchIdx = code.indexOf(searchStr.trim());
if (searchIdx !== -1) {
    code = code.substring(0, searchIdx) + replacementStr + code.substring(searchIdx + searchStr.trim().length);
    fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
    console.log("Success");
} else {
    // Try matching with regex ignoring whitespace
    const regex = /localStorage\.setItem\("dcms_chat_messages_v4", JSON\.stringify\(combined\)\);\s+loadWorkspaceMessages\(\);\s+if \(customMsgText === undefined\) {/g;
    code = code.replace(regex, `localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();
    setTimeout(() => scrollToBottom("smooth"), 50);
    if (customMsgText === undefined) {`);
    fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
    console.log("Success via regex");
}
