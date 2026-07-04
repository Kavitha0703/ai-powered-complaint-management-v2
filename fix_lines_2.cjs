const fs = require('fs');
let lines = fs.readFileSync('server.ts', 'utf8').split('\n');

// Find the problematic lines around 1738
lines[1737] = `"CRITICAL UI INSTRUCTION: If the user requests tabular formats, reports, stats, metrics, lists of tickets, 'Show in table', 'Tabular format', 'List all complaints', 'Generate report', 'Pending complaints', 'Completed complaints', 'Employees with highest complaints', or 'Monthly statistics', you MUST return a 'table', 'chart', or 'kpi_cards' inside the 'structuredData' JSON object.\\n" +`;
lines[1738] = `"If the user asks for STATISTICS, TRENDS, COMPARISONS, or CHARTS, you MUST generate a 'chart' (bar, line, or pie) inside structuredData! Never answer statistics using only text!\\n" +`;
lines[1739] = `"YOU MUST NOT return a Markdown table (e.g. | column | column |) inside your text response under any circumstances. Always use the structuredData object to render enterprise DataTables or Charts.\\n" +`;

fs.writeFileSync('server.ts', lines.join('\n'));
