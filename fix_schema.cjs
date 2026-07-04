const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The duplicate aiAnalysis
const regex = /aiAnalysis: \{ type: Type\.OBJECT, description: "Detailed analysis of an issue if the user reports one", properties: \{ detectedIssue: \{ type: Type\.STRING \}, confidence: \{ type: Type\.STRING \}, priority: \{ type: Type\.STRING \}, businessImpact: \{ type: Type\.STRING \}, rootCause: \{ type: Type\.STRING \}, recommendedAction: \{ type: Type\.STRING \}, estimatedResolution: \{ type: Type\.STRING \}, sla: \{ type: Type\.STRING \} \} \}\s*aiAnalysis: \{ type: Type\.OBJECT, properties: \{ detectedIssue: \{ type: Type\.STRING \}, confidence: \{ type: Type\.STRING \}, priority: \{ type: Type\.STRING \}, businessImpact: \{ type: Type\.STRING \}, rootCause: \{ type: Type\.STRING \}, recommendedAction: \{ type: Type\.STRING \}, estimatedResolution: \{ type: Type\.STRING \}, sla: \{ type: Type\.STRING \} \} \}/;

code = code.replace(regex, 'aiAnalysis: { type: Type.OBJECT, description: "Detailed analysis of an issue if the user reports one", properties: { detectedIssue: { type: Type.STRING }, confidence: { type: Type.STRING }, priority: { type: Type.STRING }, businessImpact: { type: Type.STRING }, rootCause: { type: Type.STRING }, recommendedAction: { type: Type.STRING }, estimatedResolution: { type: Type.STRING }, sla: { type: Type.STRING } } }');

fs.writeFileSync('server.ts', code);
