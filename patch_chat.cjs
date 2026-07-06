const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

let newCode = code.replace(
  'app.post("/api/chat", async (req: express.Request, res: express.Response) => {\n  try {\n    const { messages, file, systemContext, responsePreference } = req.body;',
  `app.post("/api/chat", async (req: express.Request, res: express.Response) => {\n  try {\n    console.time("Chat Request Total");\n    console.time("Request Parsing & Auth");\n    const { messages, file, systemContext, responsePreference } = req.body;\n    console.timeEnd("Request Parsing & Auth");`
);

newCode = newCode.replace(
  '    const ai = getGeminiClient();\n\n    let databaseContextPrompt = "";',
  `    console.time("Prompt Construction");\n    const ai = getGeminiClient();\n\n    let databaseContextPrompt = "";`
);

newCode = newCode.replace(
  '    // Combine system instructions\n    const systemInstruction = ',
  `    console.timeEnd("Prompt Construction");\n\n    // Combine system instructions\n    const systemInstruction = `
);

newCode = newCode.replace(
  '    const response = await callGeminiWithFallback({\n      contents: recentMessages,',
  `    console.time("Gemini API Call");\n    const response = await callGeminiWithFallback({\n      contents: recentMessages,`
);

newCode = newCode.replace(
  '    const jsonText = response.text?.trim() || "{}";\n    res.json(JSON.parse(jsonText));',
  `    console.timeEnd("Gemini API Call");\n\n    console.time("Response Formatting & Sending");\n    const jsonText = response.text?.trim() || "{}";\n    res.json(JSON.parse(jsonText));\n    console.timeEnd("Response Formatting & Sending");\n    console.timeEnd("Chat Request Total");`
);

fs.writeFileSync('api/_app.ts', newCode);
console.log("Patched api/_app.ts successfully");
