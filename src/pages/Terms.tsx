import React from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft, CheckCircle2, ShieldAlert, Scale, Sparkles, Calendar, Mail } from "lucide-react";
import { Button } from "../../components/ui/button.tsx";

export default function Terms() {
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
            Terms of Service
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
        <div className="p-8 bg-gradient-to-br from-indigo-900/10 via-slate-900/40 to-slate-900/60 border border-indigo-500/20 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-indigo-500 dark:text-indigo-400">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <span className="text-xs font-black uppercase font-mono tracking-widest">Platform Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms & Conditions
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
            Effective Date: August 2026
          </p>
        </div>

        {/* Terms Body */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <p>
              By accessing or using <strong>Workplace Hub (Digital Complaint Management System)</strong>, you agree to be bound by these Terms & Conditions. Please read them carefully before utilizing our platform services.
            </p>
          </section>

          {/* Acceptable Use */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" /> 1. Acceptable Use Policy
            </h2>
            <p>
              You agree to use this platform responsibly and in compliance with all applicable workplace policies and regulations.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs font-medium">
              <p className="font-bold text-slate-800 dark:text-slate-200 uppercase font-mono tracking-wider text-[10px]">Strictly Prohibited Activities:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>Uploading malicious software, viruses, or hazardous code</li>
                <li>Filing intentionally false, frivolous, or fraudulent complaints</li>
                <li>Harassing, threatening, or abusing administrators or team members</li>
                <li>Attempting unauthorized access to administrative or other users' portals</li>
                <li>Abusing or spamming AI assistant interfaces</li>
                <li>Interfering with or disrupting platform infrastructure or APIs</li>
              </ul>
            </div>
          </section>

          {/* User Accounts */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">2. User Accounts & Security</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their login credentials and for all activities that occur under their account.
            </p>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
              🔒 Note: Workplace Hub will never ask for your Google account password. Authentication is handled directly through Google OAuth or encrypted Supabase identity services.
            </p>
          </section>

          {/* AI Assistant */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" /> 3. AI Assistant & Guidance
            </h2>
            <p>
              AI-generated responses, categorizations, and SLA estimations provided by our integrated Gemini AI assistant are intended to assist users and accelerate administrative triage. Users and administrators should verify critical compliance decisions independently when necessary.
            </p>
          </section>

          {/* Google Integrations */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" /> 4. Google Integrations
            </h2>
            <p>
              Integrated features including Google Login, Google Meet video conferencing, Google Calendar scheduling, and Gmail dispatches are provided for user convenience. Availability and performance of these features are subject to Google Cloud service uptime.
            </p>
          </section>

          {/* Complaint Records & Ownership */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">5. Complaint Records & Audit Logging</h2>
            <p>
              Complaints and tickets submitted through the platform become part of the organization's official digital complaint management records. Submitting users are responsible for ensuring that all information provided in a ticket is accurate and complete.
            </p>
          </section>

          {/* Service Availability & Intellectual Property */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Service Availability</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                While we strive for 99.9% platform availability, Workplace Hub is provided "as is" and cannot guarantee uninterrupted service during scheduled maintenance windows or third-party outages.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Intellectual Property</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                All platform software, user interface designs, AI workflows, branding, and assets remain the exclusive intellectual property of Workplace Hub unless otherwise stated.
              </p>
            </div>
          </section>

          {/* Termination & Updates */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">6. Account Termination & Updates</h2>
            <p>
              Accounts that violate these acceptable use terms may be suspended or terminated by platform administrators. These Terms & Conditions may be updated as new platform features are introduced. Continued use of the platform constitutes acceptance of updated terms.
            </p>
          </section>

          {/* Contact Section */}
          <section className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" /> Questions About Terms?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                For questions regarding these Terms & Conditions or service agreements, reach out to our team.
              </p>
            </div>
            <a 
              href="mailto:nasikakavitha@gmail.com" 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
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
            <Link to="/about" className="hover:text-slate-300 transition-colors">About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
