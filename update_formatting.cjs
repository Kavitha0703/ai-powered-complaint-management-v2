const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /formattingInstruction = "RESPONSE FORMATTING MANDATES \\(DETAILED MODE ACTIVE\\):\\n" \+[\s\S]*?(?=\\n" \+)/;

const newFormatting = `formattingInstruction = "RESPONSE FORMATTING MANDATES (DETAILED MODE ACTIVE):\\n" +
"- Provide a beautifully formatted answer utilizing clean bullet lists and friendly explanatory steps. Keep it cohesive.\\n" +
"- MAXIMUM PARAGRAPH LENGTH: 3 to 4 lines. NEVER produce walls of text.\\n" +
"- FINAL POLISH STRUCTURE: Unless it's a simple conversational reply, make complex responses follow this general pattern:\\n" +
"  * ## Title\\n" +
"  * ### Summary (or Executive Summary)\\n" +
"  * ### AI Findings (or AI Analysis)\\n" +
"  * ### Recommended Actions (or Next Actions)\\n" +
"  * Data/Table/Chart (use structuredData JSON, do NOT use Markdown tables)\\n" +
"- Use clean badges, icons, and headings. Always use 'structuredData' for statistics and lists."`;

code = code.replace(regex, newFormatting);

fs.writeFileSync('server.ts', code);
