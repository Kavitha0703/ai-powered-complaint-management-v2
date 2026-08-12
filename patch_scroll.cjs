const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

// Replace the scrollToBottom implementation
const oldScroll = `  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };`;

const newScroll = `  const isNearBottom = () => {
    const el = document.getElementById("chat-scroll-container");
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = document.getElementById("chat-scroll-container");
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  };`;

code = code.replace(oldScroll, newScroll);

// Also we need to add the id to the chat feed
code = code.replace(
  'className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 space-y-3" style={{ scrollbarGutter: "stable" }}',
  'id="chat-scroll-container"\n                className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 space-y-3" style={{ scrollbarGutter: "stable" }}'
);

// We need to modify when scrollToBottom is called.
// It is called in loadWorkspaceMessages, handleSendMessage, etc.
// In `loadWorkspaceMessages`, after loading, it should only scroll if it was already at bottom or if it's the first load. Let's just scroll to bottom instantly on load.
// Wait, when receiving messages (supabase subscription), there is a `window.dispatchEvent("dcms_messages_updated")` which might be calling `scrollToBottom`.
// Let's grep for `scrollToBottom()`

fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched scrollToBottom");
