import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext.tsx";
import { Sparkles, X, Check, ArrowRight, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function OnboardingWelcomeModal() {
  const { dbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [optOut, setOptOut] = useState(false);

  useEffect(() => {
    if (!dbUser) {
      setIsOpen(false);
      return;
    }

    const welcomeSeen = localStorage.getItem("dcms_welcome_seen") === "true";
    const optOutStored = localStorage.getItem("dcms_onboarding_opt_out") === "true";

    if (!welcomeSeen && !optOutStored) {
      // Auto-trigger with a clean, professional delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [dbUser]);

  const handleStartTour = () => {
    if (optOut) {
      localStorage.setItem("dcms_onboarding_opt_out", "true");
    }
    localStorage.setItem("dcms_welcome_seen", "true");
    setIsOpen(false);

    // Trigger the correct tour based on the user's role
    const tourName = dbUser?.role === "admin" ? "admin" : "employee";
    window.dispatchEvent(new CustomEvent("start-product-tour", { detail: { name: tourName } }));
  };

  const handleSkip = () => {
    if (optOut) {
      localStorage.setItem("dcms_onboarding_opt_out", "true");
    }
    localStorage.setItem("dcms_welcome_seen", "true");
    setIsOpen(false);
  };

  if (!isOpen || !dbUser) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/40 dark:bg-[#020617]/70 backdrop-blur-xs z-[99998] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden font-sans relative"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-500">Workspace Hub</span>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 leading-tight">
                  Welcome to Workplace Hub 👋
                </h3>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-350 leading-relaxed mb-5">
              Would you like a quick <strong className="text-slate-800 dark:text-slate-200">3-minute interactive tour</strong>? We can highlight the real-time SLA monitors, automated complaint registration flow, digital camera evidence logs, and our cognitive AI helper workspace.
            </p>

            {/* Quick Tour Highlights */}
            <div className="space-y-2 mb-6">
              {[
                "Learn how to file & track your operational tickets",
                "Explore real-time SLA timers & priority queues",
                "Discover how to snap physical evidence with the webcam",
                "Meet your Gemini AI diagnostic help copilot"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Opt-Out Checkbox */}
            <label className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/80 rounded-xl transition-all cursor-pointer mb-6 select-none border border-slate-100/40 dark:border-slate-900/30">
              <input
                type="checkbox"
                checked={optOut}
                onChange={(e) => setOptOut(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Don't show this message automatically again
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              >
                Skip for Now
              </button>
              <button
                type="button"
                onClick={handleStartTour}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all hover:translate-x-0.5 cursor-pointer"
              >
                Start Tour <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
