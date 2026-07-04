const fs = require('fs');

const mappings = {
  sidebar: {
    "Overview": "overview",
    "Dashboard": "dashboard",
    "Admin Dashboard": "adminDashboard",
    "🤖 AI Assistant": "aiAssistant",
    "Service Desk": "serviceDesk",
    "Create Ticket": "createTicket",
    "My Tickets": "myTickets",
    "Draft Tickets": "draftTickets",
    "Ticket Center": "ticketCenter",
    "Manage Tickets": "manageTickets",
    "Communication": "communication",
    "Announcements": "announcements",
    "Notifications": "notifications",
    "Feedback": "feedback",
    "Team Chat": "teamChat",
    "Communication Center": "communicationCenter",
    "Admin Management": "adminManagement",
    "View Feedback": "viewFeedback",
    "Help Center": "helpCenter",
    "Settings": "settings",
    "Logout": "logout"
  },
  dashboard: {
    "Total Cases": "totalCases",
    "Pending": "pending",
    "In Progress": "inProgress",
    "Resolved": "resolved",
    "Critical": "critical",
    "Total Users": "totalUsers",
    "Average Resolution Time": "averageResolutionTime"
  },
  timeline: {
    "Agent Note Posted": "agentNotePosted",
    "Notice Broadcasted": "noticeBroadcasted",
    "Ticket Logged": "ticketLogged",
    "Closed": "closed",
    "Updated": "updated",
    "Created": "created"
  },
  tickets: {
    "Assign": "assign",
    "Reject": "reject",
    "Approve": "approve",
    "Reply": "reply",
    "Forward": "forward",
    "Status": "status",
    "Priority": "priority",
    "Department": "department",
    "Ticket ID": "ticketId"
  },
  aiAssistant: {
    "Suggested Questions": "suggestedQuestions",
    "Ask AI": "askAi",
    "Generate Summary": "generateSummary",
    "Analyze": "analyze",
    "Thinking...": "thinking",
    "Response Generated": "responseGenerated"
  }
};

const langs = ['en', 'es', 'fr', 'hi', 'zh', 'ja'];

for (const lang of langs) {
  const dir = `./src/i18n/locales/${lang}`;
  // Read from the monolithic backup translation.json if it exists, otherwise we read common.json and combine back
  let common = {};
  if (fs.existsSync(`${dir}/translation.json`)) {
    common = JSON.parse(fs.readFileSync(`${dir}/translation.json`, 'utf8'));
  } else {
    continue;
  }
  
  for (const [ns, map] of Object.entries(mappings)) {
    const nsData = {};
    for (const [orig, newKey] of Object.entries(map)) {
      if (common[orig]) {
        nsData[newKey] = common[orig];
      } else {
        nsData[newKey] = orig; 
      }
      delete common[orig];
    }
    fs.writeFileSync(`${dir}/${ns}.json`, JSON.stringify(nsData, null, 2));
  }
  
  fs.writeFileSync(`${dir}/common.json`, JSON.stringify(common, null, 2));
}

// Replace in files
const replaceInFile = (file, replacements) => {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  for (const [search, replace] of replacements) {
    text = text.split(search).join(replace);
  }
  fs.writeFileSync(file, text);
};

// 1. App.tsx
replaceInFile('src/App.tsx', [
  ['label: "Overview"', 'label: "sidebar.overview"'],
  ['label: "Dashboard"', 'label: "sidebar.dashboard"'],
  ['label: "Admin Dashboard"', 'label: "sidebar.adminDashboard"'],
  ['label: "🤖 AI Assistant"', 'label: "sidebar.aiAssistant"'],
  ['label: "Service Desk"', 'label: "sidebar.serviceDesk"'],
  ['label: "Create Ticket"', 'label: "sidebar.createTicket"'],
  ['label: "My Tickets"', 'label: "sidebar.myTickets"'],
  ['label: "Draft Tickets"', 'label: "sidebar.draftTickets"'],
  ['label: "Ticket Center"', 'label: "sidebar.ticketCenter"'],
  ['label: "Manage Tickets"', 'label: "sidebar.manageTickets"'],
  ['label: "Communication"', 'label: "sidebar.communication"'],
  ['label: "Announcements"', 'label: "sidebar.announcements"'],
  ['label: "Notifications"', 'label: "sidebar.notifications"'],
  ['label: "Feedback"', 'label: "sidebar.feedback"'],
  ['label: "Team Chat"', 'label: "sidebar.teamChat"'],
  ['label: "Communication Center"', 'label: "sidebar.communicationCenter"'],
  ['label: "Admin Management"', 'label: "sidebar.adminManagement"'],
  ['label: "View Feedback"', 'label: "sidebar.viewFeedback"'],
  ['label: "Help Center"', 'label: "sidebar.helpCenter"']
]);

// 2. DashboardLayout.tsx
replaceInFile('src/components/DashboardLayout.tsx', [
  ['t("Settings")', 't("sidebar.settings")'],
  ['t("Logout")', 't("sidebar.logout")']
]);

// 3. AdminPages.tsx
replaceInFile('src/pages/AdminPages.tsx', [
  ['{t("Total Cases")}', '{t("dashboard.totalCases")}'],
  ['{t("Pending")}', '{t("dashboard.pending")}'],
  ['{t("In Progress")}', '{t("dashboard.inProgress")}'],
  ['{t("Resolved")}', '{t("dashboard.resolved")}'],
  ['{t("Critical")}', '{t("dashboard.critical")}'],
  ['{t("Total Users")}', '{t("dashboard.totalUsers")}'],
  ['{t("Average Resolution Time")}', '{t("dashboard.averageResolutionTime")}'],
  ['t("Average Resolution Time")', 't("dashboard.averageResolutionTime")'], // in case
  
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
  ['t("Ticket ID")', 't("tickets.ticketId")']
]);

// 4. DcmsAiAssistant.tsx (AI Assistant)
replaceInFile('src/components/DcmsAiAssistant.tsx', [
  ['"Suggested Questions"', 't("aiAssistant.suggestedQuestions")'],
  ['t("Ask AI or type support command...")', 't("aiAssistant.askAi")'],
  ['"Generate Summary"', 't("aiAssistant.generateSummary")'],
  ['"Analyze"', 't("aiAssistant.analyze")'],
  ['"Thinking..."', 't("aiAssistant.thinking")'],
  ['"Response Generated"', 't("aiAssistant.responseGenerated")']
]);

console.log("Done.");
