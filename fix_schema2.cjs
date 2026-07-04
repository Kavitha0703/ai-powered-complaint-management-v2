const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /required:\s*\["requiresPhysical",\s*"department",\s*"room",\s*"floor",\s*"hours",\s*"instructions"\]\s*\},([\s\S]*?)detectedLanguage:/;

code = code.replace(regex, `required: ["requiresPhysical", "department", "room", "floor", "hours", "instructions"]
            },
            aiAnalysis: {
              type: Type.OBJECT,
              description: "Detailed analysis of an issue if the user reports one",
              properties: {
                detectedIssue: { type: Type.STRING },
                confidence: { type: Type.STRING },
                priority: { type: Type.STRING },
                businessImpact: { type: Type.STRING },
                rootCause: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
                estimatedResolution: { type: Type.STRING },
                sla: { type: Type.STRING }
              }
            },
            detectedLanguage:`);

fs.writeFileSync('server.ts', code);
