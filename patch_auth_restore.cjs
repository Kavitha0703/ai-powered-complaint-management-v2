const fs = require('fs');
let code = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

code = code.replace(
  /const payload = \{[\s\S]*?role: role\n\s*\};/,
  `const payload = {
        id: u.id,
        email: email,
        name: full_name,
        role: role,
        sub_role: sub_role,
        avatar_url: avatar_url
     };`
);

code = code.replace(
  /await supabase\.auth\.updateUser\(\{ data: \{ avatar_url: url \} \}\);\s*if \(dbUser\) \{\s*setDbUser\(\{ \.\.\.dbUser, avatar_url: url \}\);\s*\}\s*\/\/ optional: update public\.users if applicable\s*\} catch \(e\) \{/,
  `await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (dbUser) {
        setDbUser({ ...dbUser, avatar_url: url });
      }
      // optional: update public.users if applicable
      await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
    } catch (e) {`
);

fs.writeFileSync('src/lib/AuthContext.tsx', code);
