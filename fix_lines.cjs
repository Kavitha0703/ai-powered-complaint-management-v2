const fs = require('fs');
let lines = fs.readFileSync('server.ts', 'utf8').split('\n');

// 1538 to 1547
lines[1537] = `"INTELLIGENCE & ANALYSIS (AI ANALYSIS):\\n" +`;
lines[1538] = `"- If the user describes a problem, complaint, or delay (e.g., 'Salary delayed'), provide a detailed AI Analysis using the 'aiAnalysis' JSON object.\\n" +`;
lines[1539] = `"- Populate 'detectedIssue', 'confidence' (e.g., '97%'), 'priority' (e.g., 'Urgent'), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'.\\n\\n" +`;
lines[1540] = `"TRUTH & TRANSPARENCY RULES:\\n" +`;

// Clear out the extra lines that were created by literal newlines
for (let i = 1541; i <= 1546; i++) {
    lines[i] = "";
}

fs.writeFileSync('server.ts', lines.join('\n'));
