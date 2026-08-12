const fs = require('fs');

let content = fs.readFileSync('src/lib/AuthContext.tsx', 'utf-8');

const replacement = `  const syncUser = async (u: User) => {
     const email = u.email || '';
     const cleanEmail = email.toLowerCase();
     
     // Auto-activate any pending invites for this email
     const invites = getAdminInvites();
     let invitesUpdated = false;
     const pendingIdx = invites.findIndex(i => i.email.toLowerCase() === cleanEmail && (i.status === "Pending" || i.status === "Active"));
     if (pendingIdx !== -1) {
        if (invites[pendingIdx].status === "Pending") {
            invites[pendingIdx].status = "Active";
            invites[pendingIdx].delivery_status = "Registered";
            invites[pendingIdx].name = u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0];
            invitesUpdated = true;
        }
        invites[pendingIdx].last_active = "Just now";
        invitesUpdated = true;
     }
     if (invitesUpdated) {
        saveAdminInvites(invites);
     }

     const isAdminVal = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail) || isEmailAdmin(email);
     const role = isAdminVal ? 'admin' : 'user';
     const sub_role = isAdminVal ? getAdminRoleByEmail(email) : 'user';
     
     const full_name = u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0];
     const avatar_url = u.user_metadata?.avatar_url || '';`;

content = content.replace(
  /const syncUser = async \(u: User\) => \{\n     const email = u\.email \|\| '';\n     const isAdminVal = ADMIN_EMAILS\.map\(e => e\.toLowerCase\(\)\)\.includes\(email\.toLowerCase\(\)\) \|\| isEmailAdmin\(email\);\n     const role = isAdminVal \? 'admin' : 'user';\n     const sub_role = isAdminVal \? getAdminRoleByEmail\(email\) : 'user';\n     \n     const full_name = u\.user_metadata\?\.full_name \|\| u\.user_metadata\?\.name \|\| email\.split\('@'\)\[0\];\n     const avatar_url = u\.user_metadata\?\.avatar_url \|\| '';/g,
  replacement
);

// We need to make sure getAdminInvites, saveAdminInvites are imported!
content = content.replace(
  /isEmailAdmin, getAdminRoleByEmail \} from '\.\/AdminManagementHelper';/,
  `isEmailAdmin, getAdminRoleByEmail, getAdminInvites, saveAdminInvites } from './AdminManagementHelper';`
);

fs.writeFileSync('src/lib/AuthContext.tsx', content);
