export interface AdminInvite {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support_staff';
  invited_by: string;
  status: 'Pending' | 'Active' | 'Deactivated';
  created_at: string;
  name?: string;
  last_active?: string;
  department?: string;
}

const INVITES_KEY = "dcms_admin_invites_v1";

export const HARDCODED_ADMINS = [
  {
    id: "usr_kavitha",
    name: "Kavitha",
    email: "nasikakavitha@gmail.com",
    role: "super_admin" as const,
    status: "Active" as const,
    is_online: true,
    last_active: "Today 10:35 AM",
    department: "Security Operations"
  },
  {
    id: "usr_testadmin",
    name: "Testadmin",
    email: "testdemo@admin.local",
    role: "super_admin" as const,
    status: "Active" as const,
    is_online: true,
    last_active: "Today 04:28 AM",
    department: "System Administration"
  },
  {
    id: "usr_kalen",
    name: "Kalen",
    email: "kalenhitsumi.dev@gmail.com",
    role: "super_admin" as const,
    status: "Active" as const,
    is_online: false,
    last_active: "Yesterday 05:12 PM",
    department: "Legal & Compliance"
  }
];

export function getAdminInvites(): AdminInvite[] {
  const data = localStorage.getItem(INVITES_KEY);
  if (!data) {
    // Seed an initial pending invite so the user can easily see and test the workflow
    const seed: AdminInvite[] = [
      {
        id: "inv_default_john",
        email: "john@company.com",
        role: "admin",
        invited_by: "Kavitha",
        status: "Pending",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        department: "Customer Support"
      },
      {
        id: "inv_default_staff",
        email: "staff@company.com",
        role: "support_staff",
        invited_by: "Testadmin",
        status: "Pending",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        department: "IT & Infrastructure"
      }
    ];
    localStorage.setItem(INVITES_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
}

export function saveAdminInvites(invites: AdminInvite[]) {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
}

export function getAdminRoleByEmail(email: string): 'super_admin' | 'admin' | 'support_staff' | 'user' {
  const cleanEmail = email.trim().toLowerCase();
  
  // Check hardcoded first
  const hardcoded = HARDCODED_ADMINS.find(a => a.email.toLowerCase() === cleanEmail);
  if (hardcoded) return "super_admin";

  // Check invites
  const invites = getAdminInvites();
  const activeInvite = invites.find(i => i.email.toLowerCase() === cleanEmail && i.status === "Active");
  if (activeInvite) return activeInvite.role;

  return "user";
}

export function isEmailAdmin(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  // Hardcoded
  if (HARDCODED_ADMINS.some(a => a.email.toLowerCase() === cleanEmail)) return true;
  // Invites (Pending or Active or any status)
  const invites = getAdminInvites();
  return invites.some(i => i.email.toLowerCase() === cleanEmail && (i.status === "Active" || i.status === "Pending"));
}

export function getAdminProfileByEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const hardcoded = HARDCODED_ADMINS.find(a => a.email.toLowerCase() === cleanEmail);
  if (hardcoded) return hardcoded;

  const invites = getAdminInvites();
  return invites.find(i => i.email.toLowerCase() === cleanEmail);
}
