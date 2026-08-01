import React from "react";
import { Link } from "react-router-dom";
import { Info, ArrowLeft, Sparkles, Shield, Cpu, Calendar, Mail, CheckCircle2, Zap, Network, Layers } from "lucide-react";
import { Button } from "../../components/ui/button.tsx";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-[#0B132B]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/favicon.svg" alt="Workplace Hub" className="w-9 h-9 object-contain rounded-xl shadow-sm" />
            <span className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Workplace Hub
            </span>
          </Link>
          <span className="hidden sm:inline-block text-[10px] text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/60 uppercase tracking-wider">
            About Platform
          </span>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Button>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Banner */}
        <div className="p-8 bg-gradient-to-br from-blue-900/20 via-slate-900/50 to-slate-900/80 border border-blue-500/20 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Info className="w-6 h-6" />
            </div>
            <span className="text-xs font-black uppercase font-mono tracking-widest">Digital Complaint Management System</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            About Workplace Hub
          </h1>
          <p className="text-sm font-medium text-slate-300 leading-relaxed max-w-2xl">
            An enterprise-grade, AI-powered workplace operations and digital ticket handling platform designed to automate incident classification, enforce SLA targets, and bridge employee concerns with administration.
          </p>
        </div>

        {/* Platform Overview */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" /> Platform Core Purpose
            </h2>
            <p>
              Workplace Hub transforms traditional, manual support desks into an intelligent, transparent workflow. By combining natural language understanding with real-time operational routing, the system ensures every employee issue—from salary queries and IT downtime to facilities requests—is triaged, assigned, and resolved within guaranteed timeframes.
            </p>
          </section>

          {/* Key Capabilities Matrix */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> AI Capabilities & Intelligence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider">
                  <Cpu className="w-4 h-4" /> Neural Auto-Triage
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically extracts key issues, detects sentiment, predicts categories, and maps tickets to appropriate departments instantly.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4" /> SLA Target Calculator
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Calculates strict resolution windows (Critical 4h, Urgent 12h, Medium 24h, Low 48h) to prevent SLA breaches.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Root Cause Analysis
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generates probable root cause explanations and tailored administrative recommendations for every logged incident.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> 24/7 AI Support Assistant
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  An embedded conversational agent guiding employees through ticket creation, draft management, and resolution status.
                </p>
              </div>
            </div>
          </section>

          {/* Google Services Integration */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" /> Seamless Google Workspace Integration
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Google OAuth 2.0", desc: "One-click authentication with interactive account chooser for Users and Admins." },
                { title: "Google Meet", desc: "Instantly create video conferencing links for hearing and resolution sessions." },
                { title: "Google Calendar", desc: "Schedule resolution appointments and deadline reminders on personal calendars." },
                { title: "Gmail Dispatch Center", desc: "Send automated email updates and ticket notifications directly to recipients." }
              ].map((item, idx) => (
                <li key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{item.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-snug">{item.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Technology Architecture */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" /> Technology Architecture
            </h2>
            <div className="p-5 bg-slate-900 text-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Frontend Stack:</span>
                <span className="text-blue-400 font-bold">React 18 + Vite + TypeScript + Tailwind CSS</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">AI Engine:</span>
                <span className="text-indigo-400 font-bold">Google Gemini SDK (@google/genai)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Authentication & Storage:</span>
                <span className="text-emerald-400 font-bold">Supabase + Google OAuth 2.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Icons & Animations:</span>
                <span className="text-cyan-400 font-bold">Lucide React + Motion</span>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" /> Get in Touch
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Have questions or feedback about Workplace Hub? Reach out directly.
              </p>
            </div>
            <a 
              href="mailto:nasikakavitha@gmail.com" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              nasikakavitha@gmail.com
            </a>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#050A18] text-slate-500 text-xs py-8 px-6 border-t border-slate-900 text-center font-extrabold">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Workplace Hub (Digital Complaint Management System). All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
