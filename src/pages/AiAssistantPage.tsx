import React from "react";
import DcmsAiAssistant from "../components/DcmsAiAssistant.tsx";
import { Sparkles, HelpCircle, Cpu, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/AuthContext.tsx";

export default function AiAssistantPage() {
  const { dbUser } = useAuth();
  const isAdmin = dbUser?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Dynamic Upper Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent dark:from-blue-900/20 dark:via-indigo-900/20 rounded-3xl border border-blue-500/10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {isAdmin ? "Supervisory Co-Pilot" : "Personalized Desk AI"}
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {isAdmin ? "Admin DCMS AI Assistant Portal" : "🤖 DCMS AI Assistant"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            {isAdmin 
              ? "Your direct assistant to analyze support volume, check department benchmarks, query SLAs, and inspect notification alerts." 
              : "Solve system locks, reset credentials, learn how to check target SLAs, or fast-track a pre-filled incident ticket with smart triage."
            }
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2.5">
          <div className="px-4 py-2 bg-slate-105 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-mono font-bold text-slate-550 dark:text-slate-400">Gemini LLM Activated</span>
          </div>
        </div>
      </div>

      {/* Main ChatGPT-Style Page Component */}
      <div className="rounded-3xl shadow-lg border border-slate-205 dark:border-slate-805 bg-white dark:bg-[#080B14]">
        <DcmsAiAssistant mode="page" />
      </div>
    </div>
  );
}
