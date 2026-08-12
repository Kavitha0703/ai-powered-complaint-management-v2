const fs = require('fs');

let content = fs.readFileSync('src/lib/AdminManagementHelper.ts', 'utf-8');

content = content.replace(
  /export const HARDCODED_ADMINS: any\[\] = \[\];/,
  `export const HARDCODED_ADMINS: any[] = [
  {
    id: "admin_testdemo",
    name: "Testadmin",
    email: "testdemo@admin.local",
    role: "super_admin",
    status: "Active",
    is_online: true,
    last_active: "Active now",
    department: "System Administration"
  },
  {
    id: "admin_kavitha",
    name: "Kavitha",
    email: "nasikakavitha@gmail.com",
    role: "super_admin",
    status: "Active",
    is_online: true,
    last_active: "Active now",
    department: "System Administration"
  }
];`
);

fs.writeFileSync('src/lib/AdminManagementHelper.ts', content);
