/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProductTour from "./components/ProductTour.tsx";
import AppInstallModal from "./components/AppInstallModal.tsx";
import OnboardingWelcomeModal from "./components/OnboardingWelcomeModal.tsx";
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
           <h1 className="text-3xl font-bold text-slate-800">{"Access Denied"}</h1>
           <p className="text-slate-600 mt-2">{"Only authorized administrator accounts can access this portal."}</p>
           <a href="/dashboard" className="mt-6 text-primary-600 hover:underline">{"Return to Dashboard"}</a>
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


import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

function InstallSuccessModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleInstall = () => {
      console.log("PWA Installed");
      setShow(true);
    };
    window.addEventListener('appinstalled', handleInstall);
    
    // Check if we need to show it from a previously saved state
    if (localStorage.getItem('showInstallSuccess') === 'true') {
      setShow(true);
      localStorage.removeItem('showInstallSuccess');
    }
    
    return () => window.removeEventListener('appinstalled', handleInstall);
  }, []);

  const handleOpenApp = () => {
    setShow(false);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      window.location.href = "/";
    } else {
      window.location.replace("/");
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-sm z-[10001] transition-all flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          className="bg-[#0B1329] border border-slate-800 text-white rounded-3xl w-full max-w-sm pointer-events-auto shadow-2xl overflow-hidden font-sans p-8 text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Workplace Hub!</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your AI-powered workplace operations assistant has been installed successfully.
          </p>
          <div className="text-left space-y-2 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Works offline
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant AI assistance
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time notifications
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure management
            </div>
          </div>
          <button 
            onClick={handleOpenApp}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl transition-colors cursor-pointer"
          >
            Open Workplace Hub
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function App() {

    
  return (
    <AuthProvider>
      
        <BrowserRouter>
          
          <ProductTour />
          <AppInstallModal />
          <OnboardingWelcomeModal />
          <InstallSuccessModal />
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

