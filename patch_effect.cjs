const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

const oldEffect = `  // Auto scroll to latest message when activeRoomId or messages count changes
  useEffect(() => {
    scrollToBottom();
  }, [activeRoomId, messages.length]);`;

const newEffect = `  // Auto scroll to latest message when activeRoomId or messages count changes
  const prevRoomIdRef = useRef(activeRoomId);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    const isNewRoom = prevRoomIdRef.current !== activeRoomId;
    const isNewMessage = prevMessagesLengthRef.current !== messages.length;

    if (isNewRoom) {
      setTimeout(() => scrollToBottom("auto"), 50);
    } else if (isNewMessage) {
      // Only auto-scroll on new messages if user is already near bottom, or if we just sent a message (but we can't easily tell, so near bottom is safest).
      // We'll also scroll in handleSendMessage.
      if (isNearBottom()) {
        scrollToBottom("smooth");
      }
    }

    prevRoomIdRef.current = activeRoomId;
    prevMessagesLengthRef.current = messages.length;
  }, [activeRoomId, messages.length]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched auto-scroll effect");
