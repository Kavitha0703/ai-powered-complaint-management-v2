import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Mail, Lock, CheckCircle2, FileText, Bot, Calendar, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button.tsx";

export default function PrivacyPolicy() {
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
            Legal & Trust Center
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
        {/* Title Banner */}
        <div className="p-8 bg-gradient-to-br from-blue-900/10 via-slate-900/40 to-slate-900/60 border border-blue-500/20 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-blue-500 dark:text-blue-400">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs font-black uppercase font-mono tracking-widest">Privacy Policy & Data Security</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
            Effective Date: August 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p>
              Welcome to <strong>Workplace Hub (Digital Complaint Management System)</strong>. Your privacy and trust are paramount to us. This Privacy Policy explains how our platform collects, uses, protects, and handles information when you interact with our services.
            </p>
          </section>

          {/* Key Summary Highlight Callout */}
          <section className="p-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-black text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 text-blue-500" />
              <span>Authentication & Data Guarantee</span>
            </div>
            <p className="text-xs text-blue-950 dark:text-blue-200 font-medium leading-relaxed">
              We collect your email address only for authentication, account management, notifications, and platform functionality. We do not collect or store your passwords. Authentication credentials are securely managed by trusted providers such as Google OAuth and Supabase Authentication.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> 1. Information We Collect
            </h2>
            <p>
              We only collect information necessary to provide our digital workplace operations and ticketing services:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                "Name and Profile details (if provided or synced via OAuth)",
                "Email address (for authentication, notifications, and account management)",
                "Complaint and incident information submitted by you",
                "Files, documents, or images uploaded as part of complaints",
                "AI chatbot conversations and support query context",
                "Meeting schedules created through Google Calendar integration",
                "Google Meet video links generated by the platform",
                "Email notifications dispatched through the platform"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Information We DO NOT Collect */}
          <section className="space-y-4 p-6 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/60 dark:border-rose-900/30 rounded-2xl">
            <h2 className="text-base font-black text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-500" /> What We DO NOT Collect or Store
            </h2>
            <p className="text-xs font-medium text-rose-950 dark:text-rose-200">
              To ensure absolute privacy compliance and prevent credential mishandling, Workplace Hub never collects, stores, or accesses:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs font-semibold text-rose-900 dark:text-rose-300">
              <li>Your Google Account Password or third-party passwords</li>
              <li>Your personal email account password</li>
              <li>Credit card or payment card information</li>
              <li>Banking account numbers or financial credentials</li>
              <li>Government identification numbers or passports</li>
            </ul>
          </section>

          {/* AI Chatbot */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-500" /> 2. AI Assistant & Chatbot Conversations
            </h2>
            <p>
              Our AI Assistant (powered by Google Gemini) processes the conversations and ticket descriptions you choose to share. Chatbot conversations are processed temporarily to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <li>Predict incident categories, priority SLA ranks, and department assignments</li>
              <li>Provide accurate troubleshooting and guidance</li>
              <li>Understand complaint context for faster administrative triage</li>
              <li>Improve response quality and auto-resolution accuracy</li>
            </ul>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 pt-1">
              We do <strong>NOT</strong> sell chatbot conversations, share them with advertising networks, or use them for external marketing.
            </p>
          </section>

          {/* Google Services */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" /> 3. Google Services & Permissions
            </h2>
            <p>
              If you choose to connect your Google account, we request OAuth permissions strictly to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <li>Sign you in securely via official Google OAuth 2.0 flow</li>
              <li>Create Google Meet video links for administrative hearing sessions</li>
              <li>Schedule Google Calendar events for ticket resolutions</li>
              <li>Send email notifications that you explicitly trigger or request</li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              These permissions are used solely for requested features and comply with Google API Services User Data Policy, including Limited Use requirements.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">4. How We Use Your Information</h2>
            <p>Information collected is used strictly to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <li>Authenticate users and enforce role-based access controls</li>
              <li>Process and resolve workplace complaints and service tickets</li>
              <li>Send automated SLA status updates and notifications</li>
              <li>Schedule resolution calls via Google Meet / Calendar</li>
              <li>Maintain operational audit logs and system performance analytics</li>
            </ul>
          </section>

          {/* Security & Rights */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Data Security</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                We employ industry-standard SSL/TLS encryption in transit, strict row-level security policies, and credential tokenization to safeguard your data.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Your Rights</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                You maintain the right to view, update, export, or request deletion of your account profile and submitted complaint records at any time.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" /> Privacy & Security Contact
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                For privacy inquiries or data requests, contact our compliance team directly.
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
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms & Conditions</Link>
            <Link to="/about" className="hover:text-slate-300 transition-colors">About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
