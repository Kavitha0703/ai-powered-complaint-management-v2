import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, ArrowLeft, X, Sparkles, HelpCircle, 
  Check, ChevronRight, Play, Award, Zap
} from "lucide-react";

export interface TourStep {
  selector?: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  interactive?: boolean;
}

const TOUR_ROUTES: Record<string, string> = {
  "home": "/",
  "employee": "/dashboard",
  "admin": "/admin",
  "meeting": "/admin/communication-center",
  "ai-assistant": "/dashboard/ai-assistant",
  "employee-register-complaint": "/dashboard/register",
  "employee-track-complaint": "/dashboard/my-complaints",
  "employee-ai-assistant": "/dashboard/ai-assistant",
  "employee-camera-scanner": "/dashboard/register",
  "employee-notifications": "/dashboard/notifications",
  "employee-profile": "/dashboard",
  "admin-dashboard-overview": "/admin",
  "admin-complaint-management": "/admin/complaints",
  "admin-reports": "/admin",
  "admin-analytics": "/admin",
  "admin-user-management": "/admin/management"
};

const TOURS: Record<string, TourStep[]> = {
  home: [
    {
      title: "👋 Welcome to Workplace Hub!",
      description: "This premium IT & Operations Support system helps employees report workplace issues, track real-time resolution compliance, and utilize cognitive AI triage networks.",
      position: "center"
    },
    {
      selector: "#tour-get-started-btn",
      title: "🚀 Portal Access",
      description: "Click 'Get Started as User' to access your personalized employee dashboard or 'Admin Portal' to step into the control room.",
      position: "bottom",
      interactive: true
    },
    {
      selector: "#ai-triage",
      title: "🧠 The AI Triage Playpen",
      description: "Experience the predictive diagnostics of the Gemini 2.5 Flash neural routing model on real operations tickets.",
      position: "top"
    },
    {
      selector: "#sandbox-mock textarea",
      title: "✍️ Write a Mock Complaint",
      description: "Enter any workplace malfunction—such as a printer jam, salary delay, or system login permissions hazard.",
      position: "top",
      interactive: true
    },
    {
      selector: "#tour-sandbox-classify-btn",
      title: "⚡ Trigger Classification",
      description: "Execute the live classifier test to extract sentiments, auto-correct typos, and instantly flag urgencies.",
      position: "top",
      interactive: true
    },
    {
      selector: "#features",
      title: "📊 Product Matrix",
      description: "Browse the modular feature grid comprising automated count-downs, Zendesk-inspired timelines, and audit charts.",
      position: "top"
    }
  ],
  employee: [
    {
      title: "👤 Welcome to the Employee Portal",
      description: "From this interactive dashboard, you can file operational incidents, track direct resolution queues, and get smart answers.",
      position: "center"
    },
    {
      selector: "#tour-new-ticket-btn",
      title: "✍️ Register an Incident",
      description: "Log detailed requests, specify departments, snap hardware pictures, or record automatic audio transcriptions.",
      position: "bottom",
      interactive: true
    },
    {
      selector: "#tour-user-kpis",
      title: "📈 Real-Time KPIs",
      description: "Review current counts of registered tickets categorized dynamically by pending, in-progress, and critical states.",
      position: "bottom"
    },
    {
      selector: "#tour-user-chart",
      title: "⏱️ SLA Performance Metrics",
      description: "Audit resolution response speed timelines calculated over the trailing 5 business days.",
      position: "top"
    },
    {
      selector: "#tour-user-track",
      title: "📂 Portal Support Tickets",
      description: "Your active cases appear here. Click any card to review support logs, post replies, rate resolution, or request escalations.",
      position: "top"
    },
    {
      selector: "#tour-sidebar-aiassistant",
      title: "🤖 Cognitive Assistant",
      description: "Activate the server-side AI model to search HR handbooks, draft requests, or analyze internal directory links.",
      position: "right",
      interactive: true
    },
    {
      selector: "#tour-notification-bell",
      title: "🔔 Real-Time Alert Center",
      description: "Check for emergency notices, status changes, or operational news broadcasts.",
      position: "bottom",
      interactive: true
    }
  ],
  admin: [
    {
      title: "💼 HQ Control Center",
      description: "Welcome to the administrative command portal. Oversee global tickets, publish news notices, check department bottlenecks, and allocate support staff.",
      position: "center"
    },
    {
      selector: "#tour-admin-kpis",
      title: "📊 Operational KPIs",
      description: "Monitor total intake counts, unresolved backlogs, active customer profiles, and average resolution speed indices.",
      position: "bottom"
    },
    {
      selector: "#tour-admin-charts",
      title: "📈 Trend Analysis",
      description: "Inspect department bottlenecks, weekly intake volumes, and system-wide resolution rate heatmaps.",
      position: "top"
    },
    {
      selector: "#tour-admin-table",
      title: "🛠️ Case Manager",
      description: "Review, assign, and update active complaints. Leverage pre-drafted AI answers to optimize resolution times.",
      position: "top"
    },
    {
      selector: "#tour-admin-export",
      title: "📋 Export PDF Reports",
      description: "Compile and download clean, compliance-ready records containing ticket histories.",
      position: "bottom",
      interactive: true
    },
    {
      selector: "#tour-sidebar-newsnotices",
      title: "📢 Publish Broadcasts",
      description: "Draft and post critical news directly to employee dashboard notice boards.",
      position: "right",
      interactive: true
    },
    {
      selector: "#tour-sidebar-aiassistant",
      title: "🧠 AI Workspace",
      description: "Use the advanced AI models to audit text patterns or polish correspondence.",
      position: "right",
      interactive: true
    }
  ],
  camera: [
    {
      title: "📷 Digital Document & Evidence Scanner",
      description: "This high-fidelity virtual scanner captures snapshots of physical equipment issues, leaks, or printed receipts with built-in OCR.",
      position: "center"
    },
    {
      selector: "#tour-camera-modes",
      title: "🎛️ Scanning Presets",
      description: "Toggle between specialized modes like Doc Scan, AI OCR, Low Light, and HD Detail for targeted image optimizations.",
      position: "bottom"
    },
    {
      selector: "#tour-camera-shutter",
      title: "🎯 Capture Shutter",
      description: "Trigger physical camera frames, or select a simulated template to instantly populate OCR text extraction.",
      position: "top",
      interactive: true
    },
    {
      selector: "#tour-camera-reset",
      title: "↺ Reset Canvas",
      description: "One-click reset to discard all active crops, rotations, brightness shifts, or custom annotations and revert to the original snapshot.",
      position: "top",
      interactive: true
    }
  ],
  meeting: [
    {
      title: "🎥 Interactive Meeting & Broadcast Center",
      description: "Step into the administrative hub. Manage targeted notice broadcasts, audit read-receipt delivery logs, and track staff metrics.",
      position: "center"
    }
  ],
  "ai-assistant": [
    {
      title: "🤖 Cognitive Assistant Workspace",
      description: "Interact with Gemini 2.5 Flash to automatically compose ticket drafts, retrieve administrative guidelines, and locate system contacts.",
      position: "center"
    }
  ],
  "employee-register-complaint": [
    {
      title: "🚀 Let's File a Ticket!",
      description: "We will guide you through registering a high-fidelity complaint in just a few quick steps.",
      position: "center"
    },
    {
      selector: "#tour-ticket-title",
      title: "📝 Subject Title",
      description: "Provide a clear, brief summary of the problem, like 'Kitchen microwave not heating'. Try to be descriptive.",
      position: "bottom",
      interactive: true
    },
    {
      selector: "#tour-ticket-segment",
      title: "🗂️ Target Segment",
      description: "Select the operational category of your complaint (e.g., IT Support, Facilities, HR).",
      position: "bottom",
      interactive: true
    },
    {
      selector: "#tour-ticket-severity",
      title: "🚨 Urgency Level",
      description: "Specify the severity (Low, Medium, Urgent, Critical) to prioritize resolution routing.",
      position: "bottom",
      interactive: true
    },
    {
      selector: "#tour-ticket-department",
      title: "🏢 Responsible Department",
      description: "Assign to the specific corporate department responsible for resolving this issue.",
      position: "bottom",
      interactive: true
    },
    {
      selector: "#tour-ticket-desc",
      title: "✍️ Operational Details",
      description: "Describe the incident details, logs, or steps leading to the malfunction.",
      position: "top",
      interactive: true
    },
    {
      selector: "#tour-ticket-attachments",
      title: "📎 Diagnostic attachments",
      description: "Drag and drop images, PDFs, or logs to provide supporting proof of the failure.",
      position: "top",
      interactive: true
    },
    {
      selector: "#tour-ticket-camera",
      title: "📷 Digital Live Scanner",
      description: "Snap real-time photo evidence using your device webcam or simulator with built-in AI OCR.",
      position: "top",
      interactive: true
    },
    {
      selector: "#tour-ticket-submit",
      title: "🚀 Submit Ticket File",
      description: "Click here to dispatch your ticket directly into the active department resolver queues.",
      position: "top"
    }
  ],
  "employee-track-complaint": [
    {
      selector: "#tour-user-track",
      title: "📂 Live Case Tracker",
      description: "All your active and historical support cases appear here. Track real-time progress logs, view SLAs, and post replies.",
      position: "top"
    }
  ],
  "employee-ai-assistant": [
    {
      selector: "#tour-sidebar-aiassistant",
      title: "🤖 Cognitive Assistant Workspace",
      description: "Open your custom AI companion. Ask Gemini to search employee manuals, draft reports, or auto-classify tasks.",
      position: "right",
      interactive: true
    }
  ],
  "employee-camera-scanner": [
    {
      selector: "#tour-ticket-camera",
      title: "📷 Live Document & OCR Scanner",
      description: "Use the built-in webcam scanner on the ticket submission page to read printed slips, decals, or serial codes.",
      position: "top",
      interactive: true
    }
  ],
  "employee-notifications": [
    {
      selector: "#tour-notification-bell",
      title: "🔔 Alert Center",
      description: "Check the bell icon for immediate updates on ticket state transitions and administrative notice board broadcasts.",
      position: "bottom",
      interactive: true
    }
  ],
  "employee-profile": [
    {
      selector: "#tour-profile-dropdown",
      title: "👤 Account Control",
      description: "Access your personalized department keys, active role settings, and sign-out buttons.",
      position: "bottom",
      interactive: true
    }
  ],
  "admin-dashboard-overview": [
    {
      selector: "#tour-admin-kpis",
      title: "📊 Executive Operational KPIs",
      description: "Inspect total ticket counts, unresolved backlogs, active customer profiles, and average resolution speed indices.",
      position: "bottom"
    },
    {
      selector: "#tour-admin-charts",
      title: "📈 Department Bottleneck Metrics",
      description: "Audit weekly intake volumes, pending queues, and resolution speed indices.",
      position: "top"
    }
  ],
  "admin-complaint-management": [
    {
      selector: "#tour-admin-table",
      title: "🛠️ Operations Case Manager",
      description: "Verify ticket assignments, update status, and apply pre-drafted AI answers to optimize resolutions.",
      position: "top"
    }
  ],
  "admin-reports": [
    {
      selector: "#tour-admin-export",
      title: "📋 Export PDF Reports",
      description: "Compile and download clean, compliance-ready records containing histories and SLAs.",
      position: "bottom",
      interactive: true
    }
  ],
  "admin-analytics": [
    {
      selector: "#tour-admin-charts",
      title: "📈 Dynamic Analytic Panels",
      description: "Review detailed charts for department workload balances and trend timelines.",
      position: "top"
    }
  ],
  "admin-user-management": [
    {
      selector: "#tour-sidebar-adminmanagement",
      title: "👥 Staff & User Permissions",
      description: "Configure support resolver access levels, manage teams, and verify company compliance logs.",
      position: "right",
      interactive: true
    }
  ]
};

const ArrowPointer = ({ position }: { position: "top" | "bottom" | "left" | "right" | "center" }) => {
  if (position === "center") return null;
  
  const bounceClass = "animate-[bounce_1.4s_infinite]";
  
  if (position === "bottom") {
    return (
      <div className={`absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-[99999] ${bounceClass}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_4px_8px_rgba(34,211,238,0.6)]">
          <path d="M12 20V4M12 4L6 10M12 4L18 10" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  if (position === "top") {
    return (
      <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-[99999] ${bounceClass}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_-4px_8px_rgba(34,211,238,0.6)]">
          <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  if (position === "right") {
    return (
      <div className={`absolute -left-6 top-1/2 -translate-y-1/2 flex items-center z-[99999] ${bounceClass}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-[4px_0_8px_rgba(34,211,238,0.6)]">
          <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  if (position === "left") {
    return (
      <div className={`absolute -right-6 top-1/2 -translate-y-1/2 flex items-center z-[99999] ${bounceClass}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-[-4px_0_8px_rgba(34,211,238,0.6)]">
          <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  return null;
};

export default function ProductTour() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [activeTip, setActiveTip] = useState<string | null>(null);
  const [isTipExpanded, setIsTipExpanded] = useState(false);

  const requestRef = useRef<number | null>(null);

  // Auto-start tours on route change
  useEffect(() => {
    const path = location.pathname;
    let tourName: string | null = null;
    
    if (path === "/") {
      tourName = "home";
    } else if (path === "/dashboard" || path === "/dashboard/") {
      tourName = "employee";
    } else if (path === "/admin" || path === "/admin/") {
      tourName = "admin";
    } else if (path === "/admin/communication-center") {
      tourName = "meeting";
    } else if (path.includes("/ai-assistant")) {
      tourName = "ai-assistant";
    }

    if (tourName === "home") {
      const welcomeSeen = localStorage.getItem("dcms_welcome_seen");
      const completed = localStorage.getItem(`dcms_tour_completed_${tourName}`);
      
      // Stop tutorial auto-start if welcome modal has been seen or tour completed
      if (!completed && !welcomeSeen) {
        const timer = setTimeout(() => {
          setActiveTour(tourName);
          setStepIndex(0);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname]);

  // Handle global triggers
  useEffect(() => {
    const handleStartTour = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.name) {
        const tourName = customEvent.detail.name;
        const targetRoute = TOUR_ROUTES[tourName];
        if (targetRoute && window.location.pathname !== targetRoute) {
          navigate(targetRoute);
          setTimeout(() => {
            setActiveTour(tourName);
            setStepIndex(0);
          }, 450); // allow route component to mount
        } else {
          setActiveTour(tourName);
          setStepIndex(0);
        }
      }
    };

    window.addEventListener("start-product-tour", handleStartTour);
    return () => {
      window.removeEventListener("start-product-tour", handleStartTour);
    };
  }, [navigate]);

  // Sync bounding boxes
  const updateBoundingRect = useCallback(() => {
    if (!activeTour) return;
    const steps = TOURS[activeTour];
    if (!steps) return;
    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    if (currentStep.selector) {
      const element = document.querySelector(currentStep.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
    
    requestRef.current = requestAnimationFrame(updateBoundingRect);
  }, [activeTour, stepIndex]);

  useEffect(() => {
    if (activeTour) {
      requestRef.current = requestAnimationFrame(updateBoundingRect);
      
      const steps = TOURS[activeTour];
      if (steps && steps[stepIndex]?.selector) {
        const element = document.querySelector(steps[stepIndex].selector);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    } else {
      setTargetRect(null);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [activeTour, stepIndex, updateBoundingRect]);

  // Handle window resize/scroll list
  useEffect(() => {
    const handleUpdate = () => {
      if (!activeTour) return;
      const steps = TOURS[activeTour];
      if (steps && steps[stepIndex]?.selector) {
        const element = document.querySelector(steps[stepIndex].selector);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      }
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
    };
  }, [activeTour, stepIndex]);

  // Lift highlighted element & track interactive try-it actions
  useEffect(() => {
    if (!activeTour) return;
    const steps = TOURS[activeTour];
    if (!steps) return;
    const currentStep = steps[stepIndex];
    if (!currentStep || !currentStep.selector) return;

    const element = document.querySelector(currentStep.selector) as HTMLElement;
    if (element) {
      const originalPosition = element.style.position;
      const originalZIndex = element.style.zIndex;
      const originalPointerEvents = element.style.pointerEvents;
      const originalTransition = element.style.transition;

      // Make element bright & fully interactive
      element.style.position = "relative";
      element.style.zIndex = "99996";
      element.style.pointerEvents = "auto";
      element.style.transition = "all 0.3s ease";
      element.classList.add("tour-highlighted-active");

      // Auto-advance if clicked
      const handleElementClick = () => {
        setTimeout(() => {
          handleNext();
        }, 150);
      };

      element.addEventListener("click", handleElementClick);

      return () => {
        element.style.position = originalPosition;
        element.style.zIndex = originalZIndex;
        element.style.pointerEvents = originalPointerEvents;
        element.style.transition = originalTransition;
        element.classList.remove("tour-highlighted-active");
        element.removeEventListener("click", handleElementClick);
      };
    }
  }, [activeTour, stepIndex]);

  // Contextual tips for inactivity (Passive)
  useEffect(() => {
    if (activeTour || activeTip) return;

    const tipShown = sessionStorage.getItem("dcms_session_tip_shown");
    if (tipShown) return; // Max 1 tip per session

    const suggestionsEnabled = localStorage.getItem("dcms_suggestions_enabled") !== "false";
    if (!suggestionsEnabled) return; // Respect preferences!
    
    const welcomeSeen = localStorage.getItem("dcms_welcome_seen");
    if (!welcomeSeen) return; // Don't show tips during initial onboarding
    
    const timer = setTimeout(() => {
      const path = location.pathname;
      let availableTips: string[] = [];

      if (path === "/") {
        availableTips = [
          "💡 Pro-Tip: Submit a test ticket in the AI Sandbox to preview automatic operations routing!",
          "💡 Fast-Track: Click 'Get Started' to test full employee recovery registers and live chats."
        ];
      } else if (path.includes("/dashboard")) {
        availableTips = [
          "💡 Pro-Tip: You can capture physical equipment evidence directly from your web camera!",
          "💡 Smart Assistant: Ask Gemini at the top right to analyze SLA timelines or search directories."
        ];
      } else if (path.includes("/admin")) {
        availableTips = [
          "💡 Admin Hack: Click 'Download PDF' to compile instant compliance reports of tickets.",
          "💡 AI Diagnostics: Select any case in the grid to review instant pre-drafted replies."
        ];
      }

      if (availableTips.length > 0) {
        const chosen = availableTips[Math.floor(Math.random() * availableTips.length)];
        setActiveTip(chosen);
        sessionStorage.setItem("dcms_session_tip_shown", "true");
      }
    }, 5000); // Wait 5 seconds after page load to show the tip bubble

    return () => clearTimeout(timer);
  }, [location.pathname, activeTour, activeTip]);

  if (!activeTour) {
    return (
      <AnimatePresence>
        {activeTip && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[99999] font-sans flex flex-col items-end"
          >
            {!isTipExpanded ? (
              <button
                onClick={() => setIsTipExpanded(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2 cursor-pointer transition-colors border border-blue-400/30"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold">AI Suggestions (1)</span>
              </button>
            ) : (
              <div className="max-w-sm bg-slate-900 border border-slate-800 text-white rounded-2xl p-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> SMART ADVICE
                  </span>
                  <button 
                    onClick={() => setActiveTip(null)}
                    className="w-5 h-5 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-200 pr-4">{activeTip}</p>
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={() => setActiveTip(null)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const steps = TOURS[activeTour];
  if (!steps) return null;
  const currentStep = steps[stepIndex];
  if (!currentStep) return null;

  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(`dcms_tour_completed_${activeTour}`, "true");
    setActiveTour(null);
    setStepIndex(0);
    setTargetRect(null);
  };

  // Calculate dynamic near-target positioning coordinates
  const getFloatingCardStyle = () => {
    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed" as const
      };
    }

    const margin = 22;
    const cardWidth = 320;
    const cardHeight = 180;
    
    let top = targetRect.bottom + margin;
    let left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);

    if (currentStep.position === "top") {
      top = targetRect.top - cardHeight - margin;
    } else if (currentStep.position === "bottom") {
      top = targetRect.bottom + margin;
    } else if (currentStep.position === "left") {
      top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
      left = targetRect.left - cardWidth - margin;
    } else if (currentStep.position === "right") {
      top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
      left = targetRect.right + margin;
    }

    // Boundary containment checks
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < margin) left = margin;
    if (left + cardWidth > viewportWidth - margin) {
      left = viewportWidth - cardWidth - margin;
    }
    if (top < margin) top = margin;
    if (top + cardHeight > viewportHeight - margin) {
      top = viewportHeight - cardHeight - margin;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: "fixed" as const,
      width: `${cardWidth}px`
    };
  };

  const renderProgressBlocks = () => {
    const blocks = [];
    for (let i = 0; i < steps.length; i++) {
      if (i <= stepIndex) {
        blocks.push(<span key={i} className="text-cyan-400 font-mono text-xs leading-none">■</span>);
      } else {
        blocks.push(<span key={i} className="text-slate-800 font-mono text-xs leading-none">□</span>);
      }
    }
    return (
      <div className="flex items-center gap-0.5 select-none font-mono">
        {blocks}
      </div>
    );
  };

  const cardStyle = getFloatingCardStyle();

  return (
    <>
      <style>{`
        @keyframes tourPulse {
          0% {
            box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.8), 0 0 10px rgba(34, 211, 238, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.95), 0 0 25px rgba(34, 211, 238, 0.7);
          }
          100% {
            box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.8), 0 0 10px rgba(34, 211, 238, 0.4);
          }
        }
        .tour-highlighted-active {
          animation: tourPulse 1.6s infinite !important;
          outline: none !important;
        }
      `}</style>

      {/* Transparent pointer-event blocker so only highlighted target can be clicked */}
      <div 
        onClick={handleSkip}
        className="fixed inset-0 z-[99990] bg-[#020617]/50 transition-all duration-300"
      />

      {/* Spotlight cutout overlay with a single gigantic box-shadow */}
      {targetRect && (
        <div 
          className="fixed pointer-events-none z-[99992] rounded-2xl transition-all duration-300"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.55), inset 0 0 15px rgba(34, 211, 238, 0.25)",
            border: "2px solid #22d3ee",
          }}
        >
          {/* Subtle heartbeat scanner animation */}
          <span className="absolute inset-0 border-2 border-cyan-400 rounded-xl animate-ping opacity-30" />
        </div>
      )}

      {/* Floating Interactive Explanation Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={cardStyle}
          className="bg-[#0B1329] border border-slate-800 text-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[99998] flex flex-col justify-between min-h-[190px] font-sans relative"
        >
          {/* Dynamic directional SVG bouncing pointer arrow */}
          {targetRect && <ArrowPointer position={currentStep.position} />}

          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
                <span>🌟 STEP {stepIndex + 1} OF {steps.length}</span>
                <span className="text-slate-700 font-normal">|</span>
                {renderProgressBlocks()}
              </span>
              <button 
                onClick={handleSkip}
                className="text-[9px] uppercase font-black tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer select-none"
                title="Skip onboarding guide"
              >
                Skip
              </button>
            </div>
            
            <h3 className="font-extrabold text-white text-sm tracking-tight leading-tight flex items-center gap-2">
              {currentStep.interactive && (
                <span className="px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-800 rounded text-[9px] font-extrabold text-cyan-400 font-mono animate-pulse shrink-0">
                  ⚡ TRY IT
                </span>
              )}
              {currentStep.title}
            </h3>
            
            <p className="text-slate-350 text-[11px] font-medium leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 mt-4">
            {/* SLA indicator */}
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-cyan-500" /> SLA SUPPORT
            </div>

            {/* Nav controls */}
            <div className="flex items-center gap-1.5">
              {stepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[11px] uppercase tracking-wider h-8 px-4 rounded-xl shadow-lg shadow-cyan-500/15 flex items-center gap-1 cursor-pointer select-none active:scale-95 transition-all"
              >
                <span>{isLastStep ? "Complete" : "Next"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-black shrink-0" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
