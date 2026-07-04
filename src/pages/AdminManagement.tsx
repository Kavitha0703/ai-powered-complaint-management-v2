import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext.tsx";
import { 
  getAdminInvites, 
  saveAdminInvites, 
  HARDCODED_ADMINS, 
  AdminInvite 
} from "../lib/AdminManagementHelper.ts";
import { 
  Shield, 
  ShieldAlert, 
  UserPlus, 
  UserCheck, 
  Mail, 
  Lock, 
  Trash2, 
  Power, 
  KeyRound, 
  UserCog, 
  BadgeAlert, 
  Activity, 
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Building
} from "lucide-react";
import { Button } from "../../components/ui/button.tsx";
import { Input } from "../../components/ui/input.tsx";

export default function AdminManagement() {
    
  const { dbUser } = useAuth();
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<'super_admin' | 'admin' | 'support_staff'>("admin");
  const [newDepartment, setNewDepartment] = useState("Customer Support");
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit role modal state
  const [editingAdmin, setEditingAdmin] = useState<AdminInvite | null>(null);
  const [editedRole, setEditedRole] = useState<'super_admin' | 'admin' | 'support_staff'>("admin");
  const [editedDepartment, setEditedDepartment] = useState("Customer Support");

  // Load and refresh invites
  useEffect(() => {
    setInvites(getAdminInvites());
  }, []);

  const refreshList = () => {
    setInvites(getAdminInvites());
  };

  // Check if current logged-in user is a super admin
  const isSuperAdmin = dbUser?.sub_role === 'super_admin' || dbUser?.email === 'testdemo@admin.local' || dbUser?.email === 'nasikakavitha@gmail.com' || dbUser?.email === 'kalenhitsumi.dev@gmail.com';

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0B132B]/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white">{"🛡️ Restricted Administrative Zone"}</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs leading-relaxed max-w-md">
          {"Only authorized"}<strong>{"Super Admins"}</strong> {"are granted credentials to access this control directory.           If this is an error, please verify your credentials with the System Owner."}</p>
      </div>
    );
  }

  // Handle send invitation
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = newEmail.trim().toLowerCase();
    
    if (!emailToInvite) return;

    // Check if ya hardcoded
    const alreadyHardcoded = HARDCODED_ADMINS.some(x => x.email.toLowerCase() === emailToInvite);
    if (alreadyHardcoded) {
      setErrorMsg("This email belongs to a built-in Super Admin and cannot be invited again.");
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    // Check if invite exists
    const currentInvites = getAdminInvites();
    if (currentInvites.some(i => i.email.toLowerCase() === emailToInvite)) {
      setErrorMsg("An invitation or active record for this email already exists.");
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    const newInvite: AdminInvite = {
      id: "inv_" + Math.random().toString(36).substring(2, 9),
      email: emailToInvite,
      role: newRole,
      department: newDepartment,
      invited_by: dbUser?.name || "Super Admin",
      status: "Pending",
      created_at: new Date().toISOString()
    };

    const updated = [newInvite, ...currentInvites];
    saveAdminInvites(updated);
    setInvites(updated);

    setNewEmail("");
    setSuccessMsg(`🚀 Invitation sent successfully to ${emailToInvite}!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Toggle active/deactive status
  const handleToggleStatus = (inviteId: string) => {
    const currentInvites = getAdminInvites();
    const updated = currentInvites.map(i => {
      if (i.id === inviteId) {
        const nextStatus = i.status === "Active" ? "Deactivated" : "Active";
        return { ...i, status: nextStatus as any };
      }
      return i;
    });
    saveAdminInvites(updated);
    setInvites(updated);
    setSuccessMsg("Administrator status toggled successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Remove admin
  const handleRemoveAdmin = (inviteId: string, email: string) => {
    if (confirm(`Are you sure you want to permanently remove access for ${email}?`)) {
      const currentInvites = getAdminInvites();
      const updated = currentInvites.filter(i => i.id !== inviteId);
      saveAdminInvites(updated);
      setInvites(updated);
      setSuccessMsg(`Removed administrator: ${email}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // Reset password
  const handleResetPassword = (email: string) => {
    const mockToken = "reset_" + Math.random().toString(36).substring(2, 12);
    alert(`🔑 SUCCESS: Password reset link generated! \n\nTo: ${email}\nLink: http://localhost:3000/auth/reset-password?token=${mockToken}\n\nAn automated credential recovery email has been dispatch-simulated.`);
  };

  // Open Edit Role modal
  const openEditRole = (invite: AdminInvite) => {
    setEditingAdmin(invite);
    setEditedRole(invite.role);
    setEditedDepartment(invite.department || "Customer Support");
  };

  // Save edited role and department
  const handleSaveRole = () => {
    if (!editingAdmin) return;
    const currentInvites = getAdminInvites();
    const updated = currentInvites.map(i => {
      if (i.id === editingAdmin.id) {
        return { ...i, role: editedRole, department: editedDepartment };
      }
      return i;
    });
    saveAdminInvites(updated);
    setInvites(updated);
    setEditingAdmin(null);
    setSuccessMsg(`Details updated successfully for ${editingAdmin.email}!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Build the unified list of admins (Hardcoded + Dynamic)
  const combinedAdminsList = [
    ...HARDCODED_ADMINS.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      invited_by: "System Initialization",
      status: a.status,
      is_online: a.is_online,
      last_active: a.last_active,
      is_built_in: true,
      department: a.department || "System Administration"
    })),
    ...invites.map(i => ({
      id: i.id,
      name: i.name || "Awaiting registration",
      email: i.email,
      role: i.role,
      invited_by: i.invited_by,
      status: i.status,
      is_online: i.status === "Active" ? Math.random() > 0.4 : false, // mock active dynamic onliners
      last_active: i.last_active || new Date(i.created_at).toLocaleDateString() + " " + new Date(i.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      is_built_in: false,
      department: i.department || "Customer Support"
    }))
  ];

  // Filtering list
  const filteredAdmins = combinedAdminsList.filter(a => {
    const matchesSearch = a.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || a.role === roleFilter;
    const matchesDept = deptFilter === "all" || a.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="flex flex-col flex-1 items-center justify-center h-full min-h-full w-full max-w-full xl:w-[85%] xl:max-w-[85%] mx-auto px-4 sm:px-6 md:px-0 space-y-8 font-sans">
      
      {/* Header Bar */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            {"Admin Management"}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {"Supervise active operations staff, modify authority matrices, and distribute platform invitation files."}</p>
        </div>
        
        <button 
          onClick={refreshList}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-250 rounded-xl transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> {"Reload"}</button>
      </div>

      {/* Success / Error Dispatches */}
      {successMsg && (
        <div className="w-full p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="w-full p-4 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <BadgeAlert className="w-4 h-4 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Layout: Left Column = Add Form, Right Column = Admins Table */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Add New Admin Form Card */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 uppercase">
              <UserPlus className="w-4 h-4 text-indigo-500" />
              {"➕ Add New Admin"}</h3>

            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{"Admin Email"}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email"
                    required
                    placeholder={"e.g. john@company.com"}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 pl-10 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{"Role Matrix Option"}</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="super_admin">{"⚡ Super Admin (Full Control)"}</option>
                  <option value="admin">{"🛠️ Admin (Manage & Reply)"}</option>
                  <option value="support_staff">{"👥 Support Staff (Assigned Only)"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{"Department Assignment"}</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-505"
                >
                  <option value="Security Operations">{"🛡️ Security Operations"}</option>
                  <option value="Legal & Compliance">{"⚖️ Legal & Compliance"}</option>
                  <option value="System Administration">{"💻 System Administration"}</option>
                  <option value="Customer Support">{"👥 Customer Support"}</option>
                  <option value="IT & Infrastructure">{"⚡ IT & Infrastructure"}</option>
                  <option value="Billing & Accounts">{"💰 Billing & Accounts"}</option>
                </select>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-lg shadow-indigo-505/10 flex items-center justify-center gap-2 cursor-pointer transition-transform"
                >
                  <Send className="w-3.5 h-3.5" /> {"Send Invitation"}</Button>
              </div>
            </form>
          </div>

          {/* Quick Helper Tip */}
          <div className="bg-slate-100/50 dark:bg-[#0B1222]/30 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-xs text-slate-500 leading-relaxed space-y-2">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>💡</span> {"Administrative Authorization"}</h5>
            <p>
              {"Once invited, the target recipient can register on our Admin Access gate. The portal matches their email automatically to activate advanced dashboards."}</p>
          </div>
        </div>

        {/* Right: Current Admins Matrix Board */}
        <div className="lg:col-span-9 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-6">
          
          {/* Header filter controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              {"Current Admins ("}{combinedAdminsList.length})
            </h3>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search bar */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <Input 
                  placeholder={"Filter by name/email..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-xs h-9 rounded-xl w-full sm:w-48 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 h-9 text-slate-700 dark:text-slate-300 font-semibold outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer min-w-[110px]"
              >
                <option value="all">{"All Roles"}</option>
                <option value="super_admin">{"⚡ Super Admin"}</option>
                <option value="admin">{"🛠️ Admin"}</option>
                <option value="support_staff">{"👥 Support Staff"}</option>
              </select>

              {/* Department filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 h-9 text-slate-700 dark:text-slate-300 font-semibold outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                <option value="all">{"📁 All Departments"}</option>
                <option value="Security Operations">{"🛡️ Security Operations"}</option>
                <option value="Legal & Compliance">{"⚖️ Legal & Compliance"}</option>
                <option value="System Administration">{"💻 System Administration"}</option>
                <option value="Customer Support">{"👥 Customer Support"}</option>
                <option value="IT & Infrastructure">{"⚡ IT & Infrastructure"}</option>
                <option value="Billing & Accounts">{"💰 Billing & Accounts"}</option>
              </select>
            </div>
          </div>

          {/* Admins Grid Lists */}
          <div className="space-y-4">
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin) => {
                const isOnline = admin.is_online && admin.status === "Active";
                
                return (
                  <div 
                    key={admin.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50/50 dark:bg-[#0E172B] hover:bg-slate-50 dark:hover:bg-[#111C35] rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all gap-4"
                  >
                    {/* Left: User Avatar & Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                          admin.is_built_in 
                            ? "bg-gradient-to-tr from-amber-500 to-orange-600 text-white" 
                            : admin.status === 'Pending'
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              : "bg-gradient-to-tr from-indigo-500 to-blue-600 text-white"
                        }`}>
                          {admin.name?.[0] || "?"}
                        </div>
                        {admin.status === "Active" && (
                          <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0B1222] ${
                            isOnline ? "bg-emerald-500" : "bg-slate-400"
                          }`} title={isOnline ? "Online" : "Offline"} />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-850 dark:text-white">{admin.name}</span>
                          {admin.is_built_in && (
                            <span className="bg-amber-500/15 border border-amber-500/30 text-[9px] font-black text-amber-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              {"Built-in"}</span>
                          )}
                          {admin.status === "Pending" && (
                            <span className="bg-slate-200/60 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                              {"Pending Invite"}</span>
                          )}
                          {admin.status === "Deactivated" && (
                            <span className="bg-red-500/10 border border-red-500/20 text-[9.5px] font-black text-red-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              {"Inactive"}</span>
                          )}
                        </div>

                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 font-medium"><Mail className="w-3 h-3 text-slate-400" /> {admin.email}</span>
                          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                          <span className="font-bold flex items-center gap-1">
                            <UserCog className="w-3 h-3 text-indigo-400 font-bold" />
                            <span className="text-slate-700 dark:text-slate-350">
                              {admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'admin' ? 'Admin' : 'Support Staff'}
                            </span>
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5">
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-extrabold text-[9px]">
                            <Building className="w-2.5 h-2.5 text-indigo-500" /> {admin.department}
                          </span>
                          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{"Last Active:"}{admin.last_active}</span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span>{"By:"}{admin.invited_by}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions Controls */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                      
                      {/* Invite status / Reset Password option */}
                      {admin.status !== "Pending" && (
                        <button
                          type="button"
                          onClick={() => handleResetPassword(admin.email)}
                          className="p-1.5 text-slate-455 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                          title={"Reset Admin Password"}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}

                      {/* Power Deactivate toggle (only dynamic admins) */}
                      {!admin.is_built_in && (
                        <>
                          {/* Edit Role Button */}
                          <button
                            type="button"
                            onClick={() => openEditRole(admin as any)}
                            className="p-1.5 text-slate-455 hover:text-indigo-505 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                            title={"Edit Role Access"}
                          >
                            <UserCog className="w-4 h-4" />
                          </button>

                          {/* Toggle status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(admin.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              admin.status === "Active" 
                                ? "text-emerald-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" 
                                : "text-amber-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            }`}
                            title={admin.status === "Active" ? "Deactivate Account" : "Activate Account"}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Remove admin */}
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                            title={"Remove Admin Permanently"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {admin.is_built_in && (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 px-2 py-1 select-none">
                          {"System Owned"}</span>
                      )}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                {"No administrators match your current query or filter criteria."}</div>
            )}
          </div>

        </div>

      </div>

      {/* Edit Role Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UserCog className="w-4 h-4 text-indigo-500" />
              {"Change Role Authority Matrix"}</h4>
            
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {"Define the workspace privilege scope for:"}<br/>
              <strong className="text-slate-800 dark:text-slate-200 font-bold">{editingAdmin.email}</strong>
            </p>

            <div className="space-y-1.5 mt-5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{"Select New Role"}</label>
              <select
                value={editedRole}
                onChange={(e) => setEditedRole(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-550"
              >
                <option value="super_admin">{"⚡ Super Admin (Full Control)"}</option>
                <option value="admin">{"🛠️ Admin (Manage & Reply)"}</option>
                <option value="support_staff">{"👥 Support Staff (Assigned Only)"}</option>
              </select>
            </div>

            <div className="space-y-1.5 mt-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{"Select Department"}</label>
              <select
                value={editedDepartment}
                onChange={(e) => setEditedDepartment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-550"
              >
                <option value="Security Operations">{"🛡️ Security Operations"}</option>
                <option value="Legal & Compliance">{"⚖️ Legal & Compliance"}</option>
                <option value="System Administration">{"💻 System Administration"}</option>
                <option value="Customer Support">{"👥 Customer Support"}</option>
                <option value="IT & Infrastructure">{"⚡ IT & Infrastructure"}</option>
                <option value="Billing & Accounts">{"💰 Billing & Accounts"}</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingAdmin(null)}
                className="text-2xs font-extrabold h-9 rounded-lg"
              >
                {"Cancel"}</Button>
              <Button 
                size="sm"
                onClick={handleSaveRole}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-2xs font-extrabold h-9 rounded-lg"
              >
                {"Save Role Details"}</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
