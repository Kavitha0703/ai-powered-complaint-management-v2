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
  }
];

export function getAdminInvites(): AdminInvite[] {
  const data = localStorage.getItem(INVITES_KEY);
  if (!data) {
    // Seed an initial pending invite so the user can easily see and test the workflow
    const seed: AdminInvite[] = [];
    localStorage.setItem(INVITES_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
}

export function saveAdminInvites(invites: AdminInvite[]) {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dcms_admin_invites_updated"));
  }
}

export interface RegisteredAdmin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support_staff';
  status: 'Active' | 'Pending' | 'Deactivated';
  is_online: boolean;
  last_active: string;
  department: string;
  avatar?: string;
}

export function getAllActiveAdmins(): RegisteredAdmin[] {
  const invites = getAdminInvites();
  const activeInvites: RegisteredAdmin[] = invites
    .filter(i => i.status === "Active")
    .map(i => ({
      id: i.id || `usr_${i.email.split('@')[0]}`,
      name: i.name || i.email.split('@')[0],
      email: i.email,
      role: i.role,
      status: 'Active' as const,
      is_online: true,
      last_active: i.last_active || "Active now",
      department: i.department || "Administration",
      avatar: "👤"
    }));

  const hardcoded: RegisteredAdmin[] = HARDCODED_ADMINS.map(a => ({
    ...a,
    avatar: "👤"
  }));

  const map = new Map<string, RegisteredAdmin>();
  [...hardcoded, ...activeInvites].forEach(admin => {
    map.set(admin.email.toLowerCase(), admin);
  });

  return Array.from(map.values());
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
