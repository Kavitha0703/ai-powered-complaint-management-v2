const fs = require('fs');
let content = fs.readFileSync('api/_app.ts', 'utf-8');

const analyzeStart = content.indexOf('app.post("/api/gemini/analyze",');
const analyzeEnd = content.indexOf('// AI Resolution Recommendations Endpoint');

let analyzeBlock = content.substring(analyzeStart, analyzeEnd);

const fallbackMatchStart = analyzeBlock.indexOf('    // Helper function for typo correction & abbreviation expansion');
const fallbackMatchEnd = analyzeBlock.indexOf('    const prompt = `You are an elite enterprise complaint and incident intelligence analyst.');

const newFallback = `    const fallbackValue = {
      category: "Other",
      priority: "Medium",
      department: "General Operations",
      sla: "24 Hours",
      rootCause: "AI service is currently unavailable.",
      recommendation: "Please review the ticket manually.",
      confidence: 0,
      correctedText: description,
      sentiment: "Neutral",
      clarificationNeeded: false,
      clarificationOptions: [],
      detectedIssues: [],
      similarCases: [],
      aiReasoning: {
        detectedKeywords: [],
        matchedDepartment: "Unknown",
        detectedIntent: "Unknown",
        similarityScore: 0,
        estimatedResolutionTime: "Unknown"
      }
    };

`;

analyzeBlock = analyzeBlock.substring(0, fallbackMatchStart) + newFallback + analyzeBlock.substring(fallbackMatchEnd);
content = content.substring(0, analyzeStart) + analyzeBlock + content.substring(analyzeEnd);

fs.writeFileSync('api/_app.ts', content);
