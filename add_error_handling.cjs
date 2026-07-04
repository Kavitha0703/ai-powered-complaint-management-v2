const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRegex = /"- ALWAYS generate 3 to 5 tailored 'suggestedQueries'/;

const newString = `"- ERROR HANDLING: If no results are found in the database for a query, do NOT just say 'No results found'. Instead, use the following format:\\n" +
"  No complaints matched your search.\\n\\n  **Suggestions:**\\n  • Check spelling\\n  • Try another department\\n  • Remove date filter\\n" +
"- ALWAYS generate 3 to 5 tailored 'suggestedQueries'`;

code = code.replace(targetRegex, newString);

fs.writeFileSync('server.ts', code);
