const fs = require('fs');
const path = require('path');

const replaceInFile = (file, replacements) => {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  for (const [search, replace] of replacements) {
    text = text.split(search).join(replace);
  }
  fs.writeFileSync(file, text);
};

const dirs = ['src/pages', 'src/components'];
for (const dir of dirs) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      replaceInFile(path.join(dir, file), [
        ['{t("Agent Note Posted")}', '{t("timeline.agentNotePosted")}'],
        ['{t("Notice Broadcasted")}', '{t("timeline.noticeBroadcasted")}'],
        ['{t("Ticket Logged")}', '{t("timeline.ticketLogged")}'],
        ['{t("Closed")}', '{t("timeline.closed")}'],
        ['{t("Updated")}', '{t("timeline.updated")}'],
        ['{t("Created")}', '{t("timeline.created")}'],
        ['t("Agent Note Posted")', 't("timeline.agentNotePosted")'],
        ['t("Notice Broadcasted")', 't("timeline.noticeBroadcasted")'],
        ['t("Ticket Logged")', 't("timeline.ticketLogged")'],
        ['t("Closed")', 't("timeline.closed")'],
        ['t("Updated")', 't("timeline.updated")'],
        ['t("Created")', 't("timeline.created")'],
        
        ['{t("Assign")}', '{t("tickets.assign")}'],
        ['{t("Reject")}', '{t("tickets.reject")}'],
        ['{t("Approve")}', '{t("tickets.approve")}'],
        ['{t("Reply")}', '{t("tickets.reply")}'],
        ['{t("Forward")}', '{t("tickets.forward")}'],
        ['{t("Status")}', '{t("tickets.status")}'],
        ['{t("Priority")}', '{t("tickets.priority")}'],
        ['{t("Department")}', '{t("tickets.department")}'],
        ['{t("Ticket ID")}', '{t("tickets.ticketId")}'],
        ['t("Assign")', 't("tickets.assign")'],
        ['t("Reject")', 't("tickets.reject")'],
        ['t("Approve")', 't("tickets.approve")'],
        ['t("Reply")', 't("tickets.reply")'],
        ['t("Forward")', 't("tickets.forward")'],
        ['t("Status")', 't("tickets.status")'],
        ['t("Priority")', 't("tickets.priority")'],
        ['t("Department")', 't("tickets.department")'],
        ['t("Ticket ID")', 't("tickets.ticketId")}']
      ]);
    }
  }
}

console.log("All files updated.");
