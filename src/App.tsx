/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext.tsx";
import Home from "./pages/Home.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import DashboardLayout from "./components/DashboardLayout.tsx";
import { UserDashboardStats, RegisterTicket, MyTickets, Notices, UserFeedback, UserProfile, UserSettings, DraftTickets, UserNotificationsView } from "./pages/UserPages.tsx";
import { AdminStats, ManageTickets, ManageNotices, ViewFeedback, AdminProfile, AdminSettings } from "./pages/AdminPages.tsx";
import AdminCommunicationCenter from "./pages/AdminCommunicationCenter.tsx";
import AdminTeamChat from "./pages/AdminTeamChat.tsx";
import AiAssistantPage from "./pages/AiAssistantPage.tsx";
import HelpCenter from "./pages/HelpCenter.tsx";
import AdminManagement from "./pages/AdminManagement.tsx";
import { LayoutDashboard, FileText, Bell, MessageSquare, ClipboardList, Shield, User as UserIcon, Settings, Layers, Sparkles, BookOpen, Network, UserCog } from "lucide-react";

function UserPortal() {
  const { user, dbUser, loading } = useAuth();
  
  if (loading) return null;
  if (!user || !dbUser) return <Navigate to="/auth/user" />;
  if (dbUser.role === 'admin') return <Navigate to="/admin" />;
 
    const links = [
      { label: "Overview", isHeader: true },
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
      { label: "🤖 AI Assistant", path: "/dashboard/ai-assistant", icon: Sparkles },
      
      { label: "Service Desk", isHeader: true },
      { label: "Create Ticket", path: "/dashboard/register", icon: FileText },
      { label: "My Tickets", path: "/dashboard/my-complaints", icon: ClipboardList },
      { label: "Draft Tickets", path: "/dashboard/drafts", icon: Layers },
      { label: "Help Center", path: "/dashboard/help", icon: BookOpen },
      
      { label: "Communication", isHeader: true },
      { label: "Announcements", path: "/dashboard/notices", icon: Bell },
      { label: "Notifications", path: "/dashboard/notifications", icon: Bell },
      { label: "Feedback", path: "/dashboard/feedback", icon: MessageSquare },
    ];

  return <DashboardLayout sidebarLinks={links}><Outlet /></DashboardLayout>;
}

import { MeetingProvider } from "./lib/MeetingContext.tsx";
import MeetingOverlay from "./components/MeetingOverlay.tsx";

function AdminPortal() {
  const { user, dbUser, loading } = useAuth();

  if (loading) return null;
  if (!user || !dbUser) return <Navigate to="/auth/admin" />;
  if (dbUser.role !== 'admin') {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
           <Shield className="w-16 h-16 text-red-500 mb-4" />
           <h1 className="text-3xl font-bold text-slate-800">Access Denied</h1>
           <p className="text-slate-600 mt-2">Only authorized administrator accounts can access this portal.</p>
           <a href="/dashboard" className="mt-6 text-primary-600 hover:underline">Return to Dashboard</a>
        </div>
     );
  }

  const links = [
    { label: "Overview", isHeader: true },
    { label: "Admin Dashboard", path: "/admin", icon: Shield, exact: true },
    { label: "🤖 AI Assistant", path: "/admin/ai-assistant", icon: Sparkles },
    
    { label: "Ticket Center", isHeader: true },
    { label: "Manage Tickets", path: "/admin/complaints", icon: ClipboardList },
    { label: "Announcements", path: "/admin/notices", icon: Bell },
    { label: "Team Chat", path: "/admin/team-chat", icon: MessageSquare },
    { label: "Communication Center", path: "/admin/communication-center", icon: Network },
    { label: "Admin Management", path: "/admin/management", icon: UserCog },
    { label: "View Feedback", path: "/admin/feedback", icon: FileText },
    { label: "Help Center", path: "/admin/help", icon: BookOpen },
  ];

  return (
    <MeetingProvider>
      <DashboardLayout sidebarLinks={links}>
        <Outlet />
      </DashboardLayout>
      <MeetingOverlay />
    </MeetingProvider>
  );
}

function AuthRoute({ isAdmin }: { isAdmin: boolean }) {
  const { user, dbUser, loading } = useAuth();
  if (loading) return null;
  if (user && dbUser) {
    if (dbUser.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/dashboard" />;
  }
  return <AuthPage isAdmin={isAdmin} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/user" element={<AuthRoute isAdmin={false} />} />
          <Route path="/auth/admin" element={<AuthRoute isAdmin={true} />} />
          
          <Route path="/dashboard" element={<UserPortal />}>
            <Route index element={<UserDashboardStats />} />
            <Route path="register" element={<RegisterTicket />} />
            <Route path="my-complaints" element={<MyTickets />} />
            <Route path="my-tickets" element={<MyTickets />} />
            <Route path="drafts" element={<DraftTickets />} />
            <Route path="notices" element={<Notices />} />
            <Route path="notifications" element={<UserNotificationsView />} />
            <Route path="feedback" element={<UserFeedback />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<UserSettings />} />
            <Route path="ai-assistant" element={<AiAssistantPage />} />
            <Route path="help" element={<HelpCenter />} />
          </Route>

          <Route path="/admin" element={<AdminPortal />}>
            <Route index element={<AdminStats />} />
            <Route path="complaints" element={<ManageTickets />} />
            <Route path="tickets" element={<ManageTickets />} />
            <Route path="cases" element={<ManageTickets />} />
            <Route path="notices" element={<ManageNotices />} />
            <Route path="team-chat" element={<AdminTeamChat />} />
            <Route path="communication-center" element={<AdminCommunicationCenter />} />
            <Route path="management" element={<AdminManagement />} />
            <Route path="feedback" element={<ViewFeedback />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="ai-assistant" element={<AiAssistantPage />} />
            <Route path="help" element={<HelpCenter />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

