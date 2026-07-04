import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LogOut, User, Settings, Bell, Search, Check, Info, AlertTriangle, ShieldCheck, 
  Sun, Moon, Sparkles, HelpCircle, Activity, Plus, PenSquare, MessageSquare, AlertOctagon,
  ChevronLeft, ChevronRight, Command, X, Terminal, Laptop, CheckCircle2, FileText, Menu,
  Smartphone, QrCode
} from "lucide-react";
import { useAuth } from "../lib/AuthContext.tsx";
import { useTheme } from "./ThemeProvider.tsx";
import { Button } from "../../components/ui/button.tsx";
import { supabase } from "../lib/supabase.ts";
import { motion, AnimatePresence } from "motion/react";

interface LinkItem {
  label: string;
  isHeader?: boolean;
  path?: string;
  icon?: any;
  exact?: boolean;
}



export default function DashboardLayout({ children, sidebarLinks }: { children: React.ReactNode, sidebarLinks: LinkItem[] }) {
    
  const { dbUser, logOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Collapsible Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("dcms_sidebar_collapsed") === "true";
  });

  // Mobile navigation drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Command Palette & Help States
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteResults, setPaletteResults] = useState<any[]>([]);
  const [paletteSearching, setPaletteSearching] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarProfileMenuOpen, setSidebarProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: "default-1", type: "notice", title: "AI Copilot System Live", message: "Gemini Auto-Triage Agent is actively routing network and hardware tickets.", time: "Operational", unread: true }
  ]);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabContainerExpanded, setFabContainerExpanded] = useState(false);

  // Keyboard listeners for Command Palette & Help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setHelpOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Palette automatic query debounce search
  useEffect(() => {
    if (!paletteQuery.trim()) {
      setPaletteResults([]);
      setPaletteIndex(0);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setPaletteSearching(true);
      try {
        const { data } = await supabase
          .from("tickets")
          .select("id, issue_type, description, status, severity")
          .or(`description.ilike.%${paletteQuery}%,issue_type.ilike.%${paletteQuery}%`)
          .limit(4);
        setPaletteResults(data || []);
      } catch (err) {
        console.error("Command palette database search failed:", err);
      } finally {
        setPaletteSearching(false);
        setPaletteIndex(0);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [paletteQuery]);

  // Real-time Global Search everywhere
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch real alerts dynamically from notices and tickets
  useEffect(() => {
    if (!dbUser) return;

    async function loadAlerts() {
      try {
        const listAlerts: any[] = [];
        
        // 1. Fetch latest notices
        const { data: notices } = await supabase
          .from("notices")
          .select("id, title, message, created_at")
          .order("created_at", { ascending: false })
          .limit(2);

        if (notices) {
          notices.forEach(n => {
            listAlerts.push({
              id: `notice-${n.id}`,
              type: "notice",
              title: n.title,
              message: n.message,
              time: new Date(n.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
              unread: true
            });
          });
        }

        // 2. Fetch latest tickets
        let query = supabase.from("tickets").select("id, issue_type, status, created_at");
        if (dbUser.role !== "admin") {
          query = query.eq("user_id", dbUser.id);
        }
        
        const { data: tickets } = await query
          .order("created_at", { ascending: false })
          .limit(3);

        if (tickets) {
          tickets.forEach((c: any) => {
            const code = `Workplace Hub-${c.id.toString().substring(0, 5).toUpperCase()}`;
            listAlerts.push({
              id: `ticket-${c.id}`,
              type: "status",
              title: `${c.issue_type} Ticket Update`,
              message: `Ticket #${code} is currently flagged as '${c.status}'.`,
              time: new Date(c.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
              unread: c.status !== "Resolved"
            });
          });
        }

        // 3. Fetch direct personal user notifications
        const simUserNotifs = JSON.parse(localStorage.getItem("dcms_ticket_notifications_v1") || "[]");
        const personalNotifs = simUserNotifs.filter((n: any) => n.user_id === dbUser.id && n.unread);
        
        personalNotifs.forEach((n: any) => {
          listAlerts.push({
            id: n.id,
            type: "notice",
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
            unread: true
          });
        });

        // Add backup mock system notices if empty
        if (listAlerts.length === 0) {
          listAlerts.push(
            { id: 1, type: "status", title: "No Current Incidents", message: "Excellent! All system telemetry checks are fully compliant.", time: "Now", unread: false }
          );
        }

        setNotifications(listAlerts);
      } catch (err) {
        console.error("Failed loading dynamic notifications:", err);
      }
    }

    loadAlerts();
    // Refresh alerts periodically
    const timer = setInterval(loadAlerts, 15000);
    return () => clearInterval(timer);
  }, [dbUser]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from("tickets")
          .select("id, issue_type, description, status, severity")
          .or(`description.ilike.%${searchQuery}%,issue_type.ilike.%${searchQuery}%`)
          .limit(5);
        setSearchResults(data || []);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const deleteNotif = (id: any) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex flex-col md:flex-row font-sans transition-colors duration-350">
      
      {/* Sidebar helper function to avoid repeating layout code */}
      {(() => {
        const renderSidebar = (isMobileDrawer = false) => {
          const isCollapsed = !isMobileDrawer && sidebarCollapsed;
          return (
            <div className="flex flex-col h-full bg-white dark:bg-[#0B1222] text-slate-800 dark:text-slate-100">
              {/* Header Block */}
              <div className={`p-6 border-b border-slate-100 dark:border-[#1E293B] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2 overflow-hidden`}>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20 shrink-0">
                    {"D"}</div>
                  {!isCollapsed && (
                    <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent transition-opacity duration-300">
                      {"Workplace Hub"}</h2>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="text-[9px] font-black px-2 py-0.5 bg-blue-100/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full border border-blue-200/50 dark:border-blue-800/60 shrink-0">
                    {"SaaS v2"}</span>
                )}
              </div>

              {/* Navigation items scroll area */}
              <div className="p-4 flex-1 overflow-y-auto">
                 <nav className="space-y-1">
                   {sidebarLinks.map((link, idx) => {
                      if ('isHeader' in link) {
                         if (isCollapsed) {
                           return <div key={idx} className="h-0.5 bg-slate-100 dark:bg-slate-800/60 my-4" />
                         }
                         return (
                           <div key={idx} className="px-3 pt-5 pb-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                             {link.label}
                           </div>
                         );
                      }
                      const active = link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path);
                      const Icon = link.icon;
                      return (
                        <Link 
                          key={link.path} 
                          to={link.path} 
                          id={`tour-sidebar-${link.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                          title={isCollapsed ? link.label : undefined}
                          onClick={() => {
                            if (isMobileDrawer) {
                              setMobileSidebarOpen(false);
                            }
                          }}
                          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3 pl-4'} py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                            active 
                              ? 'bg-blue-500/10 dark:bg-indigo-500/10 text-blue-600 dark:text-indigo-400 border-l-4 border-blue-500 dark:border-indigo-500 pl-3 shadow-2xs' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${active ? 'text-blue-500 dark:text-indigo-400' : 'text-slate-400 group-hover:scale-105'}`} />
                          {!isCollapsed && (
                            <span className="ml-3 truncate">{link.label}</span>
                          )}

                          {/* Mini tooltip for collapsed state */}
                          {isCollapsed && (
                            <div className="pointer-events-none absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-50 whitespace-nowrap">
                              {link.label}
                            </div>
                          )}
                        </Link>
                      );
                   })}
                 </nav>
              </div>

              {/* Footer Profile & Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-[#1E293B] bg-slate-5/50 dark:bg-[#0F172A] relative">
                <AnimatePresence>
                  {sidebarProfileMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-4 mb-2 min-w-[220px] bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100 dark:border-slate-700/80">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{dbUser?.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{dbUser?.email}</p>
                      </div>
                      <div className="p-1.5">
                        <button onClick={() => { setSidebarProfileMenuOpen(false); setMobileSidebarOpen(false); navigate(dbUser?.role === 'admin' ? '/admin/profile' : '/dashboard/profile'); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                          <User className="w-3.5 h-3.5" /> {"Profile Settings"}</button>
                        <button onClick={() => { setSidebarProfileMenuOpen(false); setTheme(theme === 'dark' ? 'light' : 'dark'); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between">
                           <span className="flex items-center gap-2">
                             {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />} 
                             {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                           </span>
                        </button>
                      </div>
                      <div className="p-1.5 border-t border-slate-100 dark:border-slate-700/80">
                        <button onClick={() => { setSidebarProfileMenuOpen(false); setMobileSidebarOpen(false); logOut(); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-2">
                          <LogOut className="w-3.5 h-3.5" /> {"Logical Sign Out"}</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                   onClick={() => setSidebarProfileMenuOpen(!sidebarProfileMenuOpen)}
                   className={`w-full flex items-center ${isCollapsed ? 'justify-center p-0' : 'px-2 py-2'} gap-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer outline-none relative`}
                 >
                   <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-indigo-950/40 border border-blue-200 dark:border-indigo-900/60 flex flex-shrink-0 items-center justify-center text-blue-600 dark:text-indigo-400 font-bold uppercase shadow-inner">
                     {dbUser?.name?.[0] || 'U'}
                     <span className="absolute bottom-1 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#020617]"></span>
                   </div>
                   {!isCollapsed && (
                     <div className="overflow-hidden min-w-0 flex-1 text-left">
                       <p className="text-xs font-black text-slate-950 dark:text-white truncate">{dbUser?.name || dbUser?.email}</p>
                       <p className="text-[9px] text-slate-450 dark:text-slate-500 truncate mt-0.5 uppercase font-extrabold tracking-wider">
                         {dbUser?.role === 'admin' ? '🛡️ Administrator' : '👤 Client portal'}
                       </p>
                     </div>
                   )}
                 </button>
              </div>
            </div>
          );
        };

        return (
          <>
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex ${sidebarCollapsed ? 'w-20' : 'w-[260px]'} bg-white dark:bg-[#0B1222] border-r border-slate-200/80 dark:border-[#1E293B] flex-col text-slate-800 dark:text-slate-100 z-40 shrink-0 transition-all duration-300 ease-in-out relative`}>
              {/* Desktop Collapse Arrow Toggle */}
              <button 
                onClick={() => {
                  const nextVal = !sidebarCollapsed;
                  setSidebarCollapsed(nextVal);
                  localStorage.setItem("dcms_sidebar_collapsed", String(nextVal));
                }} 
                className="hidden md:flex absolute top-6 -right-3 w-6 h-6 rounded-full bg-blue-600 dark:bg-indigo-600 text-white items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all z-50 border border-blue-500/50 dark:border-indigo-500/50"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
              {renderSidebar(false)}
            </aside>

            {/* Mobile Drawer Sidebar */}
            <AnimatePresence>
              {mobileSidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black z-50 md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                  {/* Slide-out Drawer Panel */}
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="fixed top-0 bottom-0 left-0 w-[280px] z-50 md:hidden shadow-2xl border-r border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1222] flex flex-col"
                  >
                    {/* Close Button Inside Drawer */}
                    <div className="absolute top-4 right-4 z-50">
                      <button
                        onClick={() => setMobileSidebarOpen(false)}
                        className="p-1.5 rounded-lg bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {renderSidebar(true)}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        );
      })()}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-350">
        {/* Modern Top Header bar */}
        <header className="h-16 bg-white dark:bg-[#0B1222] border-b border-slate-100 dark:border-[#1E293B] flex items-center justify-between px-6 lg:px-8 z-30 shrink-0 shadow-sm transition-colors duration-350">
          
          {/* Global Smart Search & Mobile Menu Trigger */}
          <div className="flex items-center gap-3 relative w-full max-w-[350px]">
            {/* Hamburger Menu Toggle on Mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex md:hidden w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 items-center justify-center transition-colors shadow-sm border border-slate-100 dark:border-slate-800 bg-[#FCFDFE] dark:bg-[#11192A] shrink-0 cursor-pointer"
              title={"Open Menu"}
            >
              <Menu className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between pl-3 pr-2 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-semibold hover:border-blue-500/80 dark:hover:border-indigo-505 transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform" />
                <span className="text-slate-500 dark:text-slate-400">{"Search tickets..."}</span>
              </div>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                <span>{"Ctrl"}</span>{"K"}</kbd>
            </button>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Quick Actions Array - Desktop Only */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
              {dbUser?.role !== 'admin' && (
                <>
                  <Button id="tour-new-ticket-btn" onClick={() => navigate('/dashboard/register')} variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1222] text-slate-700 dark:text-slate-200 mb-0">
                    <Plus className="w-3.5 h-3.5 mr-1" /> {"New Ticket"}</Button>
                  <Button id="tour-my-tickets-btn" onClick={() => navigate('/dashboard/my-complaints')} variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1222] text-slate-700 dark:text-slate-200 mb-0">
                    <FileText className="w-3.5 h-3.5 mr-1" /> {"My Tickets"}</Button>
                </>
              )}
              <Button id="tour-ask-ai-btn" onClick={() => navigate(dbUser?.role === 'admin' ? '/admin/ai-assistant' : '/dashboard/ai-assistant')} size="sm" className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm mb-0">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> {"Ask AI"}</Button>
            </div>
            {/* SLA Status Indicator Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-950/60 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {"99.2% Global SLA Compliance"}</div>

            {/* PWA MOBILE INSTALL & DISTRIBUTE TRIGGER */}
            <button
              id="tour-install-app"
              onClick={() => window.dispatchEvent(new CustomEvent("open-install-modal"))}
              className="w-10 h-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-cyan-400 flex items-center justify-center transition-colors shadow-sm border border-slate-100 dark:border-slate-800 bg-[#FCFDFE] dark:bg-[#11192A]"
              title={"Install & Share Mobile PWA"}
            >
              <Smartphone className="w-4 h-4 text-cyan-500" />
            </button>

            {/* LANGUAGE SELECTOR */}
            <div>
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Settings className="w-5 h-5" /></button>
            </div>

            {/* LIGHT / DARK THEME TOGGLE */}
            <button
              id="tour-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shadow-sm border border-slate-100 dark:border-slate-800 bg-[#FCFDFE] dark:bg-[#11192A]"
              title={"Toggle Light / Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notification Bell (Triggers Drawer) */}
            <div className="relative">
              <button 
                id="tour-notification-bell"
                onClick={() => setNotifOpen(true)}
                className="w-10 h-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors relative shadow-sm border border-slate-100 dark:border-slate-800 bg-[#FCFDFE] dark:bg-[#11192A]"
                title={"System Notifications"}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] text-white font-extrabold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Overview Dropdown Button */}
            <div className="relative">
              <button 
                id="tour-profile-dropdown"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 pl-2 border-l border-slate-100 dark:border-slate-800 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center uppercase border border-blue-200">
                  {dbUser?.name?.[0] || 'U'}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1">{dbUser?.name || 'Helper Account'}</p>
                  <p className="text-slate-400 uppercase tracking-widest text-[8px] font-extrabold">{dbUser?.role}</p>
                </div>
              </button>

              {/* Profile Menu Dropdown */}
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setProfileMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-850 dark:text-slate-100 py-1.5">
                    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{dbUser?.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{dbUser?.email}</p>
                    </div>
                    <Link 
                      to={dbUser?.role === 'admin' ? "/admin/profile" : "/dashboard/profile"}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      {"View Profile"}</Link>
                    <Link
                      to={dbUser?.role === 'admin' ? "/admin/settings" : "/dashboard/settings"}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      {"Account Settings"}</Link>
                    <div className="border-t border-slate-50 dark:border-slate-800 my-1"></div>
                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logOut();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {"SaaS Gateway Logout"}</button>
                  </div>
                </>
              )}
            </div>
            
          </div>
        </header>

        {/* Content View wrapper -- Fluid Grid */}
        <main className="flex-1 overflow-auto relative w-full">
          <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto flex flex-col items-center justify-start min-h-full">
            {children}
          </div>
        </main>

        {/* FLOATING QUICK ACTIONS BAR */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse md:flex-row items-end md:items-center gap-3 font-sans transition-all duration-300">
          
          <button
            onClick={() => setFabContainerExpanded(!fabContainerExpanded)}
            className={`w-10 h-10 rounded-full bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer z-50 ${fabContainerExpanded ? "rotate-90 md:rotate-0" : "-rotate-90 md:rotate-180"}`}
            title={fabContainerExpanded ? "Hide Quick Actions" : "Show Quick Actions"}
          >
            <ChevronRight className="w-5 h-5 hidden md:block" />
            <ChevronRight className="w-5 h-5 block md:hidden" style={{ transform: "rotate(-90deg)" }} />
          </button>

          <AnimatePresence>
            {fabContainerExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: window.innerWidth > 768 ? 20 : 0, y: window.innerWidth > 768 ? 0 : 20, pointerEvents: 'none' }}
                animate={{ opacity: 1, x: 0, y: 0, pointerEvents: 'auto' }}
                exit={{ opacity: 0, x: window.innerWidth > 768 ? 20 : 0, y: window.innerWidth > 768 ? 0 : 20, pointerEvents: 'none' }}
                transition={{ duration: 0.2 }}
                className="flex flex-col-reverse md:flex-row items-end md:items-center gap-3"
              >
                {/* Distinct FAQ Help Button next to FAB */}
                <button
                  onClick={() => setHelpOpen(true)}
                  className="w-11 h-11 rounded-full bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-950 hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg transition-all border border-slate-205/10 dark:border-slate-200/30 font-bold text-base cursor-pointer"
                  title={"Interactive FAQ & SLAs"}
                >
                  ❓
                </button>

                <div className="relative flex flex-col items-end gap-2.5">
                  <AnimatePresence>
                    {fabOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-col gap-2.5 items-end absolute bottom-14 right-0 z-40"
                      >
                        {/* Action 1: Register Ticket */}
                        {dbUser?.role !== 'admin' && (
                          <div className="flex items-center gap-2 group relative">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-lg px-2 py-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute right-[110%] mr-2">
                              {"Register Issue File"}</span>
                            <button 
                              onClick={() => {
                                setFabOpen(false);
                                navigate("/dashboard/register");
                              }}
                              className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all border border-blue-500"
                              title={"Register Ticket"}
                            >
                              <PenSquare className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        )}

                        {/* Action 2: Check Notices */}
                        <div className="flex items-center gap-2 group relative">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-lg px-2 py-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute right-[110%] mr-2">
                            {"View Bulletin Notices"}</span>
                          <button 
                            onClick={() => {
                              setFabOpen(false);
                              navigate(dbUser?.role === 'admin' ? "/admin/notices" : "/dashboard/notices");
                            }}
                            className="w-11 h-11 bg-[#10B981] hover:bg-[#0D9668] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all border border-emerald-550"
                            title={"View System Notices"}
                          >
                            <Bell className="w-4.5 h-4.5" />
                          </button>
                        </div>
                        
                        {/* Action 3: AI Assistant */}
                        <div className="flex items-center gap-2 group relative">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0B1222] border border-slate-100 dark:border-slate-800 rounded-lg px-2 py-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute right-[110%] mr-2">
                            {"AI Assistant"}</span>
                          <button 
                            onClick={() => {
                              setFabOpen(false);
                              navigate(dbUser?.role === 'admin' ? "/admin/ai-assistant" : "/dashboard/ai-assistant");
                            }}
                            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all border border-indigo-500"
                            title={"Open AI Assistant"}
                          >
                            <Sparkles className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Trigger FAB Button */}
                  <button
                    onClick={() => setFabOpen(!fabOpen)}
                    className={`w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-650 dark:from-indigo-600 dark:to-cyan-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all relative z-40 border border-indigo-505/30 ${fabOpen ? "rotate-45" : ""}`}
                    style={{ transition: "all 0.25s ease" }}
                    title={"SaaS Quick Menu"}
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Premium Notification Slide-out Drawer Panel */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-3xs z-45"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-[#0B1222] border-l border-slate-205 dark:border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-5/50 dark:bg-slate-955/20">
                <div className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-blue-500 dark:text-indigo-400" />
                  <h4 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100">{"Enterprise Alerts & Logs"}</h4>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      {"Mark all read"}</button>
                  )}
                  <button 
                    onClick={() => setNotifOpen(false)} 
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-105 dark:divide-slate-800 p-4 space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:bg-slate-5/50 dark:hover:bg-slate-805/40 transition-colors duration-155 ${notif.unread ? 'bg-blue-505/5 dark:bg-indigo-550/5 border-blue-100 dark:border-indigo-900/30' : ''}`}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-202 flex items-center gap-1.5">
                        {notif.type === 'status' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 rounded-full" /> : <Info className="w-4 h-4 text-amber-500 rounded-full" />}
                        {notif.title}
                      </p>
                      <button onClick={() => deleteNotif(notif.id)} className="text-[10px] text-slate-400 dark:text-slate-650 hover:text-slate-550 p-0.5">✕</button>
                    </div>
                    <p className="text-xs text-slate-505 dark:text-slate-400 mt-1 pl-1">{notif.message}</p>
                    <p className="text-[10px] text-slate-405 dark:text-slate-555 mt-1.5 pl-1 font-mono">{notif.time}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs h-64">
                    <Check className="w-8 h-8 text-emerald-500 bg-emerald-500/10 p-1 rounded-full mb-3" />
                    <p className="font-bold text-slate-700 dark:text-slate-305">{"All caught up!"}</p>
                    <p className="text-[11px] text-slate-450 mt-0.5">{"No recent incidents or notices reported."}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Command Palette Overlay Modal */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-955/60 backdrop-blur-2xs z-50 flex items-start justify-center pt-24 px-4"
              onClick={() => setCommandPaletteOpen(false)}
            >
              <motion.div 
                initial={{ y: -20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-xl bg-white dark:bg-[#0B1222] border border-slate-205 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-55/65 dark:bg-slate-900/30">
                  <Command className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input 
                    type="text" 
                    placeholder={"Search tickets, notices, or run command..."}
                    value={paletteQuery}
                    onChange={(e) => setPaletteQuery(e.target.value)}
                    className="w-full bg-transparent border-0 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0 text-sm font-medium"
                    autoFocus
                  />
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-805 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
                    {"ESC"}</span>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  
                  {/* Suggestion categories if query is empty */}
                  {!paletteQuery.trim() && (
                    <div className="p-1 space-y-1">
                      <div className="px-2 py-1.5 text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-550 uppercase">
                        {"Quick Gateways"}</div>
                      
                      {[
                        { icon: Activity, label: "Go To System Dashboard Home", path: dbUser?.role === 'admin' ? "/admin" : "/dashboard/my-complaints" },
                        { icon: PenSquare, label: "Register New Support Incident Case", path: dbUser?.role === 'admin' ? "/admin/complaints" : "/dashboard/register" },
                        { icon: Bell, label: "Review Broadcast Notices & Bulletins", path: dbUser?.role === 'admin' ? "/admin/notices" : "/dashboard/notices" },
                        { icon: User, label: "My Profile Details Workspace", path: dbUser?.role === 'admin' ? "/admin/profile" : "/dashboard/profile" },
                        { icon: Settings, label: "Personal Account Configurations", path: dbUser?.role === 'admin' ? "/admin/settings" : "/dashboard/settings" },
                      ].map((cmd, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setCommandPaletteOpen(false);
                            navigate(cmd.path);
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-105/85 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <cmd.icon className="w-4 h-4 text-blue-500 dark:text-indigo-400" />
                          <span>{cmd.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Results */}
                  {paletteQuery.trim() && (
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-550 uppercase">
                        {"Matching Tickets"}</div>
                      {paletteSearching ? (
                        <div className="p-4 text-center text-xs text-slate-400">{"Querying live server index..."}</div>
                      ) : paletteResults.length > 0 ? (
                        paletteResults.map((ticketPrivate) => (
                          <div 
                            key={ticketPrivate.id}
                            onClick={() => {
                              setCommandPaletteOpen(false);
                              navigate(dbUser?.role === 'admin' ? "/admin/complaints" : "/dashboard/my-complaints");
                            }}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-850 dark:text-slate-100">{ticketPrivate.issue_type} {"Case"}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                                ticketPrivate.severity === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-505'
                              }`}>{ticketPrivate.severity}</span>
                            </div>
                            <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate mt-1">{ticketPrivate.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-455">{"No match found. Try another query like 'system' or 'internet'."}</div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Interactive FAQ Help Modal Drawer */}
      <AnimatePresence>
        {helpOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4"
              onClick={() => setHelpOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-white dark:bg-[#0B1222] border border-slate-205 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-slate-850 dark:text-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-55/50 dark:bg-slate-950/25">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <div>
                      <h4 className="font-extrabold text-sm tracking-tight text-slate-950 dark:text-white">{"Interactive Help Portal"}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{"SLA response thresholds & guidelines"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setHelpOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5 max-h-[480px]">
                  
                  {/* Tutorial Action */}
                  <div className="space-y-3">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{"🎓 Learn the Dashboard"}</h5>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{"Interactive Tutorials"}</p>
                        <p className="text-xs text-slate-500 mt-1">{"Take a quick 3-minute guided tour of Workplace Hub."}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setHelpOpen(false);
                          const tourName = dbUser?.role === "admin" ? "admin" : "employee";
                          window.dispatchEvent(new CustomEvent("start-product-tour", { detail: { name: tourName } }));
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        {"Start Tour"}</button>
                    </div>
                  </div>

                  {/* SLA Guides list */}
                  <div className="space-y-3 pt-2">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{"⏱️ Expected Resolution SLAs"}</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-red-500/5 dark:bg-red-955/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                        <p className="font-black text-red-650 dark:text-red-400">{"Critical Severity"}</p>
                        <p className="text-[10.5px] mt-0.5 text-slate-500">{"2 hour target response"}</p>
                      </div>
                      <div className="p-3 bg-orange-500/5 dark:bg-orange-955/10 border border-orange-150 dark:border-orange-900/30 rounded-xl">
                        <p className="font-black text-orange-655 dark:text-orange-400">{"Urgent Severity"}</p>
                        <p className="text-[10.5px] mt-0.5 text-slate-500">{"6 hour target response"}</p>
                      </div>
                      <div className="p-3 bg-blue-500/5 dark:bg-blue-955/10 border border-blue-105 dark:border-blue-900/30 rounded-xl">
                        <p className="font-black text-blue-650 dark:text-blue-400">{"Medium Severity"}</p>
                        <p className="text-[10.5px] mt-0.5 text-slate-500">{"12 hour target response"}</p>
                      </div>
                      <div className="p-3 bg-emerald-500/5 dark:bg-emerald-955/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                        <p className="font-black text-emerald-650 dark:text-emerald-400">{"Low Severity"}</p>
                        <p className="text-[10.5px] mt-0.5 text-slate-505">{"24 hour target response"}</p>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="space-y-3 pt-2">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{"📋 Frequently Asked Questions"}</h5>
                    
                    <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="pt-2 first:pt-0">
                        <p className="text-xs font-bold text-slate-905 dark:text-slate-100">{"How is severity assigned?"}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{"Our system evaluates description pattern vectors to identify high impact issues and auto-triages tickets instantly."}</p>
                      </div>
                      <div className="pt-3">
                        <p className="text-xs font-bold text-slate-905 dark:text-slate-100">{"Can I update a draft case?"}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{"Yes! Saved draft cases are indexed inside your local memory. Open Draft Tickets to restore and submit them at any time."}</p>
                      </div>
                      <div className="pt-3">
                        <p className="text-xs font-bold text-slate-905 dark:text-slate-100">{"Is PDF receipt generation supported?"}</p>
                        <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">{"Yes. Business clients can generate clean PDF summaries after submission for tracking and corporate filing standards."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-450 dark:text-slate-500">
                    <span>{"Emergency: support@corp.com"}</span>
                    <span>{"Service line: +1 (800) 555-SLA1"}</span>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
