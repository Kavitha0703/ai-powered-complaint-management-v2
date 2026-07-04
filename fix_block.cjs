const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /"INTELLIGENCE & ANALYSIS \(AI ANALYSIS\):"\+"- If the user describes a problem, complaint, or delay \(e\.g\., 'Salary delayed'\), provide a detailed AI Analysis using the 'aiAnalysis' JSON object\."\+"- Populate 'detectedIssue', 'confidence' \(e\.g\., '97%'\), 'priority' \(e\.g\., 'Urgent'\), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'\."\+"TRUTH & TRANSPARENCY RULES:"/g;

// Instead of regex, let's just find the exact text using regex with any whitespace
const regex2 = /"INTELLIGENCE & ANALYSIS \(AI ANALYSIS\):"\s*\+"\s*- If the user describes a problem, complaint, or delay \(e\.g\., 'Salary delayed'\), provide a detailed AI Analysis using the 'aiAnalysis' JSON object\."\s*\+"\s*- Populate 'detectedIssue', 'confidence' \(e\.g\., '97%'\), 'priority' \(e\.g\., 'Urgent'\), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'\."\s*\+"\s*TRUTH & TRANSPARENCY RULES:"/g;

code = code.replace(regex2, 
  `"INTELLIGENCE & ANALYSIS (AI ANALYSIS):\\n" +\n` +
  `"- If the user describes a problem, complaint, or delay (e.g., 'Salary delayed'), provide a detailed AI Analysis using the 'aiAnalysis' JSON object.\\n" +\n` +
  `"- Populate 'detectedIssue', 'confidence' (e.g., '97%'), 'priority' (e.g., 'Urgent'), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'.\\n\\n" +\n` +
  `"TRUTH & TRANSPARENCY RULES:\\n"`);

fs.writeFileSync('server.ts', code);
