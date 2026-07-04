const fs = require('fs');
const path = require('path');

const mappings = {
  sidebar: {
    "Overview": "overview",
    "Admin Dashboard": "adminDashboard",
    "🤖 AI Assistant": "aiAssistant",
    "Ticket Center": "ticketCenter",
    "Announcements": "announcements",
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
  const translationFile = `${dir}/translation.json`;
  
  if (!fs.existsSync(translationFile)) continue;
  
  const translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));
  const common = { ...translations };
  
  for (const [ns, map] of Object.entries(mappings)) {
    const nsData = {};
    for (const [orig, newKey] of Object.entries(map)) {
      if (common[orig]) {
        nsData[newKey] = common[orig];
      } else {
        nsData[newKey] = orig; // fallback
      }
      delete common[orig];
    }
    fs.writeFileSync(`${dir}/${ns}.json`, JSON.stringify(nsData, null, 2));
  }
  
  fs.writeFileSync(`${dir}/common.json`, JSON.stringify(common, null, 2));
  // Keep original for fallback during transition just in case, but let's delete it or not? Let's keep it but not use it.
}
console.log('JSON files created.');
