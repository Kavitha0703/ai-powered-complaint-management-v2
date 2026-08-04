const fs = require('fs');
let code = fs.readFileSync('src/pages/MailCenter.tsx', 'utf8');

const replacement = `
    const result = await sendEmailViaGmail({
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      bodyHtml: composeBody || \`<div style="padding:16px;">\${composeSubject}</div>\`,
      category: composeModule === 'Admin Invitation' ? 'admin_invite' : composeModule === 'Meeting Invite' ? 'meeting_invite' : composeModule === 'Announcement' ? 'announcement' : composeModule === 'Ticket' ? 'ticket_update' : composeModule === 'Password Reset' ? 'password_reset' : 'general',
      module: composeModule,
      type: composeModule === 'Admin Invitation' ? 'Invitation' : composeModule === 'Password Reset' ? 'Password Reset' : 'Notification'
    });

    if (!result.success) {
      alert("Failed to send email: " + result.error);
      setIsSending(false);
      return;
    }

    // Reset Compose Form
    setIsSending(false);
`;

code = code.replace(
  /const record: SentEmailRecord = \{[\s\S]*?aiPriority: "High"\s*\};\s*saveEmailToLog\(record\);\s*\/\/\s*Reset Compose Form\s*setIsSending\(false\);/,
  replacement
);

fs.writeFileSync('src/pages/MailCenter.tsx', code);
