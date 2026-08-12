const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf-8');

const overlayEffect = `
  // Global modal overlay lock for resize panels
  useEffect(() => {
    const isOverlayOpen = 
      isNewCallDialogOpen || 
      !!deleteConfRoom || 
      !!deleteConfMsg || 
      bulkDeleteConfirmOpen || 
      !!forwardDialogMsg || 
      chatCameraActive || 
      showGmailCenter || 
      !!joinMeetModalMsgId || 
      !!activeMenuPos || 
      isCalendarPanelOpen || 
      !!selectedCallDetail;

    if (isOverlayOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isNewCallDialogOpen, deleteConfRoom, deleteConfMsg, bulkDeleteConfirmOpen, forwardDialogMsg, chatCameraActive, showGmailCenter, joinMeetModalMsgId, activeMenuPos, isCalendarPanelOpen, selectedCallDetail]);
`;

// Insert it right after `useEffect(() => { scrollToBottom...` or something.
const target = `  // Keyboard shortcuts`;
code = code.replace(target, overlayEffect + '\n' + target);
fs.writeFileSync('src/pages/AdminTeamChat.tsx', code);
console.log("Patched AdminTeamChat");
