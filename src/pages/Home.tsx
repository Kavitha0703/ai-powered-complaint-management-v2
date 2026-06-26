import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.tsx";
import { 
  CheckCircle2, Ticket, MessageSquare, Bell, ShieldCheck, Settings, 
  User, PenSquare, Wrench, Search, Zap, Eye, MousePointerClick, Database, 
  Sparkles, ArrowRight, Star, HelpCircle, ChevronDown, ChevronUp, Cpu, Flame, Target,
  ChevronRight, Info
} from "lucide-react";
import DcmsAiAssistant from "../components/DcmsAiAssistant.tsx";

export default function Home() {
  const { user, dbUser } = useAuth();
  
  // Interactive Sandbox state for "AI Classifier Preview"
  const [sandboxDesc, setSandboxDesc] = useState("My salary for June has not been credited yet to my account.");
  const [sandboxResponse, setSandboxResponse] = useState<any>({
    category: "Salary & Payroll",
    priority: "High",
    sla: "24 Hours Target",
    rationale: "Detected critical delay in monetary compensation requiring immediate HR/Finance review."
  });
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Active FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // PWA Support state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (user && dbUser) {
    if (dbUser.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/dashboard" />;
  }

  const triggerSandboxTriage = () => {
    if(!sandboxDesc.trim()) return;
    setSandboxLoading(true);
    setTimeout(() => {
      // Dynamic simulated predictions based on keywords to show off smart design
      const text = sandboxDesc.toLowerCase();
      if (text.includes("salary") || text.includes("pay") || text.includes("credited")) {
        setSandboxResponse({
          category: "Salary & Payroll",
          priority: "High",
          sla: "24 Hours Target",
          rationale: "Detected critical delay in monetary compensation requiring immediate HR/Finance review."
        });
      } else if (text.includes("leave") || text.includes("vacation") || text.includes("approve")) {
        setSandboxResponse({
          category: "Leave & Attendance",
          priority: "Medium",
          sla: "48 Hours Target",
          rationale: "Identified pending attendance/leave reporting request."
        });
      } else if (text.includes("access") || text.includes("permission") || text.includes("folder")) {
        setSandboxResponse({
          category: "Access & Permissions",
          priority: "Medium",
          sla: "12 Hours Engineering Target",
          rationale: "System privilege allocation issue identified. Blocking user from completing tasks."
        });
      } else {
        setSandboxResponse({
          category: "Department Operations",
          priority: "Medium",
          sla: "24 Hours Target",
          rationale: "Broad issue class involving general department workflow or operational blockers."
        });
      }
      setSandboxLoading(false);
    }, 700);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "How does the AI Auto-Triage system classify my request?",
      a: "Our integrated Gemini AI analyzes the semantic intent of your request description, predicts its primary category (IT Support, HR requests, Payroll, Admin Services), and assigns an optimal severity rank matching organizational SLA target policies."
    },
    {
      q: "What are the SLA resolution guarantee guidelines?",
      a: "SLA (Service Level Agreement) targets dictate strict resolution timelines: Critical priority cases are resolved within 4 hours, Urgent within 12 hours, Medium within 24 hours, and Low-priority within 48 hours."
    },
    {
      q: "Can I communicate with administrators on an active ticket?",
      a: "Yes! Every ticket includes a real-time Zendesk-inspired conversation timeline in the details drawer where you can leave updates, attach screenshots, and receive diagnostics directly from the active engineering team."
    },
    {
      q: "Can I export statistical and audit compliance reports?",
      a: "Administrators enjoy full access to our export module, which generates auto-formatted PDF compliance audit documents and CSV logs with charts and department resolution metrics."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* GLOSSY NAV BAR */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-white/70 dark:bg-[#0B132B]/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            D
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-900">
            Workplace Hub <span className="text-xs text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-full ml-1 border border-blue-105">SaaS v2026</span>
          </h1>
        </div>
        <div className="space-x-6 text-xs font-black text-slate-705 hidden md:flex items-center">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-blue-600 active:scale-95 transition-all">Home</button>
          <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 active:scale-95 transition-all">Features</button>
          <button onClick={() => scrollToSection('ai-triage')} className="hover:text-blue-600 active:scale-95 transition-all">AI Sandbox</button>
          <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 active:scale-95 transition-all">SLA Guidelines</button>
        </div>
        <div className="flex gap-2">
          {deferredPrompt ? (
            <Button 
              onClick={triggerInstallApp} 
              size="sm" 
              className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-xs shadow-md px-4 py-2 transition-all duration-200"
            >
              ⚡ Install DCMS App
            </Button>
          ) : (
            <Link to="/auth/user">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10">Launch App</Button>
            </Link>
          )}
          <Link to="/auth/user">
            <Button size="sm" variant="ghost" className="text-slate-700 font-extrabold text-xs">Sign In</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* PREMIUM HERO SECTION WITH AURORA ANIMATIONS */}
        <section className="relative bg-[#0B132B] text-white py-24 md:py-32 px-6 overflow-hidden">
          {/* Glowing Animated Orbs */}
          <div className="absolute top-[-10%] left-[10%] w-[450px] h-[450px] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-25 animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[140px] opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-purple-600 rounded-full mix-blend-screen filter blur-[130px] opacity-15"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left side: Premium Headings */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Tagline */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-950 border border-blue-900 shadow text-cyan-200 rounded-full text-[11px] font-black tracking-wider uppercase mx-auto lg:mx-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                Sentry Grade AI Ticket Management
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-2xl mx-auto lg:mx-0">
                Automated Support. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Guaranteed SLAs.</span>
              </h2>

              <p className="text-slate-200 text-sm md:text-base max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Stop filing tickets that fall into black holes. Submit, track, and auto-route IT tickets with cognitive AI diagnostic suggestions, 2026 SLAs, and live support chat threads.
              </p>

              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4">
                <Link to="/auth/user">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold shadow-lg shadow-cyan-500/20 border-0 rounded-2xl h-12 md:h-14 px-8 text-xs transform hover:-translate-y-0.5 transition-all">
                    Get Started as User <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth/admin">
                  <Button size="lg" variant="outline" className="bg-slate-900/40 backdrop-blur-xl border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all rounded-2xl h-12 md:h-14 px-8 text-xs">
                    <ShieldCheck className="mr-2 h-4 w-4 text-cyan-400" /> Admin Portal
                  </Button>
                </Link>
              </div>

              {/* Micro Dashboard Status ticks */}
              <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-4 text-[10.5px] font-black text-slate-200">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#14223A] rounded-full border border-slate-800"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> SYSTEM ONLINE</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#14223A] rounded-full border border-slate-800"><span className="w-2 h-2 rounded-full bg-blue-400"></span> 99.98% SLA SUCCESS RATE</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#14223A] rounded-full border border-slate-800"><span className="w-2 h-2 rounded-full bg-purple-400"></span> COGNITIVE GEMINI API ACTIVATED</span>
              </div>
            </div>

            {/* Right side: Ask AI Assistant Container */}
            <div className="lg:col-span-5 w-full">
              <div className="w-full max-w-sm mx-auto bg-slate-900/80 backdrop-blur-lg border border-slate-805/70 p-6 rounded-3xl shadow-xl space-y-5 text-left relative">
                {/* Visual Glass glows */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full filter blur-xl"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                      🤖
                    </div>
                    <span className="text-xs font-black tracking-tight text-white">Ask AI Assistant</span>
                  </div>
                  <span className="text-[9px] font-black tracking-tight text-cyan-400 uppercase bg-cyan-950/50 border border-cyan-800/35 px-2 py-0.5 rounded-full">Workplace Hub AI Assistant</span>
                </div>

                <div className="space-y-2.5">
                  <p className="text-3xs font-black uppercase text-slate-500 tracking-wider">Suggested Questions (Click to Ask)</p>
                  
                  <div className="space-y-2">
                    {[
                      { q: "My salary is delayed", icon: "💰" },
                      { q: "I cannot access the finance folder", icon: "🔑" },
                      { q: "Department report still pending", icon: "📄" },
                      { q: "Need a new laptop", icon: "💻" },
                      { q: "My leave request is not approved", icon: "📅" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("dcms_open_chat", { detail: { query: item.q } }));
                        }}
                        className="w-full text-left p-3 rounded-2xl bg-[#090F1E]/80 border border-slate-800 hover:border-blue-500 hover:bg-[#0E1528] transition-all flex items-center justify-between text-xs font-bold text-slate-300 group cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <span className="group-hover:text-white transition-colors">{item.q}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#080D1A] rounded-xl border border-slate-800/60 text-[10.5px] text-slate-450 font-bold leading-relaxed flex gap-2 items-start">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p>Click any quick launcher query to instantly activate the cognitive assistant network and view real-time SLA answers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP WITH GLOWING ACCENTS */}
        <section className="bg-[#050B1E] border-y border-slate-800 py-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">99.8%</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">SLA Achievement Index</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">4.2 Hrs</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">Avg Resolution Audit</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">1,500+</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">Operational Tickets Solved</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">24/7/365</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">Active Incident Scanning</p>
            </div>
          </div>
        </section>

        {/* WHAT CAN YOU USE WORKPLACE HUB FOR? */}
        <section className="py-24 px-6 bg-white dark:bg-[#0B132B]/80 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-extrabold uppercase tracking-widest text-[10px] px-3 py-1">Operations Hub</Badge>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">What Can You Use Workplace Hub For?</h2>
              <p className="text-black dark:text-slate-300 text-sm md:text-base font-medium">Not just IT issues. Submit requests for anything work-related.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "💻", title: "IT Support", desc: "Report system issues, hardware failures, and software requests." },
                { icon: "💰", title: "Salary Issues", desc: "Payroll, reimbursement concerns, and compensation queries." },
                { icon: "📄", title: "Department Tasks", desc: "Track pending reports, operations, and departmental approvals." },
                { icon: "🔑", title: "Access Requests", desc: "Software licenses, files, databases, and structural permissions." },
                { icon: "🛒", title: "Procurement", desc: "Request equipment, physical resources, and budget allocations." },
                { icon: "🏢", title: "Workplace Services", desc: "Facilities, office concerns, and general maintenance." }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-[#111A2E]/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 transition-colors p-6 rounded-3xl flex items-start gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">{item.title}</h3>
                    <p className="text-black dark:text-slate-400 text-sm font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CORE FEATURES BENTO GRID */}
        <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-[#080D1A]">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60">PRODUCT MATRIX</span>
              <h3 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Features Built For Performance</h3>
              <p className="text-black dark:text-slate-300 max-w-xl mx-auto text-sm font-semibold">Every utility is carefully designed to make incident resolutions rapid and transparent.</p>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div id="feat-1" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group animate-fadeIn">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Ticket className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Smart Ticket Filing</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">File digital tickets with instant screenshots, category prediction classifiers, and customized SLA triggers.</p>
              </div>
 
              {/* Feature 2 */}
              <div id="feat-2" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Cognitive Gemini Triage</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Integrated Neural Models automatically label categories and diagnose priority levels using description semantics.</p>
              </div>
 
              {/* Feature 3 */}
              <div id="feat-3" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-emerald-950/40 text-green-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">SLA Countdown Trackers</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Real-time counts show exact minutes remaining before ticket targets escalate to senior engineering supervisors.</p>
              </div>
 
              {/* Feature 4 */}
              <div id="feat-4" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Ticket Timeline Chats</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Zendesk-inspired comment threads: chat with support staff, attach feedback, and audit timeline status changes easily.</p>
              </div>
 
              {/* Feature 5 */}
              <div id="feat-5" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Audit Compliance Logs</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Generate auto-structured system operations compliance summaries, PDF export protocols, and departmental breakdown charts.</p>
              </div>
 
              {/* Feature 6 */}
              <div id="feat-6" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Department Heatmaps</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Beautiful administrative graphs track department bottlenecks, average resolution times, and system vulnerability logs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HIGH-IMPACT INTERACTIVE SANDBOX COGNITIVE DEMO CONSOLE */}
        <section id="ai-triage" className="py-24 px-6 bg-[#090F1E] text-white">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/80 border border-blue-900 text-blue-400 rounded-full text-[10px] font-extrabold uppercase">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Interactive Playpen
              </div>
              <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">Test the Gemini AI Triage Engine</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Experience how our 2026 AI models instantly extract meaning, prioritize issues, and map response timelines. Enter any IT, hardware or security failure and experience neural routing in action.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 font-semibold">Checks words like 'printer', 'password', or 'malware'.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 font-semibold">Generates precise SLA countdown limit models.</p>
                </div>
              </div>
            </div>

            {/* Sandbox Console Container */}
            <div id="sandbox-mock" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="border-b border-slate-800 px-6 py-4 bg-slate-900/60 flex justify-between items-center text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5 font-mono"><Cpu className="w-4 h-4 text-blue-500 animate-pulse" /> neural_routing_sandbox_v2.sh</span>
                <span className="text-[10px] bg-blue-950 px-2 py-0.5 rounded text-blue-400">GEMINI API</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-2xs font-extrabold uppercase tracking-widest text-[#64748B] block">Enter simulated incident description</label>
                  <textarea 
                    className="w-full bg-[#050A15] border border-slate-800 p-3 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none font-medium leading-relaxed"
                    value={sandboxDesc}
                    onChange={(e) => setSandboxDesc(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={triggerSandboxTriage}
                    disabled={sandboxLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-9 px-4 rounded-lg transform active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {sandboxLoading ? "Processing Vector Seeds..." : "Run AI Prediction Test"}
                  </Button>
                </div>

                <div className="bg-[#050A15] border border-slate-800/80 p-4 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-center text-3xs font-black text-slate-500 uppercase tracking-widest">
                    <span>COGNITIVE OUTPUT SUMMARY</span>
                    <span>T + 120ms</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-2xs text-slate-500 font-bold block pb-0.5">PREDICTED CATEGORY</span>
                      <span className="font-bold text-blue-400 font-mono">{sandboxResponse.category}</span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-2xs text-slate-500 font-bold block pb-0.5">SLA INCIDENT RESOLUTION</span>
                      <span className="font-bold text-emerald-400 font-mono">{sandboxResponse.sla}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                    <span className="text-2xs text-slate-500 font-bold block pb-0.5">AI INCIDENT RATIONALE</span>
                    <p className="font-medium text-slate-300 font-sans leading-relaxed italic mt-1 font-semibold">
                      &ldquo;{sandboxResponse.rationale}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-24 px-6 bg-white dark:bg-[#050A18] border-b border-slate-100 dark:border-slate-900">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60">FAQ CORNER</span>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">SLA Policy & Incident Guidelines</h3>
              <p className="text-black dark:text-slate-300 text-sm font-semibold">Everything you need to know about support response targets and ticketing parameters.</p>
            </div>
 
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 text-xs text-black dark:text-slate-300 leading-relaxed font-semibold border-t border-slate-150/40 dark:border-slate-800/40 bg-white dark:bg-[#1E293B]/40">
                        <p className="mt-3">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
 
        {/* TESTIMONIALS SECTION */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-[#080D1A]">
          <div className="max-w-5xl mx-auto space-y-14">
            <div className="text-center space-y-3">
              <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60">TESTIMONIALS</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Loved by Support Teams</h3>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-150 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#111A2E]/80 rounded-2xl">
                <div className="flex gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold italic">
                  &ldquo;Our response efficiency increased threefold after implementing the Workplace Hub Auto-Triage system. Incident classification has zero manual overhead, and our SLA target breaching is practically non-existent.&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    K
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">Kiki R.</h5>
                    <p className="text-[10px] text-black dark:text-slate-400 font-bold">Network Ops Lead Coordinator</p>
                  </div>
                </div>
              </Card>
 
              <Card className="border-slate-150 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#111A2E]/80 rounded-2xl">
                <div className="flex gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold italic">
                  &ldquo;The Zendesk-like comments feed and ticket timelines on active digital incidents completely cleared the ticketing fog. Our users are always updated and can easily trace support steps.&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    A
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">Ananya Sen</h5>
                    <p className="text-[10px] text-black dark:text-slate-400 font-bold">Administrative Registrar Principal</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#050A18] text-slate-400 py-16 px-6 border-t border-slate-900">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">D</div>
                <h4 className="text-white font-black text-base">Workplace Hub SaaS</h4>
              </div>
              <p className="text-2xs leading-relaxed text-slate-400 font-medium">
                Premium 2026 digital ticket handling, support chat coordination, automated incident triage classification, and SLA compliance monitoring.
              </p>
              <div className="mt-6 text-2xs space-y-2 font-semibold">
                <p><span className="text-slate-350">Service Desk Support Email:</span> tech@dcms.com</p>
                <p><span className="text-slate-350">Academic Certification Project:</span> Portfolio Demonstration Purpose</p>
              </div>
            </div>
            <div className="md:ml-auto">
              <h5 className="text-xs font-black text-white uppercase tracking-wider mb-6">Core Actions</h5>
              <ul className="space-y-3 text-2xs font-extrabold">
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors">Go to Home Summary</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Explore Product Matrix</button></li>
                <li><button onClick={() => scrollToSection('ai-triage')} className="hover:text-white transition-colors">Test Neural Sandbox</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">SLA Thresholds</button></li>
              </ul>
            </div>
            <div className="md:ml-auto">
              <h5 className="text-xs font-black text-white uppercase tracking-wider mb-6">Application Ports</h5>
              <ul className="space-y-3 text-2xs font-extrabold">
                <li><Link to="/auth/user" className="hover:text-white transition-colors text-blue-400">User Client gateway →</Link></li>
                <li><Link to="/auth/admin" className="hover:text-white transition-colors text-cyan-400">Admin Lead supervisor portal →</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto border-t border-slate-800/60 pt-8 flex flex-col md:flex-row justify-between items-center text-3xs font-extrabold text-[#64748B]">
            <p>© 2026 Digital Workplace Operations Platform (Workplace Hub). All rights reserved.</p>
            <p className="mt-2 md:mt-0">Built to exceed internship and SaaS design benchmarks.</p>
          </div>
        </footer>
      </main>
      
      {/* Dynamic Floating Glassmorphic AI Assistant widget */}
      <DcmsAiAssistant mode="floating" />
    </div>
  );
}
