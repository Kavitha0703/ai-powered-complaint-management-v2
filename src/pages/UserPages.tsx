import React, { useEffect, useState, useRef } from "react";

import { useAuth } from "../lib/AuthContext.tsx";
import { supabase } from "../lib/supabase.ts";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { useTheme } from "../components/ThemeProvider.tsx";

import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Clock, CheckCircle2, AlertOctagon, Settings2, Trash2, ArrowRight, ShieldAlert, Check, X, Calendar, 
  Activity, Info, Sparkles, UploadCloud, Paperclip, Camera, RefreshCw, Layers, Star, MessageSquare, 
  ChevronLeft, ChevronRight, CheckSquare, Eye, Edit3, Trash, ShieldCheck, Cpu, Globe, AppWindow, HardDrive,
  Briefcase, Users, DollarSign, CalendarCheck, Key, ShoppingCart, Building, Folder, Settings, Lightbulb,
  Megaphone, Wrench, Search, Mic
} from "lucide-react";
import { SupportAttachment, DraftTicket, UserNotification, TicketComment, StatusHistoryEntry } from "../types.ts";
import { MediaGallery } from "../components/MediaGallery.tsx";
import DcmsCamera from "../components/DcmsCamera.tsx";

export const CATEGORIES = [
  'IT Support',
  'HR Requests',
  'Salary & Payroll',
  'Leave & Attendance',
  'Admin Services',
  'Access & Permissions',
  'Procurement Requests',
  'Facility Management',
  'Department Operations',
  'Project Issues',
  'Security Concerns',
  'Suggestions & Improvements',
  'Other'
];

export const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'IT Support': Cpu,
  'HR Requests': Users,
  'Salary & Payroll': DollarSign,
  'Leave & Attendance': CalendarCheck,
  'Admin Services': Briefcase,
  'Access & Permissions': Key,
  'Procurement Requests': ShoppingCart,
  'Facility Management': Building,
  'Department Operations': Folder,
  'Project Issues': Layers,
  'Security Concerns': ShieldAlert,
  'Suggestions & Improvements': Lightbulb,
  Other: Info,
};

/* ==========================================
   GLOBAL UTILITY HELPER FOR LOCAL STORAGE SYNC
   ========================================== */
function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving storage key ${key}:`, err);
  }
}

/* ==========================================
   1. USER DASHBOARD STATS (RESTRUCTURED)
   ========================================== */
export function UserDashboardStats() {
    
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, critical: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch tickets
    supabase.from('tickets').select('*').eq('user_id', user.id).then(({ data, error }) => {
      if (error) {
        console.error("Dashboard Stats tickets fetch error:", error);
      } else if (data) {
        setStats({
          total: data.length,
          pending: data.filter(c => c.status === 'Pending').length,
          inProgress: data.filter(c => c.status === 'In Progress').length,
          resolved: data.filter(c => c.status === 'Resolved').length,
          critical: data.filter(c => c.severity === 'Critical').length
        });
        setRecent(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3));
      }
    });

    // Fetch notice broadcasts
    supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(2).then(({ data }) => setNotices(data || []));
  }, [user]);

  // Notifications bell triggers
  const notifications: UserNotification[] = getStoredItem("dcms_ticket_notifications_v1", []);
  const myAlerts = notifications.filter(n => n.user_id === user?.id).slice(0, 3);

  // Status transitions/activities logs helper
  const statusHistory: StatusHistoryEntry[] = getStoredItem("dcms_ticket_status_history_v1", []);
  const myActivity = statusHistory.slice(0, 4);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning, " + (dbUser?.name?.split(' ')[0] || 'Team Member') + " ☀️";
    if (hr < 17) return "Good Afternoon, " + (dbUser?.name?.split(' ')[0] || 'Team Member') + " ☕";
    return "Good Evening, " + (dbUser?.name?.split(' ')[0] || 'Team Member') + " 🌙";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs bg-white/15 backdrop-blur border border-white/20 text-cyan-100 font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            {"🚀 2026 PREMIUM WORKSPACE"}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-2 tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-blue-50 max-w-xl text-sm font-medium leading-relaxed">
            {"Monitor and audit all digital operations tickets, track direct SLA parameters, and communicate with dedicated diagnostic specialists in real-time."}</p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-56 h-56 bg-cyan-300/10 rounded-full blur-2xl"></div>
      </div>

      {/* Statistics Cards with counters */}
      <div id="tour-user-kpis" className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { key: "Total", count: stats.total, color: "text-slate-800 dark:text-white border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222]", icon: <FileText className="w-5 h-5 text-blue-500" /> },
          { key: "Pending", count: stats.pending, color: "text-slate-800 dark:text-white border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222]", icon: <Clock className="w-5 h-5 text-amber-500" /> },
          { key: "In Progress", count: stats.inProgress, color: "text-slate-800 dark:text-white border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222]", icon: <Activity className="w-5 h-5 text-blue-500" /> },
          { key: "Resolved", count: stats.resolved, color: "text-slate-800 dark:text-white border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222]", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
          { key: "Critical", count: stats.critical, color: "text-slate-800 dark:text-white border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222]", icon: <AlertOctagon className="w-5 h-5 text-red-500" /> },
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex flex-col justify-between p-5 border rounded-2xl ${item.color} shadow-2xs hover:shadow-sm transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">{item.key}</span>
              {item.icon}
            </div>
            <span className="text-3xl font-black tracking-tight mt-3">{item.count}</span>
          </motion.div>
        ))}
      </div>

      {/* Modern SaaS Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card id="tour-user-chart" className="lg:col-span-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222] shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-850/30">
            <CardTitle className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              {"SLA Compliance and Metric Timeline"}</CardTitle>
            <CardDescription className="text-sm">{"SaaS operational response logs parsed over 5 business days"}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-[240px]">
            {stats.total === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2">
                  <Activity className="w-8 h-8 opacity-20" />
                  <span className="text-xs font-bold font-mono tracking-widest uppercase">{"No Data Records"}</span>
               </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { day: 'Mon', active: Math.max(1, stats.total - 3), resolved: Math.max(1, stats.resolved) },
                { day: 'Tue', Math: 'active', active: Math.max(2, stats.total - 2), resolved: Math.max(2, stats.resolved + 1) },
                { day: 'Wed', active: Math.max(2, stats.total - 1), resolved: Math.max(3, stats.resolved + 2) },
                { day: 'Thu', active: Math.max(1, stats.total), resolved: Math.max(3, stats.resolved + 2) },
                { day: 'Fri', active: Math.max(stats.pending + stats.inProgress, 1), resolved: Math.max(stats.resolved + 4, 4) },
              ]}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/40" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <RechartsTooltip contentStyle={{ background: '#0F172A', borderRadius: '8px', border: '1px solid #1E293B', color: '#F8FAFC', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" name="Active Tickets" dataKey="active" stroke="#3B82F6" fillOpacity={1} fill="url(#colorActive)" />
                <Area type="monotone" name="Resolved Cases" dataKey="resolved" stroke="#10B981" fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222] shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-850/30">
            <CardTitle className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {"SLA Category Audit"}</CardTitle>
            <CardDescription className="text-sm">{"Active and resolved ticket status weights"}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex-grow flex items-center justify-center min-h-[160px]">
            {stats.total === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2">
                  <Activity className="w-8 h-8 opacity-20" />
                  <span className="text-xs font-bold font-mono tracking-widest uppercase">{"No Data Records"}</span>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: stats.pending || 0 },
                      { name: 'In Progress', value: stats.inProgress || 0 },
                      { name: 'Resolved', value: stats.resolved || 0 },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { color: '#D97706' }, // Pending
                      { color: '#2563EB' }, // In Progress
                      { color: '#059669' }, // Resolved
                    ].map((entry, idxCell) => (
                      <Cell key={`cell-${idxCell}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: '#0F172A', borderRadius: '8px', border: '1px solid #1E293B', color: '#F8FAFC', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
            <div className="text-amber-500">{"● Pending ("}{stats.pending})</div>
            <div className="text-blue-500">{"● Progress ("}{stats.inProgress})</div>
            <div className="text-emerald-500">{"● Resolved ("}{stats.resolved})</div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Info columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left and Mid Content Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Open Tickets */}
          <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222] shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
              <CardTitle className="text-lg font-extrabold flex items-center justify-between">
                <span>{"Recent Priority Tickets"}</span>
                <span onClick={() => navigate('/dashboard/my-complaints')} className="text-sm text-blue-500 hover:underline cursor-pointer flex items-center gap-1">
                  {"View All"}<ArrowRight className="w-4 h-4" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-slate-50 dark:divide-slate-800/40">
              {recent.length === 0 ? (
                 <div className="py-8 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                    <Activity className="w-6 h-6 opacity-20" />
                    <span className="text-xs font-bold font-mono tracking-widest uppercase">{"No Recent Records"}</span>
                 </div>
              ) : recent.map((ticket, i) => (
                <div key={ticket.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-450 uppercase">{"Workplace Hub-"}{ticket.id.toString().substring(0, 5).toUpperCase()}</span>
                      <span className={`w-2 h-2 rounded-full ${ticket.severity === 'Critical' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
                      {(() => {
                        const IconComponent = CATEGORY_ICONS[ticket.issue_type] || Info;
                        return <IconComponent className="w-4 h-4 text-blue-500 shrink-0" />;
                      })()}
                      <span>{ticket.issue_type} {"Issue"}</span>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`capitalize font-extrabold text-[10px] ${
                      ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' :
                      'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recent.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">{"No registered tickets found."}</div>
              )}
            </CardContent>
          </Card>

          {/* Activity Logs Timeline */}
          <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222] shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
              <CardTitle className="text-lg font-extrabold">{"Workflow Activity Trail"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="relative border-l border-slate-100 dark:border-slate-800 ml-2.5 pl-6 space-y-4">
                {myActivity.map((log, idx) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-[#0F172A]"></span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {"Ticket status evolved to"}<span className="text-blue-500">{log.to_status}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {"Updated by"}{log.operator} • {new Date(log.changed_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
                {myActivity.length === 0 && (
                  <div className="relative">
                    <span className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-[#0F172A]"></span>
                    <p className="text-sm font-bold text-slate-400">{"Baseline initialized successfully."}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{"Ready to monitor future workflow changes."}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Info and Actions Column */}
        <div className="space-y-6">
          {/* Quick Actions (Dashboard ONLY) */}
          <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222] shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
              <CardTitle className="text-lg font-extrabold">{"Instant Gateways"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Button onClick={() => navigate('/dashboard/register')} className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl h-10 shadow-sm text-sm">
                {"➕ File New Support Case"}</Button>
              <Button onClick={() => navigate('/dashboard/my-complaints')} variant="outline" className="w-full justify-start text-sm rounded-xl h-10 border-slate-200 dark:border-slate-800 font-semibold">
                {"📋 Review Open Tickets"}</Button>
              <Button onClick={() => navigate('/dashboard/drafts')} variant="outline" className="w-full justify-start text-sm rounded-xl h-10 border-slate-200 dark:border-slate-800 font-semibold">
                {"💾 Recover Pending Drafts"}</Button>
            </CardContent>
          </Card>

          {/* Core Bulletins & Notices */}
          <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222] shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
              <CardTitle className="text-base font-extrabold flex justify-between items-center">
                <span>{"Core Notice Bulletin"}</span>
                <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[9px] uppercase">{"Active"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center shrink-0 text-xs">📢</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">{notice.title}</h4>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 line-clamp-3">{notice.message}</p>
                  </div>
                </div>
              ))}
              {notices.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">{"No active bulletins."}</p>
              )}
            </CardContent>
          </Card>
        </div>
      
        {/* Accessibility */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ACCESSIBILITY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"High Contrast Text"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Reduce Motion"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"PRIVACY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Data Sharing"}</span>
              <button className="w-8 h-4 rounded-full bg-blue-500"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Cookie Preferences"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ABOUT"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="text-sm font-black text-slate-900 dark:text-white">{"Workplace Hub"}</div>
            <div className="text-xs text-slate-500">{"Version 4.1.0"}</div>
            <div className="text-xs text-blue-500 hover:underline cursor-pointer">{"Terms of Service"}</div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ==========================================
   2. REDESIGNED COMPLAINT REGISTRATION (RE-ARCHITECTED)
   ========================================== */
const TICKET_TEMPLATES = [
  { icon: "💻", label: "IT Issue", title: "Workstation Terminal Boot Failure", department: "IT", type: "IT Support", desc: "My corporate laptop is failing to complete system boot after the latest software credentials update. It displays error AD_BOOT_404." },
  { icon: "🔑", label: "Access Request", title: "Directory Server Permission Access", department: "IT", type: "Access & Permissions", desc: "Requesting access and write authorization to secure network files.\n\nFolder Path: /shared/operations/2026\nBusiness Reason: " },
  { icon: "💰", label: "Payroll Concern", title: "Monthly Salary Disbursement Discrepancy", department: "Finance", type: "Salary & Payroll", desc: "The June 2026 expense claims or secondary basic package credit has not hit my bank ledger correctly." },
  { icon: "🏢", label: "Facilities Repair", title: "Office Climate Control Thermostat Malfunction", department: "Administration", type: "Facility Management", desc: "The climate controller near desk coordinate B12 is unresponsive, causing temperature issues for the team." },
  { icon: "💡", label: "Suggestion Box", title: "Employee Pantry Software Enhancement Proposal", department: "Administration", type: "Suggestions & Improvements", desc: "Proposal details:\n\nValue benefits:\n" }
];

export function RegisterTicket() {
    
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editState = (location.state as any) || (() => {
    try {
      const saved = localStorage.getItem("dcms_sandbox_prefill");
      if (saved) {
        localStorage.removeItem("dcms_sandbox_prefill");
        return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  })();

  // Primary Fields
  const [title, setTitle] = useState(editState?.title || '');
  const [type, setType] = useState<string>(editState?.issue_type || 'IT Support');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'Urgent' | 'Critical'>(editState?.severity || 'Medium');
  const [department, setDepartment] = useState<string>('IT');
  const [anonymousMode, setAnonymousMode] = useState<boolean>(false);
  const [desc, setDesc] = useState(editState?.description || '');

  // States
  const [attachments, setAttachments] = useState<SupportAttachment[]>(editState?.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionNotification, setSubmissionNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Crash protection & AI States
  const [screenshotAnalyzing, setScreenshotAnalyzing] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [autosaveDraft, setAutosaveDraft] = useState<any>(null);
  const [recoveryPromptVisible, setRecoveryPromptVisible] = useState(false);

  // Ref streams
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceIntervalRef = useRef<any>(null);

  // Draft indicators
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);

  // Viewfinders, lightboxes and cameras
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prefillsLoadedRef = useRef(false);
  const aiAnalysisCache = useRef<Record<string, any>>({});
  const screenshotAnalysisCache = useRef<Record<string, any>>({});

  // On Mounting - check for pending saved drafts and autosaved unsubmitted drafts (crash-protection)
  useEffect(() => {
    // 1. Check manual saved drafts
    const savedDrafts: DraftTicket[] = getStoredItem("dcms_ticket_drafts_v1", []);
    if (savedDrafts.length > 0) {
      setRecoveryAvailable(true);
    }

    // 2. Check automatic crash-autosave
    const autosaveRaw = localStorage.getItem("dcms_ticket_autosave_draft_v1");
    if (autosaveRaw) {
      try {
        const parsed = JSON.parse(autosaveRaw);
        if (parsed && (parsed.title?.trim() || parsed.description?.trim() || parsed.attachments?.length > 0)) {
          setAutosaveDraft(parsed);
          setRecoveryPromptVisible(true);
        }
      } catch (e) {
        console.error("Autosave load error", e);
      }
    }
  }, []);

  // Autosave when form values modify
  useEffect(() => {
    // Avoid autosaving if user is editing an existing ticket (which has editTicketId)
    const stateObj = location.state as any;
    if (stateObj?.editTicketId) return;

    if (title.trim() || desc.trim() || attachments.length > 0) {
      const draftObj = {
        title,
        description: desc,
        issue_type: type,
        severity,
        attachments,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem("dcms_ticket_autosave_draft_v1", JSON.stringify(draftObj));
    }
  }, [title, desc, type, severity, attachments, location.state]);

  // Restore the crash autosave
  const restoreAutosave = () => {
    if (autosaveDraft) {
      if (autosaveDraft.title) setTitle(autosaveDraft.title);
      if (autosaveDraft.description) setDesc(autosaveDraft.description);
      if (autosaveDraft.issue_type) setType(autosaveDraft.issue_type);
      if (autosaveDraft.severity) setSeverity(autosaveDraft.severity);
      if (autosaveDraft.attachments) setAttachments(autosaveDraft.attachments);
    }
    setRecoveryPromptVisible(false);
  };

  const discardAutosave = () => {
    localStorage.removeItem("dcms_ticket_autosave_draft_v1");
    setRecoveryPromptVisible(false);
  };

  // Listen to incoming prefilled state from AI Assistant navigation or sessionStorage
  useEffect(() => {
    if (prefillsLoadedRef.current) return;

    const loadPrefills = () => {
      const stateObj = location.state as any;
      if (stateObj && (stateObj.title || stateObj.issue_type || stateObj.severity || stateObj.description)) {
        prefillsLoadedRef.current = true;
        if (stateObj.title !== undefined) setTitle(stateObj.title);
        if (stateObj.issue_type !== undefined) setType(stateObj.issue_type);
        if (stateObj.severity !== undefined) setSeverity(stateObj.severity);
        if (stateObj.description !== undefined) setDesc(stateObj.description);
        // Clear immediately to prevent auto-fill looping on reload
        window.history.replaceState(null, "");
        try {
          location.state = null;
        } catch (e) {}
        return;
      }

      // Check session storage fallback
      try {
        const stored = sessionStorage.getItem("dcms_ai_draft");
        if (stored) {
          prefillsLoadedRef.current = true;
          const parsed = JSON.parse(stored);
          if (parsed.title !== undefined) setTitle(parsed.title);
          if (parsed.issue_type !== undefined) setType(parsed.issue_type);
          if (parsed.severity !== undefined) setSeverity(parsed.severity);
          if (parsed.description !== undefined) setDesc(parsed.description);
          sessionStorage.removeItem("dcms_ai_draft");
        }
      } catch (e) {
        console.error("Error reading session storage draft:", e);
      }
    };

    loadPrefills();
  }, [location.state]);

  // Sync Draft changes locally in real-time
  const saveAsDraft = () => {
    if (!desc.trim() && !title.trim()) return;

    const drafts: DraftTicket[] = getStoredItem("dcms_ticket_drafts_v1", []);
    const currentId = "draft_" + Date.now();
    const newDraft: DraftTicket = {
      id: currentId,
      issue_type: type,
      severity,
      title: title || "Untitled Draft",
      description: desc,
      attachments,
      updated_at: new Date().toISOString()
    };

    // Keep draft list single/recent
    setStoredItem("dcms_ticket_drafts_v1", [newDraft, ...drafts.filter(d => d.id !== currentId)]);
    setRecoveryAvailable(true);
    
    setSubmissionStatus('success');
    setSubmissionNotification({ type: 'success', message: '🟡 Local Draft Saved Safely' });
    setTimeout(() => {
      setSubmissionStatus('idle');
      setSubmissionNotification(null);
    }, 5000);
  };

  const recoverLatestDraft = () => {
    const drafts: DraftTicket[] = getStoredItem("dcms_ticket_drafts_v1", []);
    if (drafts.length === 0) return;
    const latest = drafts[0];

    setTitle(latest.title);
    setType(latest.issue_type as any);
    setSeverity(latest.severity as any);
    setDesc(latest.description);
    setAttachments(latest.attachments);
    setRecoveryAvailable(false);
  };

  // camera controls
  const startCamera = async (mode = facingMode) => {
    setCameraActive(true);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };
      const ms = await navigator.mediaDevices.getUserMedia(constraints);
      setFacingMode(mode);
      streamRef.current = ms;
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
      }
      
      const list = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = list.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !deviceId) {
        setDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        streamRef.current = ms;
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
        }
        
        const list = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = list.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !deviceId) {
          setDeviceId(videoInputs[0].deviceId);
        }
      } catch (fallbackErr) {
        console.error("Camera access failed:", fallbackErr);
        alert("Unable to access digital camera capture drivers.");
        setCameraActive(false);
      }
    }
  };

  const switchCamera = async (newId: string) => {
    setDeviceId(newId);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const newMs = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: { exact: newId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      streamRef.current = newMs;
      if (videoRef.current) {
        videoRef.current.srcObject = newMs;
      }
    } catch (err) {
      alert("Error switching to selected camera interface.");
    }
  };

  const toggleCameraDirection = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === deviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      switchCamera(devices[nextIndex].deviceId);
    } else {
      const newMode = facingMode === "user" ? "environment" : "user";
      startCamera(newMode);
    }
  };


  const captureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.scale(-1, 1); // mirror reflection for front camera
          ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0); // full resolution before compression

        const fileId = "cam_" + Date.now();
        const newAttachment: SupportAttachment = {
          id: fileId,
          name: `CameraSnapshot_${new Date().toLocaleTimeString().replace(/\s/g, "")}.jpg`,
          type: 'image',
          dataUrl,
          size: Math.round(dataUrl.length * 0.75) // robust estimation
        };

        setAttachments(prev => [...prev, newAttachment]);
        stopCamera();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    setCameraActive(false);
  };

  // Upload actions
  const triggerFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Attachment size limit exceeded (Max 5MB).");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileId = "attachment_" + Date.now();
      
      let attachmentType: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) attachmentType = 'image';
      else if (file.type.startsWith('video/')) attachmentType = 'video';

      const newAttachment: SupportAttachment = {
        id: fileId,
        name: file.name,
        type: attachmentType,
        dataUrl,
        size: file.size
      };

      setAttachments(prev => [...prev, newAttachment]);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
      setSubmissionStatus('error');
      setSubmissionNotification({ type: 'error', message: '❌ Image upload failed.\n\nPlease try another image.' });
      setTimeout(() => setSubmissionNotification(null), 5000);
    };
    reader.readAsDataURL(file);
  };

  const handleAiAnalyze = async () => {
    if (!desc.trim()) {
      alert("Please enter a brief operational description first.");
      return;
    }

    const cacheKey = desc.trim().toLowerCase();
    if (aiAnalysisCache.current[cacheKey]) {
      const cachedData = aiAnalysisCache.current[cacheKey];
      setType(cachedData.category);
      setSeverity(cachedData.priority);
      if (cachedData.optimizedDescription) {
        setDesc(cachedData.optimizedDescription);
      }
      alert(`🤖 [Cached AI Analysis] Gemini AI Support Triage Complete:\n\n• Predicted Category: ${cachedData.category}\n• Assigned Severity: ${cachedData.priority}\n\n• Analysis Logic:\n"${cachedData.rationale}"\n\nForm fields have been successfully auto-triaged using cached prediction results!`);
      return;
    }

    setAiAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc })
      });
      const data = await response.json();
      if (data.status === "unavailable" || data.error) {
        alert(`🤖 ${data.error || "AI Analysis Unavailable"}\n\nTo activate AI services, please specify a valid GEMINI_API_KEY in the application settings interface.`);
        return;
      }

      if (data.category && data.priority) {
        aiAnalysisCache.current[cacheKey] = data; // Store in client-side cache
        setType(data.category);
        setSeverity(data.priority);
        if (data.optimizedDescription) {
          setDesc(data.optimizedDescription);
        }
        alert(`🤖 Gemini AI Support Triage Complete:\n\n• Predicted Category: ${data.category}\n• Assigned Severity: ${data.priority}\n\n• Analysis Logic:\n"${data.rationale}"\n\nForm fields have been successfully auto-triaged and your ticket description text has been professionally optimized!`);
      } else {
        alert("General categorizer failed. Please configure parameters manually.");
      }
    } catch (err) {
      alert("🤖 AI Analysis Unavailable\n\nTo activate AI services, please specify a valid GEMINI_API_KEY in settings.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleScreenshotAnalyze = async () => {
    // Locate first image attachment
    const firstImg = attachments.find(a => a.type === "image");
    if (!firstImg) {
      alert("Please upload an image file or capture a camera snapshot first before using Screenshot Triage Analysis.");
      return;
    }

    // Fast robust key based on length and boundary substring slices of the data URL
    const cacheKey = `${firstImg.dataUrl.length}_${firstImg.dataUrl.substring(0, 100)}_${firstImg.dataUrl.substring(firstImg.dataUrl.length - 100)}`;

    if (screenshotAnalysisCache.current[cacheKey]) {
      const cachedData = screenshotAnalysisCache.current[cacheKey];
      setTitle(cachedData.title);
      setDesc(cachedData.description);
      setType(cachedData.category);
      setSeverity(cachedData.priority);
      alert(`🤖 [Cached Screenshot Analysis] Gemini Screenshot AI Diagnostic:\n\n• Diagnosed Title: ${cachedData.title}\n• Recommended Department: ${cachedData.category}\n• Urgency Level Assigned: ${cachedData.priority}\n\n• Rationale Details:\n"${cachedData.rationale}"\n\nForm fields have been successfully auto-triaged using cached screenshot diagnostic telemetry.`);
      return;
    }

    setScreenshotAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: firstImg.dataUrl })
      });
      if (!response.ok) {
        throw new Error("Diagnosis server busy or unavailable.");
      }
      const data = await response.json();
      if (data.title && data.description) {
        screenshotAnalysisCache.current[cacheKey] = data; // Store in client-side cache
        setTitle(data.title);
        setDesc(data.description);
        setType(data.category);
        setSeverity(data.priority);
        
        alert(`🤖 Gemini Screenshot AI Diagnostic:\n\n• Diagnosed Title: ${data.title}\n• Recommended Department: ${data.category}\n• Urgency Level Assigned: ${data.priority}\n\n• Rationale Details:\n"${data.rationale}"\n\nForm fields have been automatically synchronized with extracted diagnostic telemetry.`);
      } else {
        alert("Screenshot triage failed. No obvious visual system bugs could be identified.");
      }
    } catch (err: any) {
      alert("Failed to analyze screenshot: " + (err.message || err));
    } finally {
      setScreenshotAnalyzing(false);
    }
  };

  // Voice recording & transcription using MediaRecorder & server-side Gemini
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];

      // Animate mic wave levels in real time
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      voiceIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((prev, curr) => prev + curr, 0);
        const avg = sum / dataArray.length;
        setVoiceLevel(avg);
      }, 100);

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      voiceRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          voiceChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(voiceIntervalRef.current);
        if (audioCtx.state !== 'closed') {
          audioCtx.close();
        }

        const audioBlob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size < 100) return; // Silent or canceled

        setVoiceTranscribing(true);
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const rawB64 = reader.result as string;
            const res = await fetch("/api/gemini/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audioData: rawB64,
                mimeType: "audio/webm"
              })
            });
            if (!res.ok) throw new Error("Transcription server error.");
            const data = await res.json();
            if (data.transcript) {
              setDesc(prev => prev ? prev + "\n" + data.transcript : data.transcript);
            }
          } catch (error: any) {
            alert("Voice transcription failed: " + error.message);
          } finally {
            setVoiceTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setVoiceActive(true);
    } catch (err) {
      alert("Microphone access permission denied or disabled.");
    }
  };

  const stopVoiceRecording = () => {
    if (voiceRecorderRef.current && voiceActive) {
      voiceRecorderRef.current.stop();
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setVoiceActive(false);
    setVoiceLevel(0);
  };

  // Final Registration
  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!navigator.onLine) {
      setSubmissionStatus('error');
      setSubmissionNotification({ type: 'error', message: '❌ No internet connection.\n\nPlease check your network and try again.' });
      setTimeout(() => setSubmissionNotification(null), 5000);
      return;
    }

    if (!user) {
      setSubmissionStatus('error');
      setSubmissionNotification({ type: 'error', message: '❌ Your session has expired.\n\nPlease log in again.' });
      setTimeout(() => setSubmissionNotification(null), 5000);
      return;
    }

    if (!title.trim()) {
      setSubmissionStatus('error');
      setSubmissionNotification({ type: 'error', message: '❌ Title is required.' });
      setTimeout(() => setSubmissionNotification(null), 5000);
      return;
    }

    if (!desc.trim()) {
      setSubmissionStatus('error');
      setSubmissionNotification({ type: 'error', message: '❌ Please enter a complaint description.' });
      setTimeout(() => setSubmissionNotification(null), 5000);
      return;
    }

    setSubmitting(true);
    setSubmissionStatus('idle');
    setSubmissionNotification(null);
    try {
      // Create comprehensive serialized description payload that preserves the Title natively
      let structuredParagraph = `[SaaS_TITLE: ${title}]\n[DEPT: ${department}]\n`;
      if (anonymousMode) {
        structuredParagraph += `[ANONYMOUS: true]\n`;
      }
      structuredParagraph += `\n${desc}`;

      console.log('--- DB TRACE: PRE-INSERT ---');
      console.log('AuthContext user object:', user);
      console.log('Target user_id mapped to ticket:', user?.id);

      console.log("CURRENT USER:", user);
      let response;
      if (editState?.editTicketId) {
        response = await supabase.from('tickets').update({
          issue_type: type,
          severity,
          description: structuredParagraph,
        }).eq('id', editState.editTicketId).select();
      } else {
        response = await supabase.from('tickets').insert([{
          user_id: user?.id,
          issue_type: type,
          severity,
          description: structuredParagraph,
          status: 'Pending'
        }]).select();
      }

      const { data, error } = response;
      if (error) throw error;

      if (data && data.length > 0) {
        const ticketId = data[0].id;
        
        // Final upload phase compression
        const compressedAttachments = await Promise.all(attachments.map(async (att) => {
          if (att.type === 'image' && att.dataUrl && att.dataUrl.length > 500000) {
            return new Promise<SupportAttachment>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress to 60% quality
                  resolve({ ...att, dataUrl: compressedDataUrl, size: Math.round(compressedDataUrl.length * 0.75) });
                } else {
                  resolve(att);
                }
              };
              img.onerror = () => resolve(att);
              img.src = att.dataUrl;
            });
          }
          return att;
        }));

        // Save attachments in storage
        setStoredItem(`dcms_ticket_attachments_${ticketId}`, compressedAttachments);
        
        // Log status change to Status History
        const list: StatusHistoryEntry[] = getStoredItem("dcms_ticket_status_history_v1", []);
        const entry: StatusHistoryEntry = {
          id: "hist_" + Date.now(),
          ticket_id: ticketId,
          from_status: editState?.editTicketId ? editState.severity : "None",
          to_status: editState?.editTicketId ? `${severity} (Edited)` : "Pending",
          changed_at: new Date().toISOString(),
          operator: "Client User"
        };
        setStoredItem("dcms_ticket_status_history_v1", [entry, ...list]);

        // Clean out drafts
        const savedDrafts: DraftTicket[] = getStoredItem("dcms_ticket_drafts_v1", []);
        setStoredItem("dcms_ticket_drafts_v1", savedDrafts.filter(d => d.description !== desc));

        setSubmissionStatus('success');
        setSubmissionNotification({ type: 'success', message: editState?.editTicketId ? "🟢 Ticket Details Updated Successfully" : "🟢 Ticket Submitted" });
        
        // Slightly delay navigation so the green state reward can be felt
        setTimeout(() => {
          navigate("/dashboard/my-complaints");
        }, 1805);
      } else {
        throw new Error("No data returned from save operation.");
      }
    } catch (err: any) {
      setSubmissionStatus('error');
      
      console.error("FULL TICKET ERROR:", err);
      console.error("ERROR MESSAGE:", err?.message);
      console.error("ERROR DETAILS:", err?.details);
      console.error("ERROR HINT:", err?.hint);

      let message = err.message || JSON.stringify(err);
      let displayMessage = `🔴 Failed To Submit: ${message}`;
      
      if (message.includes("schema cache")) {
        displayMessage = "❌ Unable to submit complaint.\n\nReason:\nComplaint database table not found.\n\nPlease contact the system administrator.";
      } else if (message.includes("permission") || message.includes("policy") || message.includes("row-level security")) {
        displayMessage = "❌ You do not have permission to create complaints.\n\nPlease log back in or contact an administrator.";
      } else if (message.includes("Failed to fetch")) {
        displayMessage = "❌ Network Error (Failed to fetch).\n\nThis usually means:\n1. Your internet connection dropped.\n2. An AdBlocker or VPN is blocking the database request.\n3. Supabase URL is incorrect.";
      }
      
      setSubmissionNotification({ type: 'error', message: displayMessage });
      setTimeout(() => {
        setSubmissionStatus('idle');
        setSubmissionNotification(null);
      }, 8000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Crash Protection Draft Auto-recovering Banner */}
      {recoveryPromptVisible && autosaveDraft && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-emerald-50/90 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold"
        >
          <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg text-sm">🛡️</span>
            <div>
              <p className="font-bold">{"Unsaved Draft Recovered!"}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{"Subject: \""}{autosaveDraft.title || 'Untitled'}{"\" (Autosaved"}{new Date(autosaveDraft.updated_at).toLocaleTimeString()})</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={restoreAutosave} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 rounded-xl px-4 text-xs">{"Restore Progress"}</Button>
            <Button onClick={discardAutosave} size="sm" variant="ghost" className="h-8 rounded-xl text-slate-500 hover:text-slate-700">{"Wipe Draft"}</Button>
          </div>
        </motion.div>
      )}

      {/* Recovery Banner for Manual Saved Drafts */}
      {recoveryAvailable && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-50/70 dark:bg-indigo-950/15 border border-indigo-150 dark:border-indigo-900/40 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold"
        >
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Layers className="w-4.5 h-4.5 animate-bounce" />
            <span>{"Unfinished ticket draft discovered inside this workspace. Would you like to recover it?"}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={recoverLatestDraft} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 rounded-xl px-4">{"Recover"}</Button>
            <Button onClick={() => setRecoveryAvailable(false)} size="sm" variant="ghost" className="h-8 rounded-xl text-indigo-500">{"Dismiss"}</Button>
          </div>
        </motion.div>
      )}

      {/* Grid structure: Left dynamic preview card, Right details form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Live Preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{"Real-time Ticket Preview"}</h3>
          
          <Card className="border border-slate-200/80 dark:border-[#1E293B] shadow-lg rounded-2xl overflow-hidden bg-white dark:bg-[#0B1222] backdrop-blur-xl">
            <div className="h-2 w-full bg-blue-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">{"TICKET_PREVIEW"}</span>
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 font-semibold flex items-center gap-1">
                    {(() => {
                      const IconComponent = CATEGORY_ICONS[type] || Info;
                      return <IconComponent className="w-3.5 h-3.5 text-blue-500" />;
                    })()}
                    <span>{type} {"Department Queue"}</span>
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] tracking-wide px-2.5 py-0.5 capitalize font-extrabold ${
                  severity === 'Critical' ? 'bg-red-50 text-red-650 border-red-250 animate-bounce' :
                  severity === 'Urgent' ? 'bg-orange-50 text-orange-650 border-orange-250' :
                  severity === 'Medium' ? 'bg-yellow-50 text-yellow-650 border-yellow-250' :
                  'bg-green-50 text-green-650 border-green-250'
                }`}>
                  {severity} {"Alert"}</Badge>
              </div>

              {/* Title output */}
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">
                {title.trim() ? title : "Incident Subject Title..."}
              </h4>

              {/* Description output */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap min-h-24 max-h-36 overflow-y-auto italic">
                {desc.trim() ? desc : "Detailed issue logs, environment variables and failure indicators typed will display here in real-time live preview..."}
              </p>

              {/* Seamless Media Gallery Preview */}
              {attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                    <span>{"Diagnostics Gallery PREVIEW"}</span>
                  </div>
                  <MediaGallery attachments={attachments} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Interactive Detail forms */}
        <div className="lg:col-span-7">
          <Card className="border-slate-200/80 dark:border-[#1E293B] shadow-md rounded-2xl bg-white dark:bg-[#0B1222]">
            <CardContent className="p-6 space-y-6">
              
              {/* Form Heading description */}
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{"Submit Incident File"}</h2>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">{"Include exact parameters, screenshot telemetry snapshots, and let Gemini AI classify routing parameters."}</p>
              </div>

              {/* Ticket Templates Quick Select */}
              <div className="bg-slate-50 dark:bg-slate-900/25 border border-slate-150 dark:border-slate-800/80 p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500">{"⚡ Click a template to instantly prefill:"}</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {TICKET_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setTitle(tpl.title);
                        setType(tpl.type);
                        setDepartment(tpl.department);
                        setDesc(tpl.desc);
                      }}
                      className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors py-1 px-2.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <span>{tpl.icon}</span> {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmission} className="space-y-6">
                
                {/* Section 1: Ticket Details */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800/80 pb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B5CF6]">{"Step 1: Incident Description"}</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">{"Incident Subject Title"}</label>
                    <Input 
                      id="tour-ticket-title"
                      placeholder={"E.g., Wireless printer offline after software firmware update"} 
                      value={title} 
                      onChange={e => setTitle(e.target.value)}
                      required 
                      className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">{"Target Segment"}</label>
                      <Select value={type} onValueChange={(val: any) => setType(val)}>
                        <SelectTrigger id="tour-ticket-segment" className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">{"Urgency Severity"}</label>
                      <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                        <SelectTrigger id="tour-ticket-severity" className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                          {['Low', 'Medium', 'Urgent', 'Critical'].map(sev => (
                            <SelectItem key={sev} value={sev} className="text-xs">{sev}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">{"Department"}</label>
                    <Select value={department} onValueChange={(val) => setDepartment(val)}>
                      <SelectTrigger id="tour-ticket-department" className="h-10 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800">
                        <SelectValue placeholder={"Select relevant department"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                        {['IT', 'HR', 'Finance', 'Operations', 'Administration', 'Procurement', 'Security'].map(dept => (
                          <SelectItem key={dept} value={dept} className="text-xs">{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">{"Operational Log Details"}</label>
                      <button
                        type="button"
                        onClick={voiceActive ? stopVoiceRecording : startVoiceRecording}
                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
                          voiceActive 
                            ? "bg-red-650 border-red-500 text-white animate-pulse" 
                            : "bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-850 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                        }`}
                        title={voiceActive ? "Click to Stop Audio Recording and Auto-Type" : "Press to Speak operational logs & dictate"}
                      >
                        <Mic className={`w-3.5 h-3.5 ${voiceActive ? "text-white" : "text-blue-500"}`} />
                        {voiceTranscribing ? (
                          <span className="animate-pulse">{"Transcribing Voice..."}</span>
                        ) : voiceActive ? (
                          <span className="flex items-center gap-1">
                            {"Recording..."}<span>{"🎤 Level:"}{voiceLevel.toFixed(0)}</span>
                          </span>
                        ) : (
                          <span>{"Speech-to-Text Dictation"}</span>
                        )}
                      </button>
                    </div>

                    {voiceActive && (
                      <div className="mb-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-[10px] text-red-650 dark:text-red-400">
                        <div className="flex gap-0.5 items-center shrink-0">
                          <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: Math.max(4, voiceLevel / 2) + "px", animationDelay: '0.1s' }} />
                          <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: Math.max(8, voiceLevel) + "px", animationDelay: '0.3s' }} />
                          <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: Math.max(4, voiceLevel / 1.5) + "px", animationDelay: '0.5s' }} />
                        </div>
                        <span>{"Speak clearly. Clicking again will finalize audio recording and run transcription."}</span>
                      </div>
                    )}

                    <Textarea 
                      id="tour-ticket-desc"
                      placeholder={"Describe the issue, diagnostics logs, or steps leading to the malfunction..."}
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      required
                      className="min-h-32 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 resize-none"
                    />
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2.5 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={anonymousMode}
                            onChange={(e) => setAnonymousMode(e.target.checked)}
                            className="peer sr-only" 
                          />
                          <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-850 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
                            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{"Submit Request Anonymously"}</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={aiAnalyzing || !desc.trim()}
                        onClick={handleAiAnalyze}
                        className="bg-blue-50/50 dark:bg-blue-950/15 text-blue-600 dark:text-blue-400 hover:bg-blue-50 text-[10px] font-bold h-8 px-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30 shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        {aiAnalyzing ? "Triage Predicting..." : "Let Gemini Analyze & Categorize"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Section 2: Upload Actions & Snapshots */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800/80 pb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B5CF6]">{"Step 2: Supporting Attachments"}</span>
                  </div>

                  {/* Virtual Drag and Drop selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Drag and drop panel */}
                    <div 
                      id="tour-ticket-attachments"
                      onClick={() => document.getElementById('register-attachments-input')?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/50 dark:bg-[#161F30]/35 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer flex flex-col items-center justify-center text-center transition-all"
                    >
                      <input 
                        id="register-attachments-input" 
                        type="file" 
                        multiple 
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                        className="hidden" 
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          files.forEach(f => triggerFileUpload(f));
                        }}
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">{"Browse Diagnostic Documents"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{"Images, PDFs, TXT, ZIP or Video clips up to 5MB"}</p>
                    </div>

                    {/* Camera view active switcher */}
                    <div 
                      id="tour-ticket-camera"
                      onClick={() => { if (!cameraActive) setCameraActive(true); }}
                      className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/50 dark:bg-[#161F30]/35 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer flex flex-col items-center justify-center text-center transition-all"
                    >
                      <Camera className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">{"Use Digital Live Camera"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{"Take snapshots of hardware failures live"}</p>
                    </div>
                  </div>

                  {/* Active Camera Viewfinder module */}
                  {cameraActive && (
                    <DcmsCamera 
                      onClose={() => setCameraActive(false)}
                      onCapturePhotos={(photos) => {
                        setAttachments(prev => [...prev, ...photos]);
                        setCameraActive(false);

                        // Extract AI Predictions and OCR from captured snapshot to autofill form
                        const firstPhoto = photos[0];
                        if (firstPhoto) {
                          const meta = (firstPhoto as any).suggestedMeta;
                          if (meta) {
                            if (meta.title) setTitle(meta.title);
                            if (meta.category) setType(meta.category);
                            if (meta.severity) setSeverity(meta.severity as any);
                          }
                          
                          const ocr = (firstPhoto as any).ocrText;
                          if (ocr) {
                            setDesc(prev => {
                              const base = prev.trim();
                              const ocrBlock = `\n\n--- [AI Camera OCR Text Extracted] ---\n${ocr}`;
                              return base ? `${base}${ocrBlock}` : ocrBlock.trim();
                            });
                          }
                        }
                      }}
                    />
                  )}

                  {/* HIGH-END MULTIMEDIA ATTACHMENTS GALLERY */}
                  {attachments.length > 0 && (
                    <div className="bg-slate-50/50 dark:bg-[#161F30]/15 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800 pb-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{"Loaded Incident Attachments ("}{attachments.length})</span>
                        {attachments.some(a => a.type === 'image') && (
                          <Button
                            type="button"
                            onClick={handleScreenshotAnalyze}
                            disabled={screenshotAnalyzing}
                            className="bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-950/20 text-[10px] font-extrabold h-6 px-2 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                            {screenshotAnalyzing ? "AI Analyzing Screenshot..." : "AI Triage Screenshot"}
                          </Button>
                        )}
                      </div>
                      <MediaGallery 
                        attachments={attachments} 
                        onDelete={(id) => setAttachments(prev => prev.filter(att => att.id !== id))} 
                        allowEdit={true} 
                      />
                    </div>
                  )}
                </div>

                {/* Submitting controls */}
                {submissionNotification && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className={`p-3.5 rounded-xl border text-xs font-bold w-full leading-relaxed flex items-center justify-between gap-3 shadow-xs ${
                      submissionNotification.type === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' 
                        : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 whitespace-pre-wrap">
                      <span>{submissionNotification.message}</span>
                    </div>
                    {submissionNotification.type === 'error' && (
                      <span className="text-[10px] bg-red-100 dark:bg-red-950/50 text-red-650 px-2 py-0.5 rounded-lg shrink-0">{"5s Limit"}</span>
                    )}
                  </motion.div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      onClick={saveAsDraft}
                      disabled={!desc.trim() && !title.trim()}
                      variant="outline" 
                      className="text-xs border-slate-200 dark:border-slate-800 h-10 px-4 rounded-xl font-bold"
                    >
                      {"Save Local Draft"}</Button>
                    <Button 
                      type="button" 
                      onClick={() => {
                        setTitle(''); setDesc(''); setAttachments([]);
                      }}
                      variant="ghost" 
                      className="text-xs h-10 px-4 rounded-xl text-slate-400 hover:text-red-500"
                    >
                      {"Discard"}</Button>
                  </div>
                  <Button 
                    id="tour-ticket-submit"
                    type="submit" 
                    disabled={submitting || uploading || submissionStatus === 'success'}
                    className={`w-full sm:w-auto h-10 px-8 font-bold tracking-tight rounded-xl text-xs transition-all duration-300 ${
                      submissionStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                      submissionStatus === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {submitting ? 'Dispatching Ticket Code...' : 
                     submissionStatus === 'success' ? '✓ Submitted Successfully' :
                     submissionStatus === 'error' ? '✕ Not Submitted' :
                     'Create Ticket File'}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

      
        {/* Accessibility */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ACCESSIBILITY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"High Contrast Text"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Reduce Motion"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"PRIVACY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Data Sharing"}</span>
              <button className="w-8 h-4 rounded-full bg-blue-500"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Cookie Preferences"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ABOUT"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="text-sm font-black text-slate-900 dark:text-white">{"Workplace Hub"}</div>
            <div className="text-xs text-slate-500">{"Version 4.1.0"}</div>
            <div className="text-xs text-blue-500 hover:underline cursor-pointer">{"Terms of Service"}</div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ==========================================
   3. SAVE DRAFT COMPLAINTS LIST (PHASE 8 EXTRA)
   ========================================== */
export function DraftTickets() {
    
  const [drafts, setDrafts] = useState<DraftTicket[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setDrafts(getStoredItem("dcms_ticket_drafts_v1", []));
  }, []);

  const clearDraft = (id: string, e: any) => {
    e.stopPropagation();
    const updated = drafts.filter(d => d.id !== id);
    setStoredItem("dcms_ticket_drafts_v1", updated);
    setDrafts(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{"Draft Tickets"}</h2>
        <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-bold">{"Saved but NOT submitted. Visible only to you."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drafts.map((d) => (
          <Card 
            key={d.id} 
            onClick={() => {
              // Recover by loading into cache then navigating to form
              const list: DraftTicket[] = getStoredItem("dcms_ticket_drafts_v1", []);
              setStoredItem("dcms_ticket_drafts_v1", [d, ...list.filter(item => item.id !== d.id)]);
              navigate("/dashboard/register", {
                state: {
                  title: d.title,
                  description: d.description,
                  issue_type: d.issue_type,
                  severity: d.severity,
                  attachments: d.attachments || []
                }
              });
            }}
            className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1222] hover:shadow-lg transition-transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary" className="capitalize font-bold text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100">{d.issue_type}</Badge>
                <button onClick={(e) => clearDraft(d.id, e)} className="text-slate-400 hover:text-red-500 font-bold">{"✕ Delete"}</button>
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{d.title}</h4>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed italic">{"&ldquo;"}{d.description}{"&rdquo;"}</p>
              
              <div className="content-end mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40 text-[10px] text-slate-400 font-semibold flex justify-between">
                <span>{"Attachments:"}{d.attachments?.length || 0}</span>
                <span>{"Mod:"}{new Date(d.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {drafts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-[#0B1222] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <span className="text-4xl mb-4">💾</span>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{"Workspace Draft Empty"}</h4>
            <p className="text-[#94A3B8] max-w-sm mx-auto mb-6 text-sm">
              {"When creating a ticket, choose 'Save Local Draft' to prevent operational work loss."}</p>
            <Button onClick={() => navigate('/dashboard/register')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md rounded-xl">
              {"File New Ticket"}</Button>
          </div>
        )}
      
        {/* Accessibility */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ACCESSIBILITY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"High Contrast Text"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Reduce Motion"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"PRIVACY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Data Sharing"}</span>
              <button className="w-8 h-4 rounded-full bg-blue-500"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Cookie Preferences"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ABOUT"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="text-sm font-black text-slate-900 dark:text-white">{"Workplace Hub"}</div>
            <div className="text-xs text-slate-500">{"Version 4.1.0"}</div>
            <div className="text-xs text-blue-500 hover:underline cursor-pointer">{"Terms of Service"}</div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ==========================================
   4. SEPARATE USER ACTION NOTIFICATIONS (PHASE 5/8)
   ========================================== */
export function UserNotificationsView() {
    
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<UserNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<"All" | "Tickets" | "Notices" | "Approvals" | "AI Recommendations">("All");

  const loadNotificationsLog = () => {
    const list: UserNotification[] = getStoredItem("dcms_ticket_notifications_v1", []);
    const matching = list.filter(n => n.user_id === user?.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifs(matching);
  };

  const getNotificationCategory = (n: UserNotification): "Tickets" | "Notices" | "Approvals" | "AI Recommendations" => {
    const t = n.title.toLowerCase();
    const m = n.message.toLowerCase();
    if (t.includes("ai") || t.includes("gemini") || t.includes("recomm") || m.includes("ai") || m.includes("triage")) {
      return "AI Recommendations";
    }
    if (t.includes("notice") || t.includes("announce") || m.includes("notice") || m.includes("broadcast")) {
      return "Notices";
    }
    if (t.includes("approv") || m.includes("approv") || t.includes("signoff") || m.includes("signoff")) {
      return "Approvals";
    }
    return "Tickets";
  };

  useEffect(() => {
    loadNotificationsLog();
  }, [user]);

  const markRead = (id: string) => {
    const list: UserNotification[] = getStoredItem("dcms_ticket_notifications_v1", []);
    const modified = list.map(n => n.id === id ? { ...n, unread: false } : n);
    setStoredItem("dcms_ticket_notifications_v1", modified);
    loadNotificationsLog();
  };

  const deleteNotif = (id: string) => {
    const list: UserNotification[] = getStoredItem("dcms_ticket_notifications_v1", []);
    const modified = list.filter(n => n.id !== id);
    setStoredItem("dcms_ticket_notifications_v1", modified);
    loadNotificationsLog();
  };

  const filteredNotifs = notifs.filter(n => {
    if (activeCategory === "All") return true;
    return getNotificationCategory(n) === activeCategory;
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{"Support Alerts & Notifications"}</h2>
        <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">{"Review dedicated system responses, administrative viewing updates, and ticket remarks directed to your account."}</p>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
        {(["All", "Tickets", "Notices", "Approvals", "AI Recommendations"] as const).map(cat => {
          const count = cat === "All" ? notifs.length : notifs.filter(n => getNotificationCategory(n) === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`py-1.5 px-3.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeCategory === cat 
                  ? "bg-blue-500 text-white shadow-xs" 
                  : "bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350"
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === cat ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3.5">
        {filteredNotifs.map((item) => (
          <div 
            key={item.id} 
            className={`border rounded-xl p-4.5 transition-all flex justify-between gap-4 items-start ${
              item.unread 
                ? "bg-blue-50/15 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/40 shadow-2xs" 
                : "bg-white dark:bg-[#0B1222] border-slate-100 dark:border-slate-850"
            }`}
          >
            <div className="flex gap-3 min-w-0">
              <span className="text-base shrink-0 p-1 rounded-lg bg-blue-50/50 dark:bg-[#162137]/30 text-blue-500 font-semibold leading-normal">🔔</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2">
                  {item.title}
                  {item.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">{item.message}</p>
                <span className="text-[9.5px] font-semibold text-slate-455 font-mono block mt-2">{new Date(item.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="flex gap-2.5 shrink-0">
              {item.unread && (
                <button onClick={() => markRead(item.id)} className="text-[10px] text-blue-600 hover:underline font-bold">{"Mark Read"}</button>
              )}
              <button onClick={() => deleteNotif(item.id)} className="text-[10.5px] text-slate-400 hover:text-red-500">{"✕ Delete"}</button>
            </div>
          </div>
        ))}

        {filteredNotifs.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-[#0B1222] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <span className="text-4xl mb-4">📭</span>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{"Notice Cache Empty"}</h4>
            <p className="text-[#94A3B8] max-w-sm mx-auto text-sm">
              {"No notifications exist for category '"}{activeCategory}{"' currently."}</p>
          </div>
        )}
      
        {/* Accessibility */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ACCESSIBILITY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"High Contrast Text"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Reduce Motion"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"PRIVACY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Data Sharing"}</span>
              <button className="w-8 h-4 rounded-full bg-blue-500"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Cookie Preferences"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ABOUT"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="text-sm font-black text-slate-900 dark:text-white">{"Workplace Hub"}</div>
            <div className="text-xs text-slate-500">{"Version 4.1.0"}</div>
            <div className="text-xs text-blue-500 hover:underline cursor-pointer">{"Terms of Service"}</div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ==========================================
   5. MY COMPLAINTS LIST WITH DETAILS (PHASE 3/4 STATUS PROGRESSION)
   ========================================== */
export function MyTickets() {
    
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // States
  const [supplementaryNote, setSupplementaryNote] = useState('');
  const [escalatedTickets, setEscalatedTickets] = useState<Record<string, boolean>>({});
  
  // SATISFACTION FEEDBACK (PHASE 9)
  const [starRating, setStarRating] = useState<number>(0);
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [ratingDraftDesc, setRatingDraftDesc] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState<Record<string, boolean>>(() => {
    return getStoredItem("dcms_ticket_ratings_v1", {});
  });

  const [localTimeLineNotes, setLocalTimeLineNotes] = useState<Record<string, TicketComment[]>>(() => {
    return getStoredItem("dcms_ticket_comments_v2", {});
  });

  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    setStoredItem("dcms_ticket_comments_v2", localTimeLineNotes);
  }, [localTimeLineNotes]);

  // Load tickets list from db
  const loadTicketData = () => {
    if (!user) return;
    supabase.from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Supabase Database Retrieval Error (MyTickets):", error);
          alert(`❌ Database Access Alert: Unable to fetch tickets from storage.\n\nDetails: ${error.message}\nCode: ${error.code}`);
        } else {
          setTickets(data || []);
        }
      });
  };

  useEffect(() => {
    loadTicketData();
  }, [user]);

  // Retrieve AI summary for active drawer
  useEffect(() => {
    if (!selectedTicket) return;
    setAiSummary('');
    setLoadingSummary(true);

    const baseDescription = parseTicketDescription(selectedTicket.description).description;

    fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: baseDescription })
    })
    .then(res => res.json())
    .then(data => {
      setAiSummary(data.summary || "Summary generation failure.");
    })
    .catch(() => {
      setAiSummary("AI summarizer model offline.");
    })
    .finally(() => {
      setLoadingSummary(false);
    });
  }, [selectedTicket]);

  // Helper: parse Title and Description out of serialized structure
  const parseTicketDescription = (descString: string) => {
    let title = "Operations Request";
    let department = "Operations";
    let anonymous = false;
    let description = descString || "";

    if (descString && descString.startsWith("[SaaS_TITLE:")) {
      const parts = descString.split('\n');
      
      const descLines = [];
      for (const line of parts) {
        if (line.startsWith("[SaaS_TITLE: ")) {
          title = line.replace("[SaaS_TITLE: ", "").replace("]", "");
        } else if (line.startsWith("[DEPT: ")) {
          department = line.replace("[DEPT: ", "").replace("]", "");
        } else if (line.startsWith("[ANONYMOUS: true]")) {
          anonymous = true;
        } else {
          descLines.push(line);
        }
      }
      description = descLines.join('\n').trim();
    }
    return { title, department, anonymous, description };
  };

  const handleEscalate = (id: string) => {
    setEscalatedTickets(prev => ({ ...prev, [id]: true }));
    // Log to Status History
    const list: StatusHistoryEntry[] = getStoredItem("dcms_ticket_status_history_v1", []);
    const entry: StatusHistoryEntry = {
      id: "hist_" + Date.now(),
      ticket_id: id,
      from_status: "Urgent",
      to_status: "Critical (Escalated)",
      changed_at: new Date().toISOString(),
      operator: "Client User"
    };
    setStoredItem("dcms_ticket_status_history_v1", [entry, ...list]);

    // Send comment/notification
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const commentsCopy = { ...localTimeLineNotes };
    const existing = commentsCopy[id] || [];
    existing.push({
      id: "comm_" + Date.now(),
      ticket_id: id,
      text: "⚠️ PRIORITY ESCALATION: Client user requested emergency queue acceleration. Urgency flagged as CRITICAL.",
      sender: 'user',
      time: timeStr,
      timestamp: Date.now()
    });
    commentsCopy[id] = existing;
    setLocalTimeLineNotes(commentsCopy);
    alert("Emergency escalation dispatched! Ticket marked as Critical alert.");
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplementaryNote.trim() || !selectedTicket) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = { ...localTimeLineNotes };
    const existing = updated[selectedTicket.id] || [];
    existing.push({
      id: "comm_" + Date.now(),
      ticket_id: selectedTicket.id,
      text: supplementaryNote,
      sender: 'user',
      time: timeStr,
      timestamp: Date.now()
    });
    updated[selectedTicket.id] = existing;
    setLocalTimeLineNotes(updated);
    setSupplementaryNote('');
  };

  // Delete Action Gate (Lockout Phase 4 rule)
  const handleDeleteTicket = async (ticket: any) => {
    // Phase 4 Lockout: Allow deleting ONLY if Pending and NOT viewed by Admin
    const isViewed = ticket.isViewedByAdmin === true || ticket.status !== 'Pending';

    if (isViewed) {
      alert("🔒 Security Lock: This ticket belongs to active review cycles and cannot be deleted.");
      return;
    }

    if (confirm("Are you absolutely sure you want to discard this ticket file?")) {
      try {
        await supabase.from('tickets').delete().eq('id', ticket.id);
        alert("Support file discarded cleanly from database indices.");
        setSelectedTicket(null);
        loadTicketData();
      } catch (err) {
        alert("Failed deletion.");
      }
    }
  };

  // Submit Rating Score (Phase 9)
  const submitSatisfactionRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (starRating === 0) {
      alert("Please select a star rating first.");
      return;
    }

    const ratingsLog = { ...ratingSubmitted };
    ratingsLog[selectedTicket.id] = true;
    setStoredItem("dcms_ticket_ratings_v1", ratingsLog);
    setRatingSubmitted(ratingsLog);

    // Save actual rating results
    const savedScores = getStoredItem<Array<{ ticketId: string, value: number, desc: string }>>("dcms_scorecard_results_v1", []);
    savedScores.push({
      ticketId: selectedTicket.id,
      value: starRating,
      desc: ratingDraftDesc
    });
    setStoredItem("dcms_scorecard_results_v1", savedScores);

    alert("Feedback sent successfully! Thank you for rating our operations speed.");
    setStarRating(0);
    setRatingDraftDesc('');
  };

  // Compute remaining timer metrics
  const getSLAString = (created_at: string, sev: string, status: string) => {
    const limits: Record<string, number> = { 'Low': 48, 'Medium': 24, 'Urgent': 12, 'Critical': 4 };
    const hoursLimit = limits[sev] || 24;
    const limitMs = new Date(created_at).getTime() + (hoursLimit * 60 * 60 * 1000);
    const rem = limitMs - Date.now();

    if (status === 'Resolved') return { label: "SLA Targets fully achieved", met: true, expired: false, pct: 100 };
    if (rem <= 0) return { label: "⚠️ SLA target threshold breached", met: false, expired: true, pct: 0 };

    const hours = Math.floor(rem / (1000 * 60 * 60));
    const mins = Math.floor((rem % (1000 * 60 * 60)) / (1000 * 60));
    const pct = Math.round((rem / (hoursLimit * 60 * 60 * 1000)) * 100);

    return { label: `SLA Target window: ${hours}h ${mins}m remaining`, met: true, expired: false, pct };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-805 dark:text-white tracking-tight">{"Active Portal Support Tickets"}</h2>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">{"Audit active progress lines, check SLA target compliance, recover ticket previews and add remarks."}</p>
      </div>

      {/* Grid of registered cases */}
      <div id="tour-user-track" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((c) => {
          const isEscalated = escalatedTickets[c.id];
          const currSeverity = isEscalated ? 'Critical' : c.severity;
          const parsed = parseTicketDescription(c.description);

          const isViewed = c.isViewedByAdmin === true || c.status !== 'Pending';

          return (
            <div 
              key={c.id}
              onClick={() => setSelectedTicket(c)}
              className="border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800 p-5.5 rounded-2xl bg-white dark:bg-[#0B1222] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-[9.5px] font-mono font-bold text-slate-450 uppercase">{"Workplace Hub-"}{c.id.toString().substring(0, 5).toUpperCase()}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`capitalize font-bold text-[9px] ${
                      currSeverity === 'Critical' ? 'bg-red-50 text-red-600 border-red-250' :
                      currSeverity === 'Urgent' ? 'bg-orange-50 text-orange-600 border-orange-250' :
                      currSeverity === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-250' :
                      'bg-green-50 text-green-600 border-green-250'
                    }`}>
                      {currSeverity}
                    </Badge>
                    <Badge variant="outline" className={`capitalize font-bold text-[9px] ${
                      c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-250' :
                      c.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-250 animate-pulse' :
                      'bg-amber-50 text-amber-600 border-amber-250'
                    }`}>
                      {c.status}
                    </Badge>
                  </div>
                </div>

                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">{parsed.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2 font-medium">{parsed.description}</p>
                
                {/* Visual Progress Stepper for Card */}
                <div className="mt-4 flex items-center justify-between w-full relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-100 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 bottom-0 h-full bg-blue-500 transition-all duration-500"
                      style={{ 
                        width: c.status === 'Resolved' ? '100%' : 
                               c.status === 'In Progress' ? '66%' : 
                               isViewed ? '33%' : '0%'
                      }}
                    ></div>
                  </div>
                  {[
                    { label: "Filed", active: true },
                    { label: "Viewed", active: isViewed },
                    { label: "Active", active: c.status === 'In Progress' || c.status === 'Resolved' },
                    { label: "Done", active: c.status === 'Resolved' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 bg-white dark:bg-[#0B1222] px-1 py-0.5">
                      <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] z-10 transition-colors ${
                        step.active 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'bg-white dark:bg-[#0B1222] border-slate-300 dark:border-slate-700'
                      }`}></div>
                      <span className={`text-[8.5px] font-black uppercase tracking-widest ${
                        step.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'
                      }`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
                  {(() => {
                    const IconComponent = CATEGORY_ICONS[c.issue_type] || Info;
                    return <IconComponent className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
                  })()}
                  <span>{c.issue_type} {"Segment"}</span>
                </span>
                <span className="text-blue-500 font-extrabold flex items-center gap-1">{"Track & Dialog ➔"}</span>
              </div>
            </div>
          )})}

        {tickets.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0B1222] flex flex-col items-center justify-center">
            <span className="text-4xl mb-4">📋</span>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{"No Tickets Yet"}</h4>
            <p className="text-[#94A3B8] max-w-sm mx-auto mb-6 text-sm">
              {"You haven't submitted any tickets."}</p>
            <div className="flex flex-col gap-3 items-center">
              <Button onClick={() => navigate('/dashboard/register')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md rounded-xl">
                {"Create Ticket"}</Button>
              <div className="mt-4 text-xs text-[#94A3B8] flex flex-col items-center">
                <span>{"Need help?"}</span>
                <button 
                  onClick={() => navigate('/dashboard/ai-assistant')} 
                  className="text-blue-500 hover:text-blue-400 font-bold mt-1 flex items-center gap-1 transition-colors"
                >
                  {"Ask Workplace Hub AI Assistant ➔"}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED DOUBLE-SIDED SUPPORT OVERLAY SLEEK SLIDEOUT */}
      <AnimatePresence>
        {selectedTicket && (() => {
          const c = selectedTicket;
          const parsed = parseTicketDescription(c.description);
          const isEscalated = escalatedTickets[c.id];
          const currSeverity = isEscalated ? 'Critical' : c.severity;
          const sla = getSLAString(c.created_at, currSeverity, c.status);
          const activeComments = localTimeLineNotes[c.id] || [];

          // Phase 4 Lockout variables
          const hasBeenViewed = c.isViewedByAdmin === true || c.status !== 'Pending';

          // Load images from key `dcms_ticket_attachments_${c.id}`
          const tAttachments: SupportAttachment[] = getStoredItem(`dcms_ticket_attachments_${c.id}`, []);
          const storedImages = tAttachments.filter(a => a.type === 'image');
          const storedDocs = tAttachments.filter(a => a.type !== 'image');

          return (
            <>
              {/* Overlay Backdrop Blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTicket(null)}
                className="fixed inset-0 bg-[#020617]/40 backdrop-blur-md z-50"
              />

              {/* Master Split screen Slider Overlay */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 26, stiffness: 180 }}
                className="fixed top-0 right-0 h-full w-full max-w-4xl bg-white dark:bg-[#0B1222] border-l border-slate-100 dark:border-slate-850 shadow-2xl z-55 flex flex-col"
              >
                {/* upper split bar controls */}
                <div className="p-5.5 border-b border-slate-50 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">{"TICKET_DEEP_AUDIT"}</span>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-150">{"Workplace Hub-"}{c.id.toString().substring(0, 8).toUpperCase()}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                  >
                    {"✕ Close"}</button>
                </div>

                {/* Double sided scroll track */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-850">
                  
                  {/* LEFT PANE: Operational Details log & SLA Target */}
                  <div className="p-6 space-y-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{"Ticket Classification"}</span>
                      <h4 className="text-md font-black text-slate-850 dark:text-white mt-1 leading-tight">{parsed.title}</h4>
                      
                      <div className="flex gap-2.5 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 uppercase font-black tracking-wider text-slate-500">{c.issue_type} {"Segment"}</Badge>
                        <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-wider ${
                          currSeverity === 'Critical' ? 'bg-red-50 text-red-650 border-red-150' : 'bg-slate-50 text-slate-500'
                        }`}>{currSeverity} {"Alarm"}</Badge>
                      </div>
                    </div>

                    {/* Detailed text */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-[#8B5CF6] tracking-wider font-mono">{"Operations Log Log"}</span>
                      <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#111A2E]/40 border border-slate-100 dark:border-slate-800/80 p-4.5 rounded-2xl italic">
                        {"&ldquo;"}{parsed.description}{"&rdquo;"}</p>
                    </div>

                    {/* SLA countdown targets */}
                    <div className="border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl bg-white dark:bg-slate-950/30 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-slate-750 dark:text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{sla.label}</span>
                        </span>
                        <Badge className={`${sla.expired ? 'bg-red-100 text-red-655 border-red-200' : 'bg-green-100 text-green-655 border-green-200'} text-[9px] font-bold rounded`}>
                          {sla.expired ? "Target Breach" : "Metrics Okay"}
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${sla.expired ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500'}`} style={{width: `${sla.pct}%`}}></div>
                      </div>
                    </div>

                    {/* Gemini AI Auto synopsis */}
                    <div className="bg-blue-50/15 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500" />
                        {"Gemini AI Condensed Synopsis"}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                        {loadingSummary ? "Analyzing diagnostic paragraphs..." : aiSummary}
                      </p>
                    </div>

                    {/* RENDER ATTACHMENTS FOR WORKSTATIONS */}
                    {tAttachments.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{"Supporting attachments ledger"}</span>
                        
                        {/* WhatsApp preview grid */}
                        {storedImages.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {storedImages.map((img) => (
                              <div 
                                key={img.id} 
                                onClick={() => {
                                  const w = window.open();
                                  w?.document.write(`<body><img src="${img.dataUrl}"/></body>`);
                                }}
                                className="aspect-square bg-slate-50 border border-slate-100 rounded-lg overflow-hidden cursor-zoom-in hover:brightness-95"
                              >
                                <img src={img.dataUrl} alt={"Attachments log zoomed"} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Stored docs list info */}
                        {storedDocs.length > 0 && (
                          <div className="space-y-1.5">
                            {storedDocs.map((doc) => (
                              <div key={doc.id} className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px]">
                                <span className="font-mono text-slate-550 truncate max-w-[150px]">{doc.name}</span>
                                <span className="font-extrabold text-slate-400 uppercase">{(doc.size / 1024).toFixed(1)} {"KB"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phase 4 Lockout Editing & Deletion Action Blocks */}
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-850/50 flex justify-between items-center gap-4">
                      {hasBeenViewed ? (
                        <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-850 w-full justify-center">
                          <Eye className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
                          <span>{"🔒 Active support review cycle initiated. Modification restricted."}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                // Load this ticket straight into editable cache
                                setSelectedTicket(null);
                                navigate("/dashboard/register", { 
                                  state: { 
                                    editTicketId: c.id,
                                    title: parsed.title,
                                    description: parsed.description,
                                    issue_type: c.issue_type,
                                    severity: c.severity,
                                    attachments: tAttachments
                                  } 
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> {"Edit Details"}</Button>
                            <Button 
                              onClick={() => handleDeleteTicket(c)}
                              variant="outline" 
                              className="text-red-500 border-slate-100 dark:border-slate-850 hover:bg-red-50 h-9 px-4 rounded-xl text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> {"Discard Ticket"}</Button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{"Pre-viewed modification mode"}</span>
                        </>
                      )}
                    </div>

                    {/* SATISFACTION FEEDBACK CARD (PHASE 9) */}
                    {c.status === 'Resolved' && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-850/60">
                        {ratingSubmitted[c.id] ? (
                          <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-[#1F332E] rounded-2xl text-xs font-bold text-center text-emerald-600 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span>{"Operational satisfaction scorecard recorded. Thank you!"}</span>
                          </div>
                        ) : (
                          <form onSubmit={submitSatisfactionRating} className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                            <div className="text-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">{"Step 3: Verification Scorecard"}</span>
                              <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1 leading-none">{"Rate resolution operations quality"}</h4>
                            </div>

                            {/* Stars rating */}
                            <div className="flex justify-center gap-1.5">
                              {[1,2,3,4,5].map((star) => (
                                <button 
                                  key={star} 
                                  type="button"
                                  onClick={() => setStarRating(star)}
                                  onMouseEnter={() => setHoverStar(star)}
                                  onMouseLeave={() => setHoverStar(0)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star className={`w-6 h-6 ${(hoverStar || starRating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-350 dark:text-slate-700'}`} />
                                </button>
                              ))}
                            </div>

                            <Textarea 
                              placeholder={"Any comments regarding resolution quality or professional operations speed? (Optional)..."}
                              value={ratingDraftDesc}
                              onChange={e => setRatingDraftDesc(e.target.value)}
                              className="text-xs min-h-16 bg-white dark:bg-[#0B1222] resize-none"
                            />

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 rounded-xl text-xs">
                              {"Submit Scorecard Feedback"}</Button>
                          </form>
                        )}
                      </div>
                    )}

                  </div>

                  {/* RIGHT PANE: Progressive Audit Milestones & Remarks Timeline */}
                  <div className="p-6 flex flex-col justify-between max-h-[85vh]">
                    
                    {/* Upper timeline timeline */}
                    <div className="space-y-5 overflow-y-auto pr-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">{"Operational Triage Progression"}</span>
                      
                      {/* Interactive circular checkpoint milestone indicator with timestamps */}
                      <div className="grid grid-cols-4 gap-2.5 pb-4 border-b border-slate-50 dark:border-slate-850/60 text-center">
                        {[
                          { 
                            key: "Created", 
                            done: true, 
                            date: new Date(c.created_at).toLocaleDateString('en-GB') 
                          },
                          { 
                            key: "Image Uploaded", 
                            done: (() => {
                              const attachmentsObj = localStorage.getItem("dcms_ticket_attachments_" + c.id);
                              if (!attachmentsObj) return false;
                              try {
                                const parsed = JSON.parse(attachmentsObj);
                                return parsed.some((a: any) => a.type === 'image');
                              } catch(e) { return false; }
                            })(),
                            date: (() => {
                              const attachmentsObj = localStorage.getItem("dcms_ticket_attachments_" + c.id);
                              if (!attachmentsObj) return "N/A";
                              try {
                                const parsed = JSON.parse(attachmentsObj);
                                return parsed.some((a: any) => a.type === 'image') ? "Attached" : "No Photo";
                              } catch(e) { return "No Photo"; }
                            })()
                          },
                          { 
                            key: "Admin Viewed", 
                            done: hasBeenViewed, 
                            date: hasBeenViewed ? "Active" : "Pending" 
                          },
                          { 
                            key: "Resolution", 
                            done: c.status === 'Resolved', 
                            date: c.status === 'Resolved' ? "Uploaded" : "Pending" 
                          }
                        ].map((node, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-[10px] shadow-2xs transition-all ${
                              node.done 
                                ? 'bg-blue-600 border-blue-500 text-white' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
                            }`}>
                              {node.done ? "✓" : i + 1}
                            </div>
                            <span className="text-[9.5px] font-extrabold text-slate-400 mt-1 capitalize line-clamp-1">{node.key}</span>
                            <span className="text-[8.5px] font-semibold font-mono text-slate-400 mt-0.5">{node.date}</span>
                          </div>
                        ))}
                      </div>

                      {/* Resolution Recommendation Note for client visibility */}
                      {c.status === 'Resolved' && (() => {
                        const notes = getStoredItem<Record<string, string>>("dcms_ticket_resolution_notes_v1", {});
                        const actualNote = notes[c.id] || "Issue resolved. Core diagnostic telemetry indicators verified successfully.";
                        const afterAttachmentsObj = localStorage.getItem("dcms_ticket_after_attachments_" + c.id);
                        let afterFiles: any[] = [];
                        if (afterAttachmentsObj) {
                          try { afterFiles = JSON.parse(afterAttachmentsObj); } catch(e){}
                        }
                        
                        return (
                          <div className="bg-emerald-50/15 dark:bg-emerald-950/10 border-2 border-dashed border-emerald-500/30 p-4 rounded-xl space-y-3 mt-1 shadow-2xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-1.5 label-satisfaction">
                                {"🏁 Resolution Recommendation Note"}</span>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-205 leading-relaxed bg-white dark:bg-[#0B1222] border border-emerald-100 dark:border-[#1E3029] p-3 rounded-lg italic">
                                {"&ldquo;"}{actualNote}{"&rdquo;"}</p>
                            </div>

                            {afterFiles.length > 0 && (
                              <div className="space-y-1.5 pt-1.5 border-t border-emerald-100/30">
                                <span className="text-[9.5px] uppercase font-bold text-slate-450 tracking-wider block">{"📸 Resolution Screenshot Proof"}</span>
                                <div className="bg-white/45 dark:bg-black/25 p-2 rounded-lg border border-emerald-100/25">
                                  <MediaGallery attachments={afterFiles} allowEdit={false} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Communications Remarks Dialogue block */}
                      <div className="space-y-4 pt-1.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">{"SUPPORT LOG remarks sync"}</span>
                        
                        <div className="space-y-3">
                          {/* Baseline creation statement */}
                          <div className="p-3 bg-slate-50 dark:bg-[#131E33] border border-slate-150 dark:border-slate-800Rounded border-slate-100 text-[10.5px] text-slate-500 rounded-xl leading-relaxed">
                            <span className="text-blue-500 font-extrabold mr-1">{"🟢 AUDIT BEGIN:"}</span> {"Incident files dispatches targets matching priority window"}{currSeverity} {"severity successfully."}</div>

                          {/* Viewed alert announcement */}
                          {hasBeenViewed && (
                            <div className="p-3 bg-blue-50/20 dark:bg-blue-950/20 border border-blue-100/30 p-3 rounded-xl text-[10.5px] text-slate-550 flex items-center gap-1.5 leading-relaxed">
                              <span>{"📂 Administrative operations leads reviewed the log index and opened an active diagnostic review."}</span>
                            </div>
                          )}

                          {/* Remarks Dialog arrays */}
                          {activeComments.map((com) => {
                            const sideUser = com.sender === 'user';
                            return (
                              <div key={com.id} className={`flex flex-col ${sideUser ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${
                                  sideUser ? 'bg-blue-600 text-white rounded-br-none shadow-sm' : 'bg-slate-100 dark:bg-slate-850 text-slate-850 dark:text-slate-100 rounded-bl-none'
                                }`}>
                                  <p className="break-all">{com.text}</p>
                                </div>
                                <span className="text-[8px] font-bold font-mono text-slate-400 uppercase mt-1 px-1">
                                  {sideUser ? 'Client Query' : 'Tech Officer Specialist'} • {com.time}
                                </span>
                              </div>
                            );
                          })}

                          {activeComments.length === 0 && !hasBeenViewed && (
                            <p className="text-[10px] italic text-slate-400 text-center py-4 font-semibold">{"No operational remarks recorded. Type beneath to request updates."}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Remark dispatches action */}
                    {c.status !== 'Resolved' && (
                      <form onSubmit={handleAddNoteSubmit} className="pt-4 border-t border-slate-50 dark:border-slate-850/50 flex gap-2">
                        <Input 
                          placeholder={"Type quick operations remark details..."}
                          value={supplementaryNote}
                          onChange={e => setSupplementaryNote(e.target.value)}
                          className="text-xs h-9.5 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                        />
                        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9.5 px-4 rounded-xl text-xs">
                          {"Post Remark"}</Button>
                      </form>
                    )}

                  </div>

                </div>

              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

/* ==========================================
   2.1 NOTICE BULLETIN PARSER ENGINE
   ========================================== */
interface ParsedNotice {
  id: string;
  originalTitle: string;
  originalMessage: string;
  title: string;
  message: string;
  category: "Maintenance" | "Policy Change" | "Critical Alert" | "Company Event" | "General Bulletin";
  importance: "Standard" | "Featured";
  theme: "server" | "policy" | "alert" | "event" | "general";
  created_at: string;
}

export function parseNotice(n: any): ParsedNotice {
  const titleStr = n.title || "";
  const msgStr = n.message || "";
  
  let category: "Maintenance" | "Policy Change" | "Critical Alert" | "Company Event" | "General Bulletin" = "General Bulletin";
  let importance: "Standard" | "Featured" = "Standard";
  let theme: "server" | "policy" | "alert" | "event" | "general" = "general";
  
  let cleanedTitle = titleStr;
  
  // Try matching serialized tag prefixes (e.g., [TYPE:Maintenance])
  const typeMatch = cleanedTitle.match(/\[TYPE:(.*?)\]/i);
  if (typeMatch) {
    const val = typeMatch[1].trim().toLowerCase();
    if (val === "maintenance") category = "Maintenance";
    else if (val === "policy" || val === "policy change") category = "Policy Change";
    else if (val === "critical" || val === "critical alert" || val === "alert") category = "Critical Alert";
    else if (val === "event" || val === "company event") category = "Company Event";
    else if (val === "general" || val === "general bulletin") category = "General Bulletin";
    cleanedTitle = cleanedTitle.replace(/\[TYPE:(.*?)\]/gi, "");
  }
  
  const impMatch = cleanedTitle.match(/\[IMPORTANCE:(.*?)\]/i);
  if (impMatch) {
    const val = impMatch[1].trim().toLowerCase();
    if (val === "featured" || val === "critical" || val === "high") {
      importance = "Featured";
    }
    cleanedTitle = cleanedTitle.replace(/\[IMPORTANCE:(.*?)\]/gi, "");
  }
  
  const themeMatch = cleanedTitle.match(/\[THEME:(.*?)\]/i);
  if (themeMatch) {
    const val = themeMatch[1].trim().toLowerCase();
    if (["server", "policy", "alert", "event", "general"].includes(val)) {
      theme = val as any;
    }
    cleanedTitle = cleanedTitle.replace(/\[THEME:(.*?)\]/gi, "");
  }
  
  cleanedTitle = cleanedTitle.trim();
  
  // If no explicit tags exist, we do semantic keyword-based auto-classification
  if (!typeMatch) {
    const lowerTitle = titleStr.toLowerCase();
    const lowerMsg = msgStr.toLowerCase();
    
    if (lowerTitle.includes("maintenance") || lowerTitle.includes("downtime") || lowerTitle.includes("server") || lowerTitle.includes("offline") || lowerTitle.includes("upgrade")) {
      category = "Maintenance";
      theme = "server";
      if (lowerTitle.includes("urgent") || lowerTitle.includes("critical")) {
        importance = "Featured";
      }
    } else if (lowerTitle.includes("policy") || lowerTitle.includes("regulation") || lowerTitle.includes("rule") || lowerTitle.includes("handbook") || lowerTitle.includes("legal") || lowerTitle.includes("hr")) {
      category = "Policy Change";
      theme = "policy";
      importance = "Featured"; // Policy updates default to featured for corporate awareness
    } else if (lowerTitle.includes("urgent") || lowerTitle.includes("critical") || lowerTitle.includes("outage") || lowerTitle.includes("disruption") || lowerTitle.includes("incident")) {
      category = "Critical Alert";
      theme = "alert";
      importance = "Featured";
    } else if (lowerTitle.includes("event") || lowerTitle.includes("celebration") || lowerTitle.includes("party") || lowerTitle.includes("pantry") || lowerTitle.includes("holiday") || lowerTitle.includes("session")) {
      category = "Company Event";
      theme = "event";
    } else {
      category = "General Bulletin";
      theme = "general";
    }
  }
  
  return {
    id: n.id,
    originalTitle: n.title,
    originalMessage: n.message,
    title: cleanedTitle || titleStr,
    message: msgStr,
    category,
    importance,
    theme,
    created_at: n.created_at
  };
}

/* ==========================================
   6. Bulletins broadcasts lists (RE-ARCHITECTED ENHANCED VERSION)
   ========================================== */
export function Notices() {
    
  const [rawNotices, setRawNotices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [acknowledgedList, setAcknowledgedList] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("dcms_acknowledged_notices_v1") || "{}");
    } catch {
      return {};
    }
  });

  const { user } = useAuth();
  
  const loadNotices = () => {
    supabase.from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setRawNotices(data || []));
  };

  useEffect(() => {
    loadNotices();
  }, [user?.department]);

  const handleToggleAcknowledge = (id: string) => {
    const isAck = !acknowledgedList[id];
    const updated = { ...acknowledgedList, [id]: isAck };
    setAcknowledgedList(updated);
    localStorage.setItem("dcms_acknowledged_notices_v1", JSON.stringify(updated));

    try {
      const reads = JSON.parse(localStorage.getItem("dcms_sim_notice_reads") || "[]");
      if (isAck) {
        if (!reads.some((r: any) => r.notice_id === id && r.user_id === user?.id)) {
          reads.push({
            id: "rc_" + Math.random().toString(36).substring(2, 11),
            notice_id: id,
            user_id: user?.id || "usr_kiki",
            read_at: new Date().toISOString()
          });
        }
      } else {
        const filtered = reads.filter((r: any) => !(r.notice_id === id && r.user_id === user?.id));
        localStorage.setItem("dcms_sim_notice_reads", JSON.stringify(filtered));
        return;
      }
      localStorage.setItem("dcms_sim_notice_reads", JSON.stringify(reads));
    } catch (e) {
      console.error("Failed to persist read receipt:", e);
    }
  };

  // Filter notices based on target department before parsing
  const targetedNotices = rawNotices.filter((n: any) => {
    const rawTitle = n.title || "";
    if (rawTitle.includes("[TARGET:department]")) {
      const targetDept = n.target_department || "IT";
      return user?.department === targetDept;
    }
    return true; // Everyone
  });

  const parsedNotices = targetedNotices.map(n => parseNotice(n));

  // Filter notices based on search term and category
  const filteredNotices = parsedNotices.filter(n => {
    const matchesCategory = activeCategory === "All" || n.category === activeCategory;
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          n.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Extract separate featured list
  const featuredNotices = parsedNotices.filter(n => n.importance === "Featured");

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "Maintenance":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40", label: "🔧 Maintenance" };
      case "Policy Change":
        return { bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40", label: "📜 Policy" };
      case "Critical Alert":
        return { bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40", label: "🚨 Alert" };
      case "Company Event":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40", label: "🎉 Event" };
      default:
        return { bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40", label: "📢 Bulletin" };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Maintenance":
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case "Policy Change":
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case "Critical Alert":
        return <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />;
      case "Company Event":
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-blue-500" />;
    }
  };

  const getThemeBannerStyles = (theme: string) => {
    switch (theme) {
      case "server":
        return {
          bg: "bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 dark:from-amber-950/40 dark:via-[#221B0F] dark:to-[#0B1222] border-amber-500/30",
          iconBg: "bg-white/10 dark:bg-amber-950/60 text-amber-100 dark:text-amber-400",
          decoCircle: "bg-amber-400/10",
          badgeText: "bg-amber-500/20 text-white border border-amber-400/20"
        };
      case "policy":
        return {
          bg: "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 dark:from-purple-950/40 dark:via-[#1A102F] dark:to-[#0B1222] border-purple-500/30",
          iconBg: "bg-white/10 dark:bg-purple-950/60 text-purple-100 dark:text-purple-400",
          decoCircle: "bg-purple-400/10",
          badgeText: "bg-purple-500/20 text-white border border-purple-400/20"
        };
      case "alert":
        return {
          bg: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 dark:from-red-950/40 dark:via-[#2F1014] dark:to-[#0B1222] border-red-500/30",
          iconBg: "bg-white/10 dark:bg-red-950/60 text-red-100 dark:text-red-400",
          decoCircle: "bg-red-400/10",
          badgeText: "bg-red-500/20 text-white border border-red-405/20 animate-pulse"
        };
      case "event":
        return {
          bg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-950/40 dark:via-[#102F24] dark:to-[#0B1222] border-emerald-500/30",
          iconBg: "bg-white/10 dark:bg-emerald-950/60 text-emerald-100 dark:text-emerald-400",
          decoCircle: "bg-emerald-400/10",
          badgeText: "bg-emerald-500/20 text-white border border-emerald-400/20"
        };
      default:
        return {
          bg: "bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 dark:from-blue-950/40 dark:via-[#101E2F] dark:to-[#0B1222] border-blue-500/30",
          iconBg: "bg-white/10 dark:bg-blue-950/60 text-blue-100 dark:text-blue-400",
          decoCircle: "bg-blue-400/10",
          badgeText: "bg-blue-500/20 text-white border border-blue-400/20"
        };
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-500" />
            {"System Notice Broadcasts"}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {"Review live infrastructure alerts, upcoming downtime schedules, mandatory compliance reviews, and company policy bulletins."}</p>
        </div>
      </div>

      {/* FEATURED CRITICAL ANNOUNCEMENT BANNER - TOP POSITION HIGH VISUAL IMPACT */}
      {featuredNotices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-wider">{"Featured Workspace Directives ("}{featuredNotices.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {featuredNotices.map((fn) => {
              const styles = getThemeBannerStyles(fn.theme);
              const isAck = acknowledgedList[fn.id];
              return (
                <Card 
                  key={fn.id} 
                  className={`border ${styles.bg} text-white shadow-md relative overflow-hidden rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row items-start gap-5`}
                >
                  {/* Procedural background circle decoration */}
                  <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full ${styles.decoCircle} pointer-events-none`} />
                  <div className={`absolute -left-12 -bottom-12 w-36 h-36 rounded-full ${styles.decoCircle} pointer-events-none`} />

                  {/* Icon Block */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                    {fn.category === "Maintenance" && <Wrench className="w-6 h-6" />}
                    {fn.category === "Policy Change" && <ShieldCheck className="w-6 h-6" />}
                    {fn.category === "Critical Alert" && <AlertOctagon className="w-6 h-6 animate-pulse" />}
                    {fn.category === "Company Event" && <Calendar className="w-6 h-6" />}
                    {fn.category === "General Bulletin" && <Megaphone className="w-6 h-6" />}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 space-y-2.5 z-10 relative">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${styles.badgeText}`}>
                        {fn.category} {"Critical Update"}</span>
                      {isAck ? (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800/80 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
                          {"✓ Acknowledged Directive"}</span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800/80 text-amber-400 border border-amber-900/60 animate-pulse">
                          {"⚠ Unread Notice"}</span>
                      )}
                      <span className="text-[9.5px] font-mono text-white/70 ml-auto whitespace-nowrap">
                        {new Date(fn.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg md:text-xl font-black tracking-tight text-white leading-tight">
                        {fn.title}
                      </h3>
                      <p className="text-white/85 text-xs font-semibold leading-relaxed whitespace-pre-line sm:max-w-2xl">
                        {fn.message}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => handleToggleAcknowledge(fn.id)}
                        className={`text-[10px] font-extrabold tracking-wide uppercase px-4 h-8 rounded-xl transition-all ${
                          isAck 
                            ? "bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-400/40 text-emerald-300"
                            : "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 shadow-sm border border-slate-200/25"
                        }`}
                      >
                        {isAck ? "✓ Acknowledged" : "Mark Acknowledged"}
                      </Button>
                      
                      <span className="text-[10px] text-white/60 font-medium">{"Please review guidelines explicitly. Contact Operations in case of failures."}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SEARCH AND TABS FILTER BAR */}
      <Card className="border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search tool */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              type="text" 
              placeholder={"Search announcements, tags, messages..."} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs bg-slate-50/50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-2xl"
            />
          </div>

          {/* Quick Stats Indicator */}
          <div className="flex items-center gap-2 justify-end text-xs font-bold text-slate-500 px-1">
            <span>{"Bulletins Parsed:"}</span>
            <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-extrabold rounded-lg">{filteredNotices.length}</Badge>
          </div>
        </div>

        {/* Categories Tabs Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin border-t border-slate-100 dark:border-slate-800/60 pt-3">
          {["All", "Maintenance", "Policy Change", "Critical Alert", "Company Event", "General Bulletin"].map(cat => {
            const count = cat === "All" ? parsedNotices.length : parsedNotices.filter(n => n.category === cat).length;
            let displayLabel = cat;
            if (cat === "All") displayLabel = "📂 Show All";
            if (cat === "Maintenance") displayLabel = "🔧 Maintenance";
            if (cat === "Policy Change") displayLabel = "📜 Policy Changes";
            if (cat === "Critical Alert") displayLabel = "🚨 Alerts";
            if (cat === "Company Event") displayLabel = "🎉 Events";
            if (cat === "General Bulletin") displayLabel = "📢 Bulletins";
            
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                  activeCategory === cat 
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-xs" 
                    : "bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350"
                }`}
              >
                <span>{displayLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeCategory === cat ? "bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* NOTICES LIST */}
      <div className="space-y-4">
        {filteredNotices.map((n) => {
          const catStyle = getCategoryStyles(n.category);
          const icon = getCategoryIcon(n.category);
          const isAck = acknowledgedList[n.id];
          return (
            <Card key={n.id} className="border-slate-150 dark:border-slate-850 bg-white dark:bg-[#0B1222] shadow-2xs overflow-hidden flex flex-row items-stretch hover:shadow-sm hover:border-slate-250 transition-all rounded-2xl">
              {/* Highlight stripe */}
              <div className={`w-1.5 shrink-0 ${
                n.category === "Critical Alert" ? "bg-red-500" : 
                n.category === "Maintenance" ? "bg-amber-500" :
                n.category === "Policy Change" ? "bg-purple-500" :
                n.category === "Company Event" ? "bg-emerald-500" : "bg-blue-500"
              }`} />
              
              <div className="p-5 flex-1 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 ${catStyle.bg}`}>
                      {catStyle.label}
                    </Badge>
                    {isAck && (
                      <span className="text-[8.5px] font-bold text-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10 flex items-center gap-1">
                        {"✓ Acknowledged"}</span>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-400 ml-auto sm:ml-0 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 px-2 py-0.5 rounded-full">
                      {new Date(n.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-extrabold tracking-tight text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                      {icon}
                      {n.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-xs break-words max-w-2xl font-medium">
                      {n.message}
                    </p>
                  </div>
                </div>

                <div className="sm:self-center shrink-0 w-full sm:w-auto flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAcknowledge(n.id)}
                    className={`text-[10px] font-bold h-8 w-full sm:w-auto px-4.5 rounded-xl transition-colors ${
                      isAck 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/30"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {isAck ? "✓ Checked" : "Acknowledge"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-[#0B1222] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800/60 flex flex-col items-center justify-center">
            <span className="text-4xl mb-4">📢</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{"Notice Cache Empty"}</h4>
            <p className="text-[#94A3B8] max-w-sm mx-auto text-xs max-w-xs leading-relaxed">
              {"No bulletins exist for category '"}{activeCategory}{"' matching your query. We will broadcast updates as they arise."}</p>
          </div>
        )}
      
        {/* Accessibility */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ACCESSIBILITY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"High Contrast Text"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Reduce Motion"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"PRIVACY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Data Sharing"}</span>
              <button className="w-8 h-4 rounded-full bg-blue-500"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Cookie Preferences"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ABOUT"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="text-sm font-black text-slate-900 dark:text-white">{"Workplace Hub"}</div>
            <div className="text-xs text-slate-500">{"Version 4.1.0"}</div>
            <div className="text-xs text-blue-500 hover:underline cursor-pointer">{"Terms of Service"}</div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ==========================================
   7. USER PROFILE SUMMARY
   ========================================== */
export function UserProfile() {
    
  const { user, dbUser } = useAuth();
  const [stats, setStats] = useState({ total: 0, resolved: 0 });

  useEffect(() => {
    if (user) {
      supabase.from('tickets').select('status').eq('user_id', user.id).then(({ data }) => {
        if (data) {
          setStats({
            total: data.length,
            resolved: data.filter(c => c.status === 'Resolved').length
          });
        }
      });
    }
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-805 dark:text-white tracking-tight">{"Active Client Identity"}</h2>
        <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">{"Review active logged operations segments, connection parameters and registered credentials."}</p>
      </div>

      <Card className="border border-slate-100 dark:border-[#1E293B] shadow-lg bg-white dark:bg-[#0B1222] backdrop-blur-xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-3xl uppercase shadow-md shadow-blue-500/10">
              {dbUser?.name?.[0] || 'U'}
            </div>
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">{dbUser?.name || 'Helper Account'}</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400">{dbUser?.email || user?.email}</p>
              <div className="flex justify-center md:justify-start gap-2 pt-1">
                <Badge className="bg-blue-600 text-white uppercase text-[9px] font-extrabold tracking-wider px-2 py-0.5">{"Business User Client"}</Badge>
                <Badge variant="outline" className="text-[9px] font-extrabold tracking-wider border-slate-200 dark:border-slate-800">{"SaaS Gateway Active"}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-850/50">
            <div className="bg-slate-50/50 dark:bg-[#162033]/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850/60">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">{"Logged Tickets"}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 block leading-none">{stats.total}</span>
            </div>
            <div className="bg-emerald-50/10 dark:bg-[#11302A]/10 p-4 rounded-xl border border-emerald-100/30 dark:border-[#1A2E2A]">
              <span className="text-[9px] font-extrabold text-[#10B981] uppercase tracking-widest block">{"Resolved SLA"}</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 block leading-none">{stats.resolved}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==========================================
   8. CLIENT SETTINGS PANEL
   ========================================== */
export function UserSettings() {
    
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState(() => localStorage.getItem("dcms_brand_accent") || "blue");
  const [notifCrit, setNotifCrit] = useState(true);
  const [notifSla, setNotifSla] = useState(true);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(() => localStorage.getItem("dcms_suggestions_enabled") !== "false");

  const toggleSuggestions = () => {
    const next = !suggestionsEnabled;
    setSuggestionsEnabled(next);
    localStorage.setItem("dcms_suggestions_enabled", String(next));
  };

  const saveAccent = (col: string) => {
    setAccent(col);
    localStorage.setItem("dcms_brand_accent", col);
  };

  const accentsList = [
    { id: "blue", label: "Corporate Blue", color: "bg-blue-600 hover:ring-blue-300" },
    { id: "indigo", label: "Executive Indigo", color: "bg-indigo-600 hover:ring-indigo-300" },
    { id: "emerald", label: "Security Green", color: "bg-emerald-600 hover:ring-emerald-300" },
    { id: "amber", label: "Urgent Amber", color: "bg-amber-500 hover:ring-amber-300" },
    { id: "purple", label: "Stripe Purple", color: "bg-purple-600 hover:ring-purple-300" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{"System Preferences"}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{"Configure workspace aesthetic colors, dashboard lightmodes, and system operations notification limits."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Aspect 1: Theme selection */}
        <Card className="md:col-span-3 border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222]">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"THEME"}<CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"workspace theme"}</CardTitle> {"BRANDING"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { 
                  id: "light", 
                  label: "Enterprise Light", 
                  desc: "Soft off-whites & crisp borders",
                  bg: "bg-[#F8FAFC]",
                  preview: (
                    <div className="w-full h-20 rounded-lg bg-[#F8FAFC] border border-slate-200 p-2 flex flex-col gap-1.5 overflow-hidden">
                      <div className="h-3 w-full bg-white rounded border border-slate-100 flex items-center px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="h-8 w-full bg-white rounded border border-slate-100 p-1 flex gap-1">
                        <div className="w-1/3 bg-slate-100 rounded"></div>
                        <div className="w-2/3 bg-slate-50 rounded"></div>
                      </div>
                    </div>
                  )
                },
                { 
                  id: "dark", 
                  label: "Cosmic Dark", 
                  desc: "Eye-save galactic slate grays",
                  bg: "bg-[#020617]",
                  preview: (
                    <div className="w-full h-20 rounded-lg bg-[#020617] border border-slate-800 p-2 flex flex-col gap-1.5 overflow-hidden">
                      <div className="h-3 w-full bg-[#0F172A] rounded border border-slate-800/60 flex items-center px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      </div>
                      <div className="h-8 w-full bg-[#0F172A] rounded border border-slate-800/60 p-1 flex gap-1">
                        <div className="w-1/3 bg-slate-800 rounded"></div>
                        <div className="w-2/3 bg-slate-900 rounded"></div>
                      </div>
                    </div>
                  )
                },
                { 
                  id: "system", 
                  label: "Match System", 
                  desc: "Syncs with client hardware defaults",
                  bg: "bg-gradient-to-r from-slate-100 to-slate-950",
                  preview: (
                    <div className="w-full h-20 rounded-lg bg-gradient-to-r from-slate-100 to-slate-950 border border-slate-300 dark:border-slate-800 p-2 flex flex-col gap-1.5 overflow-hidden">
                      <div className="h-3 w-full bg-white dark:bg-[#0B1222] rounded border border-slate-200 dark:border-slate-800/60 flex items-center px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-505"></div>
                      </div>
                      <div className="h-8 w-full bg-white dark:bg-[#0B1222] rounded border border-slate-200 dark:border-slate-800/60 p-1 flex gap-1">
                        <div className="w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
                        <div className="w-1/2 bg-slate-55 dark:bg-slate-900 rounded"></div>
                      </div>
                    </div>
                  )
                },
              ].map((themeNode) => (
                <div 
                  key={themeNode.id}
                  onClick={() => setTheme(themeNode.id as any)}
                  className={`border rounded-2xl p-4 cursor-pointer relative flex flex-col justify-between transition-all group hover:shadow-md ${
                    theme === themeNode.id 
                      ? 'border-blue-500 bg-blue-50/10 text-slate-900 dark:text-white font-extrabold ring-2 ring-blue-500/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-900/10'
                  }`}
                >
                  <div className="mb-3 transition-transform duration-200 group-hover:scale-[1.02]">{themeNode.preview}</div>
                  <div>
                    <span className="text-xs font-black tracking-tight block">{themeNode.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-normal">{themeNode.desc}</span>
                  </div>
                  {theme === themeNode.id && (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow shadow-blue-550">
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aspect 2: Accent color branding */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1.5">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"system branding accent"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-[11px] text-slate-500 leading-relaxed">{"Customize UI focus borders, checkmarks, and special visual headers dynamically."}</p>
            <div className="flex flex-col gap-2">
              {accentsList.map((ax) => (
                <div 
                  key={ax.id}
                  onClick={() => saveAccent(ax.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    accent === ax.id 
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold' 
                      : 'border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-900/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full ring-2 ring-offset-2 ring-transparent transition-all ${ax.color} ${accent === ax.id ? 'scale-110' : ''}`}></div>
                    <span className="text-xs text-slate-705 dark:text-slate-300">{ax.label}</span>
                  </div>
                  {accent === ax.id && <span className="text-xs text-blue-500 font-bold">{"Active"}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Language Preferences */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1.5">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"LANGUAGE"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-[11px] text-slate-500 leading-relaxed">{"Change the language of the entire application interface."}</p>
            <div className="flex flex-col gap-2">
               
            </div>
          </CardContent>
        </Card>

        {/* Aspect 3: SLA Notifications */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1.5">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"email notifications"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <p className="text-[11px] text-slate-500 leading-relaxed">{"Toggle operational threshold limits and email dispatch intervals for filed incident tickets."}</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{"Critical Incidents Alert"}</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{"Instant alerts when 2-hour SLA is breached"}</p>
                </div>
                <div 
                  onClick={() => setNotifCrit(!notifCrit)}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-all relative ${notifCrit ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all ${notifCrit ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{"SLA Daily Executive Summary"}</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{"Aggregate metric summary dispatched at 17:00 UTC"}</p>
                </div>
                <div 
                  onClick={() => setNotifSla(!notifSla)}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-all relative ${notifSla ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all ${notifSla ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aspect 4: Onboarding & Interactive Tutorials */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-3">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"onboarding & tutorial preferences"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-[11px] text-slate-500 leading-relaxed">{"Customize guided walkthrough prompts, automated platform tours, and contextual onboarding indicators."}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{"Smart Assistant Suggestions & Tips"}</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{"Show helpful contextual overlays and tips during periods of inactivity"}</p>
                </div>
                <div 
                  onClick={toggleSuggestions}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-all relative ${suggestionsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all ${suggestionsEnabled ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/50 rounded-xl gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{"Interactive Guide Replay"}</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{"Immediately launch the main portal operations guide"}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("dcms_tour_completed_employee");
                    window.dispatchEvent(new CustomEvent("start-product-tour", { detail: { name: "employee" } }));
                  }}
                  className="text-[10px] font-bold h-7 cursor-pointer"
                >
                  {"Replay Tour"}</Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/50 rounded-xl gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250 text-red-500">{"Reset Tutorial Milestones"}</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{"Mark all guided procedures as incomplete and trigger welcome screen on next sign-in"}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tours = ["home", "employee", "admin", "meeting", "ai-assistant", "employee-register-complaint", "employee-track-complaint", "employee-ai-assistant", "employee-camera-scanner", "employee-notifications", "employee-profile", "admin-dashboard-overview", "admin-complaint-management", "admin-reports", "admin-analytics", "admin-user-management"];
                    tours.forEach(t => localStorage.removeItem("dcms_tour_completed_" + t));
                    localStorage.removeItem("dcms_welcome_seen");
                    localStorage.removeItem("dcms_onboarding_opt_out");
                    localStorage.removeItem("dcms_bookmarked_tours");
                    alert("Onboarding milestones successfully reset!");
                  }}
                  className="text-[10px] font-bold h-7 border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                >
                  {"Reset Milestones"}</Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900/50 rounded-xl gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250 font-sans">{"Clear Walkthrough History"}</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{"Erase saved walkthrough logs without resetting login status"}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tours = ["home", "employee", "admin", "meeting", "ai-assistant", "employee-register-complaint", "employee-track-complaint", "employee-ai-assistant", "employee-camera-scanner", "employee-notifications", "employee-profile", "admin-dashboard-overview", "admin-complaint-management", "admin-reports", "admin-analytics", "admin-user-management"];
                    tours.forEach(t => localStorage.removeItem("dcms_tour_completed_" + t));
                    alert("Walkthrough history cleared successfully!");
                  }}
                  className="text-[10px] font-bold h-7 cursor-pointer"
                >
                  {"Clear Progress"}</Button>
              </div>

            </div>
          </CardContent>
        </Card>

      
        {/* Accessibility */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ACCESSIBILITY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"High Contrast Text"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Reduce Motion"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"PRIVACY"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Data Sharing"}</span>
              <button className="w-8 h-4 rounded-full bg-blue-500"></button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{"Cookie Preferences"}</span>
              <button className="w-8 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0B1222] md:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400">{"ABOUT"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="text-sm font-black text-slate-900 dark:text-white">{"Workplace Hub"}</div>
            <div className="text-xs text-slate-500">{"Version 4.1.0"}</div>
            <div className="text-xs text-blue-500 hover:underline cursor-pointer">{"Terms of Service"}</div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

/* ==========================================
   9. FEEDBACK SYSTEM SUBMISSIONS
   ========================================== */
export function UserFeedback() {
    
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pastFeedback, setPastFeedback] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, { reply?: string, status?: string }>>({});

  const loadFeedback = () => {
    supabase.from('feedback')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPastFeedback(data || []));
      
    try {
      const fbResponses = JSON.parse(localStorage.getItem("dcms_feedback_replies_v1") || "{}");
      setResponses(fbResponses);
    } catch {}
  };

  useEffect(() => {
    if (user?.id) loadFeedback();
  }, [user]);

  const handleFeedback = async (e: any) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating coefficient first.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert([{
        user_id: user?.id,
        rating: rating.toString(),
        message: desc
      }]);
      if (error) throw error;
      alert("Executive feedback logged successfully. Thank you!");
      setDesc('');
      setRating(0);
      loadFeedback();
    } catch (err: any) {
      alert("Failed submitting feedback: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-805 dark:text-white tracking-tight">{"Operational Support Feedback"}</h2>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">{"Provide satisfaction feedback regarding administrative remediation quality, dispatch routing speed and dashboard accessibility."}</p>
        </div>

        <Card className="border border-slate-150 dark:border-[#1E293B] shadow-lg bg-white dark:bg-[#0B1222]">
          <CardContent className="p-8">
            <form onSubmit={handleFeedback} className="space-y-6">
              <div className="text-center space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-widest text-[#8B5CF6]">{"Platform Experience"}</label>
                <p className="text-xs text-slate-500">{"Rate your overall experience with the IT Support Center"}</p>
                
                <div className="flex justify-center gap-1.5 pt-3">
                  {[1,2,3,4,5].map((st) => (
                    <button 
                      key={st} 
                      type="button"
                      onClick={() => setRating(st)}
                      onMouseEnter={() => setHoverRating(st)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star className={`w-8 h-8 ${(hoverRating || rating) >= st ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-705 dark:text-slate-350">{"Platform Improvement Comments"}</label>
                <Textarea 
                  placeholder={"What details can we enhance to better serve your technical remediation cycles?..."}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  required
                  className="min-h-24 text-xs bg-slate-50 dark:bg-[#161F30] border-slate-200"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs">
                {submitting ? 'Submitting Score...' : 'Submit Platform Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {pastFeedback.length > 0 && (
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{"Your Past Feedback"}</h3>
          <div className="space-y-4">
            {pastFeedback.map(f => {
              const state = responses[f.id] || {};
              return (
                <Card key={f.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1222]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < f.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-2">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      {state.status === "Resolved" && (
                         <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">{"Resolved"}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{f.message}"</p>
                    {state.reply && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-[#111A2E]/50 rounded-lg border border-slate-100 dark:border-slate-800/60">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">{"Company Response"}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{state.reply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
