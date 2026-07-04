const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `"INTELLIGENCE & ANALYSIS (AI ANALYSIS):" +"- If the user describes a problem, complaint, or delay (e.g., 'Salary delayed'), provide a detailed AI Analysis using the 'aiAnalysis' JSON object." +"- Populate 'detectedIssue', 'confidence' (e.g., '97%'), 'priority' (e.g., 'Urgent'), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'." +"TRUTH & TRANSPARENCY RULES:" +`;

const replace1 = `"INTELLIGENCE & ANALYSIS (AI ANALYSIS):\\n" +
"- If the user describes a problem, complaint, or delay (e.g., 'Salary delayed'), provide a detailed AI Analysis using the 'aiAnalysis' JSON object.\\n" +
"- Populate 'detectedIssue', 'confidence' (e.g., '97%'), 'priority' (e.g., 'Urgent'), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'.\\n\\n" +
"TRUTH & TRANSPARENCY RULES:\\n" +`;

code = code.replace(target1, replace1);

fs.writeFileSync('server.ts', code);
