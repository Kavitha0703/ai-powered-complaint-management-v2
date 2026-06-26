import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { 
  Bell, Users, Check, CheckCheck, Eye, Search, Plus, Trash2, 
  BarChart3, RefreshCw, Send, AlertTriangle, ShieldCheck, Mail, Megaphone,
  Network, Server, BookOpen, Clock, Heart, Award, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select.tsx";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

// Helper storage keys
const NOTIF_LOG_KEY = "dcms_ticket_notifications_v1";

interface DBUserRaw {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export default function AdminCommunicationCenter() {
  const { dbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "notices" | "personal" | "receipts" | "analytics">("overview");
  
  // Database / Simulated state
  const [users, setUsers] = useState<DBUserRaw[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [readReceipts, setReadReceipts] = useState<any[]>([]);
  
  // Form stats/loading
  const [loading, setLoading] = useState(false);
  
  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("General Bulletin");
  const [noticeRecipientType, setNoticeRecipientType] = useState<"everyone" | "department" | "team">("everyone");
  const [noticeDept, setNoticeDept] = useState("IT");
  const [noticeTeam, setNoticeTeam] = useState("IT Desk Support");
  const [noticePriority, setNoticePriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  
  // Personal Notification Form State
  const [personalTitle, setPersonalTitle] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [personalUserSearch, setPersonalUserSearch] = useState("");
  const [selectedPersonalUser, setSelectedPersonalUser] = useState<DBUserRaw | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [personalPriority, setPersonalPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");

  // Read Receipts Detail Modal State
  const [receiptDetailItem, setReceiptDetailItem] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Initialize and seed mock workspace data if needed
  useEffect(() => {
    // 1. Seed users if not loaded or empty
    let simUsers = JSON.parse(localStorage.getItem("dcms_sim_users") || "[]");
    if (simUsers.length <= 1) {
      simUsers = [
        { id: "usr_kiki", name: "Kiki Employee", email: "kiki@workplacehub.com", department: "Operations" },
        { id: "usr_john", name: "John Doe", email: "john@workplacehub.com", department: "IT" },
        { id: "usr_sarah", name: "Sarah Jenkins", email: "sarah@workplacehub.com", department: "HR" },
        { id: "usr_david", name: "David Chen", email: "david@workplacehub.com", department: "Finance" },
        { id: "usr_marcus", name: "Marcus Vance", email: "marcus@workplacehub.com", department: "Operations" },
        { id: "usr_clara", name: "Clara Oswald", email: "clara@workplacehub.com", department: "IT" },
        { id: "usr_brian", name: "Brian Griffin", email: "brian@workplacehub.com", department: "Finance" },
        { id: "usr_amy", name: "Amy Wong", email: "amy@workplacehub.com", department: "HR" },
      ];
      localStorage.setItem("dcms_sim_users", JSON.stringify(simUsers));
    }
    setUsers(simUsers);

    // 2. Load notices
    loadNoticesData();

    // 3. Setup initial mock read receipts if none exist
    let simReceipts = JSON.parse(localStorage.getItem("dcms_sim_notice_reads") || "[]");
    if (simReceipts.length === 0) {
      // Seed some historic reads to make analytics beautiful on first mount
      simReceipts = [
        { id: "rc_1", notice_id: "notice_101", user_id: "usr_kiki", read_at: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: "rc_2", notice_id: "notice_101", user_id: "usr_john", read_at: new Date(Date.now() - 3600000 * 1.5).toISOString() },
        { id: "rc_3", notice_id: "notice_101", user_id: "usr_sarah", read_at: new Date(Date.now() - 3600000 * 2.8).toISOString() },
        { id: "rc_4", notice_id: "notice_102", user_id: "usr_john", read_at: new Date(Date.now() - 3600000 * 5).toISOString() },
        { id: "rc_5", notice_id: "notice_102", user_id: "usr_david", read_at: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: "rc_6", notice_id: "notice_102", user_id: "usr_clara", read_at: new Date(Date.now() - 3600000 * 6).toISOString() },
        { id: "rc_7", notice_id: "notice_103", user_id: "usr_sarah", read_at: new Date(Date.now() - 3600000 * 12).toISOString() },
        { id: "rc_8", notice_id: "notice_103", user_id: "usr_amy", read_at: new Date(Date.now() - 3600000 * 10).toISOString() },
      ];
      localStorage.setItem("dcms_sim_notice_reads", JSON.stringify(simReceipts));
    }
    setReadReceipts(simReceipts);
  }, []);

  const loadNoticesData = async () => {
    try {
      const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
      setNotices(data || []);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    }
  };

  // Compose / Save Public Notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) return;

    setLoading(true);
    try {
      // Compile Title with Serialized parameters matching DCMS standards
      // Plus our extra targeted details
      const compiledTitle = `[TYPE:${noticeCategory}][IMPORTANCE:${noticePriority === "Critical" ? "Featured" : "Standard"}][THEME:${getThemeByCat(noticeCategory)}] [TARGET:${noticeRecipientType}] ${noticeTitle}`;
      
      const newNotice = {
        title: compiledTitle,
        message: noticeMessage,
        recipient_type: noticeRecipientType,
        target_department: noticeRecipientType === "department" ? noticeDept : null,
        target_team: noticeRecipientType === "team" ? noticeTeam : null,
        priority: noticePriority,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from("notices").insert([newNotice]);
      if (error) throw error;

      // Broadcast automated notifications to user notification channel for real-time bell update
      const storedNotifs = JSON.parse(localStorage.getItem(NOTIF_LOG_KEY) || "[]");
      users.forEach(u => {
        // Evaluate target condition
        let targetMatch = false;
        if (noticeRecipientType === "everyone") {
          targetMatch = true;
        } else if (noticeRecipientType === "department" && u.department === noticeDept) {
          targetMatch = true;
        } else if (noticeRecipientType === "team" && u.department === "IT") { // IT is standard department containing teams
          targetMatch = true;
        }

        if (targetMatch) {
          storedNotifs.push({
            id: "nt_" + Math.random().toString(36).substring(2, 11),
            user_id: u.id,
            type: "notice_alert",
            title: `📢 Notice: ${noticeTitle}`,
            message: noticeMessage,
            created_at: new Date().toISOString(),
            unread: true
          });
        }
      });
      localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(storedNotifs));

      // Reset form
      setNoticeTitle("");
      setNoticeMessage("");
      setActiveTab("receipts");
      loadNoticesData();
    } catch (err) {
      console.error("Failed to broadcast notice:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compose / Save Personal Notification (targeted to single individual)
  const handleCreatePersonalNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonalUser || !personalTitle.trim() || !personalMessage.trim()) return;

    setLoading(true);
    try {
      const storedNotifs = JSON.parse(localStorage.getItem(NOTIF_LOG_KEY) || "[]");
      const notifId = "nt_pers_" + Math.random().toString(36).substring(2, 11);
      
      const personalNotif = {
        id: notifId,
        user_id: selectedPersonalUser.id,
        type: "status_update",
        title: `${personalPriority === "Critical" ? "🚨 " : "🔔 "}${personalTitle}`,
        message: personalMessage,
        created_at: new Date().toISOString(),
        unread: true
      };

      storedNotifs.push(personalNotif);
      localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(storedNotifs));

      // Also persist in supabase custom simulated table user_notifications
      // So that we can calculate read rates!
      const simUserNotifs = JSON.parse(localStorage.getItem("dcms_sim_user_notifications") || "[]");
      simUserNotifs.push({
        ...personalNotif,
        priority: personalPriority,
        target_name: selectedPersonalUser.name,
        target_email: selectedPersonalUser.email
      });
      localStorage.setItem("dcms_sim_user_notifications", JSON.stringify(simUserNotifs));

      // Reset
      setPersonalTitle("");
      setPersonalMessage("");
      setSelectedPersonalUser(null);
      setPersonalUserSearch("");
      setActiveTab("receipts");
    } catch (err) {
      console.error("Personal notification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      await supabase.from("notices").delete().eq("id", id);
      loadNoticesData();
    } catch (err) {
      console.error(err);
    }
  };

  const getThemeByCat = (cat: string) => {
    switch (cat) {
      case "Maintenance": return "server";
      case "Policy Change": return "policy";
      case "Critical Alert": return "alert";
      case "Company Event": return "event";
      default: return "general";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-500 text-white animate-pulse border-red-600";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-blue-500 text-white";
      default: return "bg-slate-400 text-white";
    }
  };

  // Autocomplete filter
  const filteredPersonalUsers = users.filter(u => 
    u.name.toLowerCase().includes(personalUserSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(personalUserSearch.toLowerCase())
  );

  // Compute Read Receipts metadata
  const computeReadStats = (item: any, isNotice = true) => {
    const totalCirculation = isNotice ? getCirculationCount(item) : 1;
    let readCount = 0;

    if (isNotice) {
      // Look up reads from dcms_sim_notice_reads
      const reads = readReceipts.filter(r => r.notice_id === item.id);
      readCount = reads.length;
    } else {
      // Look up read state in UserNotification log
      const log = JSON.parse(localStorage.getItem(NOTIF_LOG_KEY) || "[]");
      const loggedNotif = log.find((n: any) => n.id === item.id);
      readCount = (loggedNotif && !loggedNotif.unread) ? 1 : 0;
    }

    const unreadCount = Math.max(0, totalCirculation - readCount);
    const readPercentage = totalCirculation > 0 ? Math.round((readCount / totalCirculation) * 100) : 0;

    return {
      total: totalCirculation,
      read: readCount,
      unread: unreadCount,
      percentage: readPercentage
    };
  };

  const getCirculationCount = (notice: any) => {
    const rawTitle = notice.title || "";
    if (rawTitle.includes("[TARGET:department]")) {
      // Pull department
      const dept = notice.target_department || "IT";
      return users.filter(u => u.department === dept).length;
    }
    if (rawTitle.includes("[TARGET:team]")) {
      return 3; // Mock Team count
    }
    return users.length; // Everyone
  };

  const handleOpenReceiptDetail = (item: any, isNotice = true) => {
    const stats = computeReadStats(item, isNotice);
    
    // Find list of users who have read
    let readers: any[] = [];
    let unreaders: any[] = [];

    const circulationUsers = users.filter(u => {
      const rawTitle = item.title || "";
      if (rawTitle.includes("[TARGET:department]")) {
        return u.department === (item.target_department || "IT");
      }
      return true;
    });

    if (isNotice) {
      const reads = readReceipts.filter(r => r.notice_id === item.id);
      circulationUsers.forEach(u => {
        const readEntry = reads.find(r => r.user_id === u.id);
        if (readEntry) {
          readers.push({ ...u, read_at: readEntry.read_at });
        } else {
          unreaders.push(u);
        }
      });
    } else {
      const log = JSON.parse(localStorage.getItem(NOTIF_LOG_KEY) || "[]");
      const logged = log.find((n: any) => n.id === item.id);
      if (logged && !logged.unread) {
        const matchingUser = users.find(u => u.id === item.user_id);
        if (matchingUser) readers.push({ ...matchingUser, read_at: item.created_at });
      } else {
        const matchingUser = users.find(u => u.id === item.user_id);
        if (matchingUser) unreaders.push(matchingUser);
      }
    }

    setReceiptDetailItem({
      item,
      stats,
      isNotice,
      readers,
      unreaders
    });
    setShowReceiptModal(true);
  };

  // Helper parsing compiled titles for clean UI representation
  const parseNoticeTitle = (title: string) => {
    let cleaned = title || "";
    cleaned = cleaned.replace(/\[TYPE:.*?\]/g, "");
    cleaned = cleaned.replace(/\[IMPORTANCE:.*?\]/g, "");
    cleaned = cleaned.replace(/\[THEME:.*?\]/g, "");
    cleaned = cleaned.replace(/\[TARGET:.*?\]/g, "");
    return cleaned.trim();
  };

  // Load Custom User notifications created by admin for read receipts list
  const getAdminPersonalNotifications = () => {
    try {
      return JSON.parse(localStorage.getItem("dcms_sim_user_notifications") || "[]");
    } catch {
      return [];
    }
  };

  // Prepare data for Analytics charts
  const categoryData = [
    { name: "IT Maintenance", value: notices.filter(n => n.title?.includes("Maintenance")).length || 3 },
    { name: "Policy Updates", value: notices.filter(n => n.title?.includes("Policy")).length || 2 },
    { name: "Emergency Alerts", value: notices.filter(n => n.title?.includes("Critical")).length || 1 },
    { name: "Company Events", value: notices.filter(n => n.title?.includes("Event")).length || 2 },
  ];

  const departmentReadRateData = [
    { name: "Operations", Read: 92, Unread: 8 },
    { name: "IT", Read: 85, Unread: 15 },
    { name: "HR", Read: 100, Unread: 0 },
    { name: "Finance", Read: 78, Unread: 22 },
  ];

  const COLORS = ["#3B82F6", "#8B5CF6", "#EF4444", "#10B981"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Dynamic Urgent Header Alert Banner if Critical notice is unread */}
      {notices.some(n => n.priority === "Critical") && (
        <div className="bg-red-500 text-white rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg border border-red-600">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/20 rounded-full animate-bounce">
              <AlertTriangle className="w-5 h-5 text-white" />
            </span>
            <div>
              <span className="text-[10px] font-mono tracking-widest bg-red-700 px-2 py-0.5 rounded-md font-bold text-white uppercase">Critical Active Inbound Threat</span>
              <p className="font-extrabold text-sm mt-0.5">Urgent Network Alert active on user portal login streams.</p>
            </div>
          </div>
          <Badge className="bg-red-900 border text-white font-mono text-[9px] font-bold">Priority level: RED</Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-500" />
            Admin Communication Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-404 mt-1">
            Publish targeted announcements, deliver private security notifications, and query real-time read receipts.
          </p>
        </div>
        
        {/* Sub-tabs selection */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs font-bold px-4 py-1.5 h-8 rounded-xl cursor-pointer ${activeTab === 'overview' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs font-bold px-4 py-1.5 h-8 rounded-xl cursor-pointer ${activeTab === 'notices' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('notices')}
          >
            Notices Board
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs font-bold px-4 py-1.5 h-8 rounded-xl cursor-pointer ${activeTab === 'personal' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Alerts
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs font-bold px-4 py-1.5 h-8 rounded-xl cursor-pointer ${activeTab === 'receipts' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('receipts')}
          >
            Read Receipts
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs font-bold px-4 py-1.5 h-8 rounded-xl cursor-pointer ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* RENDER TAB CONTENTS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-slate-100 bg-white dark:bg-[#0B1222] relative overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Total Public Broadcasts</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-3xl font-black text-slate-800 dark:text-white">{notices.length}</p>
                  <Megaphone className="w-8 h-8 text-indigo-100 dark:text-indigo-950/40 absolute right-4 bottom-4" />
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-100 bg-white dark:bg-[#0B1222] relative overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Active Recipients</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-3xl font-black text-slate-800 dark:text-white">{users.length}</p>
                  <Users className="w-8 h-8 text-emerald-100 dark:text-emerald-950/40 absolute right-4 bottom-4" />
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-100 bg-white dark:bg-[#0B1222] relative overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Personal Security Alerts</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-3xl font-black text-slate-800 dark:text-white">
                    {getAdminPersonalNotifications().length}
                  </p>
                  <Bell className="w-8 h-8 text-amber-100 dark:text-amber-950/40 absolute right-4 bottom-4" />
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-100 bg-white dark:bg-[#0B1222] relative overflow-hidden">
              <CardContent className="p-6">
                <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Average Read Efficiency</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-3xl font-black text-slate-800 dark:text-white">88%</p>
                  <Award className="w-8 h-8 text-blue-100 dark:text-blue-950/40 absolute right-4 bottom-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Buttons Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-default bg-white dark:bg-[#0B1222]">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Megaphone className="w-4 h-4 text-indigo-500" />
                  Quick Broadcast Announcement
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-404">Send holiday alerts, system overhauls or organizational changes to departments of workspace groups.</CardDescription>
              </CardHeader>
              <CardContent>
                <button 
                  onClick={() => setActiveTab("notices")}
                  className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/25 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                >
                  <span>Launch Broadcast Composer</span>
                  <Plus className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-default bg-white dark:bg-[#0B1222]">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Compose Private Security Alert
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-404">Dispatch localized, high-importance messages to precise workspace employees (including feedback or audit notices).</CardDescription>
              </CardHeader>
              <CardContent>
                <button 
                  onClick={() => setActiveTab("personal")}
                  className="w-full flex items-center justify-between text-xs font-bold text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/25 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                >
                  <span>Launch Private Composer</span>
                  <Plus className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Monitor Stream overview */}
          <Card className="border border-slate-205 dark:border-slate-800 bg-white dark:bg-[#0B1222]">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">Inbound Read Dispatch Stream</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {notices.slice(0, 3).map((notice) => {
                  const stats = computeReadStats(notice, true);
                  return (
                    <div key={notice.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-slate-50/40 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-850 rounded-xl gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📢</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-850 dark:text-slate-100">{parseNoticeTitle(notice.title)}</p>
                          <p className="text-[10px] text-slate-404 flex items-center gap-1.5 mt-0.5">
                            <span>Broadcasted</span>
                            <span>•</span>
                            <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:w-28 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.percentage}%` }}></div>
                        </div>
                        <span className="text-xs font-extrabold text-slate-705 dark:text-slate-200 shrink-0 font-mono flex items-center gap-2">
                          <span>{stats.percentage}% Reads</span>
                          <span className="flex items-center text-blue-500 gap-0.5" title="All Sent & Delivered">
                            <CheckCheck className="w-4 h-4 text-blue-500" />
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PUBLIC NOTICES TAB */}
      {activeTab === "notices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* Write Notice Form */}
          <Card className="border border-slate-200 shadow-lg dark:border-slate-850 dark:bg-[#0B1222] self-start">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-550" />
                Compose targeted announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">Notice Title</label>
                  <Input 
                    placeholder="E.g., Sunday IT Maintenance" 
                    required 
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-404 mb-1.5 block">Notice category</label>
                  <Select value={noticeCategory} onValueChange={setNoticeCategory}>
                    <SelectTrigger className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectItem value="General Bulletin">📢 General Bulletin</SelectItem>
                      <SelectItem value="Maintenance">🔧 IT Maintenance</SelectItem>
                      <SelectItem value="Policy Change">📜 Policy Update</SelectItem>
                      <SelectItem value="Critical Alert">🚨 Critical Hazard</SelectItem>
                      <SelectItem value="Company Event">🎉 Social Corporate Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Targeted Circulation Selection */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-404 mb-1.5 block">Target Recipient Level</label>
                  <Select 
                    value={noticeRecipientType} 
                    onValueChange={(val: any) => setNoticeRecipientType(val)}
                  >
                    <SelectTrigger className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectItem value="everyone">🌎 World Broadcast (Everyone)</SelectItem>
                      <SelectItem value="department">🏢 Select Corporate Department</SelectItem>
                      <SelectItem value="team">👥 Specific Corporate Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Extra conditional dropdown details */}
                {noticeRecipientType === "department" && (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-404 mb-1.5 block">Select Department</label>
                    <Select value={noticeDept} onValueChange={setNoticeDept}>
                      <SelectTrigger className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                        <SelectItem value="IT">IT Infrastructure</SelectItem>
                        <SelectItem value="HR">Human Resources</SelectItem>
                        <SelectItem value="Finance">Corporate Finance</SelectItem>
                        <SelectItem value="Operations">Operations Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {noticeRecipientType === "team" && (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-404 mb-1.5 block">Specify Corporate Team Name</label>
                    <Input 
                      placeholder="E.g., Finance Team, HR Payroll Team" 
                      required 
                      value={noticeTeam}
                      onChange={(e) => setNoticeTeam(e.target.value)}
                      className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-404 mb-1.5 block">Urgency / Priority Level</label>
                  <Select value={noticePriority} onValueChange={(val: any) => setNoticePriority(val)}>
                    <SelectTrigger className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                      <SelectItem value="Low">🟢 Low Priority</SelectItem>
                      <SelectItem value="Medium">🔵 Medium Priority</SelectItem>
                      <SelectItem value="High">🟠 High Priority</SelectItem>
                      <SelectItem value="Critical">🚨 CRITICAL ALERT (Sends Urgent Login banner)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">Notice message</label>
                  <Textarea 
                    placeholder="Enter precise bulletin information..." 
                    required 
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    rows={4}
                    className="text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {loading ? "Broadcasting..." : "Publish & Dispatch"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Broadcasts List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-450 tracking-wider">Active Stream Broadcasts</h3>
            
            {notices.map((notice) => {
              const cleanedTitle = parseNoticeTitle(notice.title);
              const stats = computeReadStats(notice, true);
              const targetStr = notice.title?.includes("[TARGET:department]") 
                ? `Department: ${notice.target_department || "IT"}` 
                : notice.title?.includes("[TARGET:team]") 
                  ? `Team: ${notice.target_team || "Finance Team"}` 
                  : "Everyone";

              return (
                <Card key={notice.id} className="border border-slate-100 bg-white dark:bg-[#0B1222] hover:shadow-sm duration-100 rounded-2xl overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50">
                          {noticeCategory}
                        </Badge>
                        <Badge className={`${getPriorityBadgeColor(notice.priority || "Medium")} text-[8.5px] font-bold uppercase rounded`}>
                          {notice.priority || "Medium"} Urgency
                        </Badge>
                        <Badge variant="ghost" className="text-[10px] text-slate-400 bg-slate-50 font-mono">
                          Target: {targetStr}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-normal tracking-tight">
                        {cleanedTitle}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold max-w-xl whitespace-pre-wrap">
                        {notice.message}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 md:items-end pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs font-bold text-slate-600 hover:bg-slate-50 border-slate-200 dark:border-slate-800 rounded-xl"
                        onClick={() => handleOpenReceiptDetail(notice, true)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Reads ({stats.percentage}%)
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl duration-100"
                        onClick={() => deleteNotice(notice.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {notices.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-[#0B1222] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <span className="text-4xl">📭</span>
                <p className="font-bold text-slate-700 dark:text-slate-305 mt-2">Notice stream empty!</p>
                <p className="text-xs text-slate-450">Publish notices utilizing the composer panel to target users.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PERSONAL/INDIVIDUAL NOTIFICATIONS TAB */}
      {activeTab === "personal" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* Write Private Notification Form */}
          <Card className="border border-slate-200 shadow-lg dark:border-slate-850 dark:bg-[#0B1222] self-start">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-550" />
                Compose private security alert
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreatePersonalNotification} className="space-y-4">
                
                {/* Autocomplete Search User Input */}
                <div className="relative">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">Select targeted recipient user</label>
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161F30] rounded-xl px-3 pr-2 focus-within:ring-2 focus-within:ring-indigo-500/25">
                    <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <Input 
                      placeholder="Search name or workplace email..." 
                      value={personalUserSearch}
                      onChange={(e) => {
                        setPersonalUserSearch(e.target.value);
                        setUserDropdownOpen(true);
                        if (selectedPersonalUser && selectedPersonalUser.name !== e.target.value) {
                          setSelectedPersonalUser(null);
                        }
                      }}
                      className="h-10 text-xs border-0 bg-transparent ring-0 focus-visible:ring-0 p-0 font-medium w-full"
                    />
                    {selectedPersonalUser && (
                      <Badge className="bg-indigo-600 text-white font-bold shrink-0 ml-1.5 flex items-center gap-1 rounded font-sans text-[10px] leading-none py-1 px-1.5">
                        Selected: {selectedPersonalUser.name.split(" ")[0]}
                      </Badge>
                    )}
                  </div>

                  {/* Options Dropdown */}
                  {userDropdownOpen && personalUserSearch.trim() && !selectedPersonalUser && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto z-40 divide-y divide-slate-50 dark:divide-slate-900">
                      {filteredPersonalUsers.map(u => (
                        <div 
                          key={u.id}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs transition-all duration-100"
                          onClick={() => {
                            setSelectedPersonalUser(u);
                            setPersonalUserSearch(u.name);
                            setUserDropdownOpen(false);
                          }}
                        >
                          <div>
                            <p className="font-extrabold text-slate-850 dark:text-white leading-tight">{u.name}</p>
                            <p className="text-[10px] text-slate-405">{u.email} • {u.department || 'External'}</p>
                          </div>
                          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[9px] rounded uppercase pr-1.5 select-none">
                            {u.department || 'HQ'}
                          </Badge>
                        </div>
                      ))}
                      {filteredPersonalUsers.length === 0 && (
                        <p className="p-3 text-center text-[10px] text-slate-404">No matching active database users</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-404 mb-1.5 block">Notification Urgency</label>
                  <Select value={personalPriority} onValueChange={(val: any) => setPersonalPriority(val)}>
                    <SelectTrigger className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                      <SelectItem value="Low">🟢 Low Priority</SelectItem>
                      <SelectItem value="Medium">🔵 Medium Priority</SelectItem>
                      <SelectItem value="High">🟠 High Priority</SelectItem>
                      <SelectItem value="Critical">🚨 Critical Event (Aggressive Red Warning)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">Alert Title</label>
                  <Input 
                    placeholder="E.g., Your Payroll Account Approved" 
                    required 
                    value={personalTitle}
                    onChange={(e) => setPersonalTitle(e.target.value)}
                    className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">Alert message Details</label>
                  <Textarea 
                    placeholder="Provide specific message data..." 
                    required 
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    rows={4}
                    className="text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !selectedPersonalUser}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {loading ? "Sending..." : "Submit Private Notification"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* User Log stream */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider">Dispatched Private Alert Ledger</h3>
            
            {getAdminPersonalNotifications().map((notif: any) => {
              const stats = computeReadStats(notif, false);
              return (
                <Card key={notif.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1222] hover:shadow-sm rounded-2xl overflow-hidden font-sans">
                  <CardContent className="p-5 flex justify-between items-start gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8.5px] font-bold">
                          Private Alert
                        </Badge>
                        <Badge className={`${getPriorityBadgeColor(notif.priority || "Medium")} text-[8.5px] font-bold uppercase rounded`}>
                          {notif.priority || "Medium"} Urgency
                        </Badge>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          Recipient: {notif.target_name || "User Account"} ({notif.target_email})
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight mt-1">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold break-words whitespace-pre-wrap mt-0.5">
                        {notif.message}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 select-none">
                      {stats.read > 0 ? (
                        <div className="flex flex-col items-end gap-1 font-mono">
                          <CheckCheck className="w-5 h-5 text-blue-500" />
                          <span className="text-[10px] text-blue-500 font-black">Read</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1 font-mono">
                          <CheckCheck className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-black">Delivered</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {getAdminPersonalNotifications().length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-[#0B1222] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <span className="text-4xl">📨</span>
                <p className="font-bold text-slate-700 dark:text-slate-300 mt-2">Private alerts ledger empty!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Use the autocomplete form panel to draft targeted alerts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* READ RECEIPTS TAB */}
      {activeTab === "receipts" && (
        <div className="space-y-4 font-sans">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">WhatsApp-style Dispatch Checkmarks</p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                One grey check represents sent. Two grey checking stands for delivered. Two blue checkmarks indicates the notice has been read by the target audience.
              </p>
            </div>
            <Badge className="bg-blue-600 text-white font-mono text-[9px]">ACTIVE DISPATCH ENGINE</Badge>
          </div>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1222]">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-white">
                <CheckCheck className="w-5 h-5 text-blue-500" />
                Receipt Audit Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-50 dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-4 font-semibold">Message Title</th>
                      <th className="p-4 font-semibold">Recipient Group</th>
                      <th className="p-4 font-semibold">Priority</th>
                      <th className="p-4 font-semibold">WhatsApp Check</th>
                      <th className="p-4 font-semibold text-right">Circulation / Reads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {/* Render Notices */}
                    {notices.map((n) => {
                      const stats = computeReadStats(n, true);
                      const cleanedTitle = parseNoticeTitle(n.title);
                      
                      return (
                        <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 leading-normal">
                            <p className="font-extrabold text-slate-900 dark:text-white">{cleanedTitle}</p>
                            <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-mono block mt-0.5">ID: {n.id}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] font-sans border-slate-200 bg-transparent text-slate-600">
                              {n.title?.includes("[TARGET:department]") ? `Dept: ${n.target_department || "IT"}` : "Globally Targeted"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getPriorityBadgeColor(n.priority || "Medium")} text-[8px] font-black rounded uppercase`}>
                              {n.priority || "Medium"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {stats.percentage === 100 ? (
                              <div className="flex items-center gap-1.5 text-blue-500 font-mono text-[10px] font-bold">
                                <CheckCheck className="w-5 h-5 text-blue-500" />
                                <span>Read by all</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] font-bold">
                                <CheckCheck className="w-5 h-5 text-slate-400" />
                                <span>Delivered</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenReceiptDetail(n, true)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              <span>{stats.read} / {stats.total} Reads ({stats.percentage}%)</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Render Personal Notifications */}
                    {getAdminPersonalNotifications().map((n: any) => {
                      const stats = computeReadStats(n, false);
                      return (
                        <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4 leading-normal">
                            <p className="font-extrabold text-slate-900 dark:text-white">{n.title}</p>
                            <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-mono block mt-0.5">ID: {n.id}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] font-sans border-emerald-200 bg-transparent text-emerald-700">
                              User: {n.target_name}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getPriorityBadgeColor(n.priority || "Medium")} text-[8px] font-black rounded uppercase`}>
                              {n.priority || "Medium"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {stats.read > 0 ? (
                              <div className="flex items-center gap-1.5 text-blue-500 font-mono text-[10px] font-bold">
                                <CheckCheck className="w-5 h-5 text-blue-500" />
                                <span>Read</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] font-bold">
                                <CheckCheck className="w-5 h-5 text-slate-400" />
                                <span>Delivered</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenReceiptDetail(n, false)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              <span>{stats.read} / {stats.total} Reads</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DETAILED COMMUNICATION ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-6 font-sans">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Categories distribution */}
            <Card className="border border-slate-100 bg-white dark:bg-[#0B1222]">
              <CardHeader>
                <CardTitle className="text-sm font-black flex items-center justify-between">
                  <span>Broadcast Density by Category</span>
                </CardTitle>
                <CardDescription className="text-xs">Aggregate count of system notices delivered this month across organizational lanes.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Read statuses */}
            <Card className="border border-slate-100 bg-white dark:bg-[#0B1222]">
              <CardHeader>
                <CardTitle className="text-sm font-black">Audit Read Rates by Department</CardTitle>
                <CardDescription className="text-xs">Visualizing efficiency metrics tracking how fast personnel acknowledge inbound alerts.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentReadRateData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
                    <XAxis dataKey="name" stroke="#90A4AE" fontSize={10} tickLine={false} />
                    <YAxis stroke="#90A4AE" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Read" fill="#3B82F6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Unread" fill="#EF4444" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1222]">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Organizational Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400">Excellent Response in HR Lane</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Personnel from the Human Resources team achieved a complete 100% notification read rate this week! Compliance notices on workspace code guidelines were opened and logged within 4.5 hours of broadcast.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-extrabold text-xs text-amber-700 dark:text-amber-400">Lagging Read Efficiency on Finance Stream</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed text-amber-800 dark:text-amber-300">
                    Average notification read rate for Corporate Finance stands at 78%. We suggest drafting private security reminders to users who have pending alerts in their inbox dashboard caches.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WHATSAPP READ RECEIPTS DETAIL MODAL */}
      {showReceiptModal && receiptDetailItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-800 dark:text-white">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 leading-none">
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                  Read Receipts Audit
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {parseNoticeTitle(receiptDetailItem.item.title || receiptDetailItem.item.title)}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full p-0 flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                ✕
              </Button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-around text-center bg-slate-50/10">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Circulation</p>
                <p className="text-xl font-black mt-0.5">{receiptDetailItem.stats.total}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Read Receipts</p>
                <p className="text-xl font-black text-blue-500 mt-0.5">{receiptDetailItem.stats.read}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Unread</p>
                <p className="text-xl font-black text-slate-500 mt-0.5">{receiptDetailItem.stats.unread}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Readers */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-[10.5px] font-mono uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">Read By ({receiptDetailItem.readers.length})</span>
                </div>
                <div className="space-y-2.5">
                  {receiptDetailItem.readers.map((user: any) => (
                    <div key={user.id} className="flex justify-between items-center text-xs p-2 bg-slate-50/30 dark:bg-slate-900/40 rounded border border-slate-100 dark:border-slate-800/40">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.email} • {user.department}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{new Date(user.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  {receiptDetailItem.readers.length === 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-center py-2">No recipients have logged read acknowledgements yet.</p>
                  )}
                </div>
              </div>

              {/* Unreaders */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="text-[10.5px] font-mono uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">Pending / Unread ({receiptDetailItem.unreaders.length})</span>
                </div>
                <div className="space-y-2.5">
                  {receiptDetailItem.unreaders.map((user: any) => (
                    <div key={user.id} className="flex justify-between items-center text-xs p-2 bg-slate-50/30 dark:bg-slate-900/40 rounded border border-slate-100 dark:border-slate-800/40">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.email} • {user.department}</p>
                      </div>
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[8.5px] uppercase font-bold pr-1 select-none">
                        Unread
                      </Badge>
                    </div>
                  ))}
                  {receiptDetailItem.unreaders.length === 0 && (
                    <p className="text-[11px] text-slate-505 dark:text-slate-400 italic text-center py-2">All matched recipients have read this bulletin!</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end">
              <Button 
                onClick={() => setShowReceiptModal(false)}
                className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs px-5 py-2 rounded-xl"
              >
                Close Receipt Log
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
