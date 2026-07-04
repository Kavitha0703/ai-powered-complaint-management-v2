const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `"INTELLIGENCE & ANALYSIS (AI ANALYSIS):" +"- If the user describes a problem, complaint, or delay (e.g., 'Salary delayed'), provide a detailed AI Analysis using the 'aiAnalysis' JSON object." +"- Populate 'detectedIssue', 'confidence' (e.g., '97%'), 'priority' (e.g., 'Urgent'), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'." +"TRUTH & TRANSPARENCY RULES:" +`,
  `"INTELLIGENCE & ANALYSIS (AI ANALYSIS):\\n" +
  "- If the user describes a problem, complaint, or delay (e.g., 'Salary delayed'), provide a detailed AI Analysis using the 'aiAnalysis' JSON object.\\n" +
  "- Populate 'detectedIssue', 'confidence' (e.g., '97%'), 'priority' (e.g., 'Urgent'), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'.\\n\\n" +
  "TRUTH & TRANSPARENCY RULES:\\n" +`
);
fs.writeFileSync('server.ts', code);
