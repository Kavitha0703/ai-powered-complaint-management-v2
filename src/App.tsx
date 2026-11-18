import { GoogleOAuthProvider } from '@react-oauth/google';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext.tsx";
import { LayoutDashboard, FileText, Bell, MessageSquare, ClipboardList, Shield, Layers, Sparkles, BookOpen, Network, UserCog, Mail, Calendar as CalendarIcon } from "lucide-react";

// Route-level code splitting so portals and auth pages load only what they need
const Home = lazy(() => import("./pages/Home.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout.tsx"));
const ProductTour = lazy(() => import("./components/ProductTour.tsx"));
const AppInstallModal = lazy(() => import("./components/AppInstallModal.tsx"));
const OnboardingWelcomeModal = lazy(() => import("./components/OnboardingWelcomeModal.tsx"));

const lazyUserPage = <K extends keyof typeof import("./pages/UserPages.tsx")>(name: K) =>
  lazy(() => import("./pages/UserPages.tsx").then((m) => ({ default: m[name] as React.ComponentType<any> })));

const lazyAdminPage = <K extends keyof typeof import("./pages/AdminPages.tsx")>(name: K) =>
  lazy(() => import("./pages/AdminPages.tsx").then((m) => ({ default: m[name] as React.ComponentType<any> })));

const UserDashboardStats = lazyUserPage("UserDashboardStats");
const RegisterTicket = lazyUserPage("RegisterTicket");
const MyTickets = lazyUserPage("MyTickets");
const Notices = lazyUserPage("Notices");
const UserFeedback = lazyUserPage("UserFeedback");
const UserProfile = lazyUserPage("UserProfile");
const UserSettings = lazyUserPage("UserSettings");
const DraftTickets = lazyUserPage("DraftTickets");
const UserNotificationsView = lazyUserPage("UserNotificationsView");

const AdminStats = lazyAdminPage("AdminStats");
const ManageTickets = lazyAdminPage("ManageTickets");
const ManageNotices = lazyAdminPage("ManageNotices");
const ViewFeedback = lazyAdminPage("ViewFeedback");
const AdminProfile = lazyAdminPage("AdminProfile");
const AdminSettings = lazyAdminPage("AdminSettings");

// Dynamic imports for secondary modules
const AdminCommunicationCenter = lazy(() => import("./pages/AdminCommunicationCenter.tsx"));
const AdminTeamChat = lazy(() => import("./pages/AdminTeamChat.tsx"));
const AiAssistantPage = lazy(() => import("./pages/AiAssistantPage.tsx"));
const HelpCenter = lazy(() => import("./pages/HelpCenter.tsx"));
const CalendarApp = lazy(() => import("./pages/CalendarApp.tsx"));
const AdminManagement = lazy(() => import("./pages/AdminManagement.tsx"));
const MailCenter = lazy(() => import("./pages/MailCenter.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const About = lazy(() => import("./pages/About.tsx"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full p-8 text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide text-slate-400">Loading module...</span>
      </div>
    </div>
  );
}


function FullScreenAuthLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#020617] text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide text-slate-400">Verifying session...</span>
      </div>
    </div>
  );
}

function UserPortal() {
  const { user, dbUser, loading } = useAuth();

  if (loading) return <FullScreenAuthLoader />;
  if (!user || !dbUser) return <Navigate to="/auth/user" replace />;
  if (dbUser.role === 'admin') return <Navigate to="/admin" replace />;

  const links = [
    { label: "Overview", isHeader: true },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "🤖 AI Assistant", path: "/dashboard/ai-assistant", icon: Sparkles },

    { label: "Service Desk", isHeader: true },
    { label: "Create Ticket", path: "/dashboard/register", icon: FileText },
    { label: "My Tickets", path: "/dashboard/my-complaints", icon: ClipboardList },
    { label: "Draft Tickets", path: "/dashboard/drafts", icon: Layers },
    { label: "Help Center", path: "/dashboard/help", icon: BookOpen },
    { label: "Calendar", path: "/dashboard/calendar", icon: CalendarIcon },

    { label: "Communication", isHeader: true },
    { label: "Announcements", path: "/dashboard/notices", icon: Bell },
    { label: "Notifications", path: "/dashboard/notifications", icon: Bell },
    { label: "Feedback", path: "/dashboard/feedback", icon: MessageSquare },
  ];

  return (
    <DashboardLayout sidebarLinks={links}>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}

function AdminPortal() {
  const { user, dbUser, loading } = useAuth();

  if (loading) return <FullScreenAuthLoader />;
  if (!user || !dbUser) return <Navigate to="/auth/admin" replace />;
  if (dbUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-slate-800">{"Access Denied"}</h1>
        <p className="text-slate-600 mt-2 text-center max-w-md">{"This account is not authorized as an administrator. Please contact your system administrator."}</p>
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
    { label: "Mail Center", path: "/admin/mail-center", icon: Mail },
    { label: "Admin Management", path: "/admin/management", icon: UserCog },
    { label: "Calendar", path: "/admin/calendar", icon: CalendarIcon },
    { label: "View Feedback", path: "/admin/feedback", icon: FileText },
    { label: "Help Center", path: "/admin/help", icon: BookOpen },
  ];

  return (
    <DashboardLayout sidebarLinks={links}>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}

function AuthRoute({ isAdmin }: { isAdmin?: boolean }) {
  const { user, dbUser, loading } = useAuth();
  if (loading) return <FullScreenAuthLoader />;
  if (user && dbUser) {
    if (dbUser.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  const hasInviteToken = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('token');
  return <AuthPage isAdmin={isAdmin ?? hasInviteToken} />;
}

function OAuthCallbackFallback() {
  const { user, dbUser, loading } = useAuth();

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
        window.opener.postMessage(
          {
            type: 'SUPABASE_OAUTH_CALLBACK',
            hash: window.location.hash || '',
            search: window.location.search || '',
          },
          window.location.origin
        );
        window.close();
      }
    } catch {
      // Ignore opener access errors
    }
  }, []);

  if (loading) return <FullScreenAuthLoader />;
  if (user && dbUser) {
    return <Navigate to={dbUser.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  return <Navigate to={`/auth/user${search}${hash}`} replace />;
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "1234567890-mock.apps.googleusercontent.com"}>
    <AuthProvider>
      
        <BrowserRouter>
          <Suspense fallback={null}>
            <ProductTour />
            <AppInstallModal />
            <OnboardingWelcomeModal />
          </Suspense>
          <InstallSuccessModal />
        <Suspense fallback={<FullScreenAuthLoader />}>
          <Routes>
            
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<About />} />
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/auth/user" element={<AuthRoute isAdmin={false} />} />
            <Route path="/auth/admin" element={<AuthRoute isAdmin={true} />} />
            <Route path="/auth/callback" element={<OAuthCallbackFallback />} />
            
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
              <Route path="calendar" element={<CalendarApp />} />
            </Route>

            <Route path="/admin" element={<AdminPortal />}>
              <Route index element={<AdminStats />} />
              <Route path="complaints" element={<ManageTickets />} />
              <Route path="tickets" element={<ManageTickets />} />
              <Route path="cases" element={<ManageTickets />} />
              <Route path="notices" element={<ManageNotices />} />
              <Route path="team-chat" element={<AdminTeamChat />} />
              <Route path="communication-center" element={<AdminCommunicationCenter />} />
              <Route path="mail-center" element={<MailCenter />} />
              <Route path="management" element={<AdminManagement />} />
              <Route path="calendar" element={<CalendarApp />} />
              <Route path="feedback" element={<ViewFeedback />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="ai-assistant" element={<AiAssistantPage />} />
              <Route path="help" element={<HelpCenter />} />
              <Route path="calendar" element={<CalendarApp />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
        </BrowserRouter>
      
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

