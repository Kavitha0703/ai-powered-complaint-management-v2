const fs = require('fs');
let code = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf8');

const regex = /let systemContext: any = null;\s*try {\s*if \(dbUser && chatbotMode === "user"\) {[\s\S]*?} else {\s*systemContext = {\s*role: "visitor",\s*permissions: \[\]\s*};\s*}\s*} catch \(dbErr\) {\s*console\.error\("Failed to gather system query context from database:", dbErr\);\s*}/;

const replacement = `let systemContext: any = null;
      try {
        if (dbUser && chatbotMode === "user") {
          systemContext = {
            role: "user",
            permissions: ["ownTickets.read", "complaints.create"],
            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id }
          };
        } else if (dbUser && chatbotMode === "admin") {
          systemContext = {
            role: "admin",
            permissions: ["tickets.read", "users.read", "reports.read", "analytics.read"],
            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id }
          };
        } else {
          systemContext = {
            role: "visitor",
            permissions: []
          };
        }
      } catch (dbErr) {
        console.error("Failed to build system context:", dbErr);
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/DcmsAiAssistant.tsx', code);
console.log("Patched src/components/DcmsAiAssistant.tsx successfully");
