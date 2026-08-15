const fs = require('fs');
let content = fs.readFileSync('api/_app.ts', 'utf-8');

const targetStr = `    if (role === "user") {`;
const replacementStr = `    let activeViewStr = "";
    if (systemContext?.activeViewContext) {
      activeViewStr = \`\\n\\n--- CURRENTLY SELECTED COMPLAINT ---\\nThe user is actively viewing this specific complaint in the UI:\\nID: \${systemContext.activeViewContext.selectedTicketId}\\nCategory: \${systemContext.activeViewContext.category}\\nTitle: \${systemContext.activeViewContext.title}\\nDescription: \${systemContext.activeViewContext.description}\\n\\nWhen the user refers to "this complaint", "the complaint", or "it", they mean this selected complaint. Analyze it in detail.\`;
    }

    if (role === "user") {`;

content = content.replace(targetStr, replacementStr);

const targetDBContext1 = `databaseContextPrompt = \`ACTIVE ROLE: Personal Support Assistant\\nLogged-in User Name: \${systemContext?.userProfile?.name || "User"}\\n\\n--- GROUND-TRUTH STATUS ---\\nThese are your tickets:\\n\${fetchedTickets.map((c: any) => \`- Ticket #\${c.id.toString().substring(0, 8).toUpperCase()}: \${c.issue_type} (\${c.status})\`).join("\\n") || "No tickets found."}\`;`;
const replacementDBContext1 = `databaseContextPrompt = \`ACTIVE ROLE: Personal Support Assistant\\nLogged-in User Name: \${systemContext?.userProfile?.name || "User"}\\n\\n--- GROUND-TRUTH STATUS ---\\nThese are your tickets:\\n\${fetchedTickets.map((c: any) => \`- Ticket #\${c.id.toString().substring(0, 8).toUpperCase()}: \${c.issue_type} (\${c.status})\`).join("\\n") || "No tickets found."}\` + activeViewStr;`;

content = content.replace(targetDBContext1, replacementDBContext1);

const targetDBContext2 = `databaseContextPrompt = \`ACTIVE ROLE: Administrative AI Assistant\\nLogged-in Admin: \${systemContext?.userProfile?.name || "System Admin"}\\n\\n--- PRODUCTION DB METRICS ---\\nTotal Tickets (Loaded): \${dbStats.totalTickets}\\nPending: \${dbStats.pendingCount}\\nIn Progress: \${dbStats.inProgressCount}\\nResolved: \${dbStats.resolvedCount}\\n\\nRecent Tickets:\\n\${fetchedTickets.slice(0, 15).map((c: any) => \`- Ticket #DCMS-\${c.id.toString().substring(0, 5).toUpperCase()}: \${c.issue_type} | \${c.severity} | \${c.status}\`).join("\\n") || "No tickets."}\`;`;
const replacementDBContext2 = `databaseContextPrompt = \`ACTIVE ROLE: Administrative AI Assistant\\nLogged-in Admin: \${systemContext?.userProfile?.name || "System Admin"}\\n\\n--- PRODUCTION DB METRICS ---\\nTotal Tickets (Loaded): \${dbStats.totalTickets}\\nPending: \${dbStats.pendingCount}\\nIn Progress: \${dbStats.inProgressCount}\\nResolved: \${dbStats.resolvedCount}\\n\\nRecent Tickets:\\n\${fetchedTickets.slice(0, 15).map((c: any) => \`- Ticket #DCMS-\${c.id.toString().substring(0, 5).toUpperCase()}: \${c.issue_type} | \${c.severity} | \${c.status}\`).join("\\n") || "No tickets."}\` + activeViewStr;`;

content = content.replace(targetDBContext2, replacementDBContext2);

fs.writeFileSync('api/_app.ts', content);
