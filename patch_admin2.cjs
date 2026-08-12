const fs = require('fs');

let content = fs.readFileSync('src/lib/AdminManagementHelper.ts', 'utf-8');

content = content.replace(
  /\/\/ const hardcoded: RegisteredAdmin\[\] = HARDCODED_ADMINS\.map\(a => \(\{\n  \/\/   \.\.\.a,\n  \/\/   avatar: "👤"\n  \/\/ \}\)\);\n  const hardcoded: RegisteredAdmin\[\] = \[\];/,
  `const hardcoded: RegisteredAdmin[] = HARDCODED_ADMINS.map(a => ({
    ...a,
    avatar: "👤"
  }));`
);

fs.writeFileSync('src/lib/AdminManagementHelper.ts', content);
