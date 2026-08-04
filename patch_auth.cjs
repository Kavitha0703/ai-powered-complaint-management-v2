const fs = require('fs');
let code = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

code = code.replace(
  /const payload = \{[\s\S]*?avatar_url: avatar_url\n\s*\};/,
  `const payload = {
        id: u.id,
        email: email,
        name: full_name,
        role: role
     };`
);

code = code.replace(
  /setUser\(session\?.user \?\? null\);/g,
  `if (session?.provider_token) {
        localStorage.setItem("google_workspace_access_token", session.provider_token);
        localStorage.setItem("google_gmail_auth", "true");
      }
      setUser(session?.user ?? null);`
);

fs.writeFileSync('src/lib/AuthContext.tsx', code);
