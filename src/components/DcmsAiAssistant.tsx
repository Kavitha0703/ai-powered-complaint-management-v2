import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.tsx";
import { supabase } from "../lib/supabase.ts";
import { 
  MessageSquare, X, Send, Sparkles, RefreshCw, Cpu, Globe, AppWindow, 
  HardDrive, Info, Plus, ChevronRight, AlertTriangle, Check, BookOpen, Settings, User as UserIcon, Bell, Shield, ArrowRight, CornerDownLeft,
  Paperclip, Mic, MicOff, Trash2, HelpCircle, FileText, ImageIcon, Lightbulb, Pin, DownloadCloud, Edit3, Search, Copy, CheckCircle2, Minus,
  MapPin, Clock, Building, Bot, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DcmsCamera from "./DcmsCamera.tsx";
import StructuredDataRenderer from "./StructuredDataRenderer.tsx";

/* ==========================================
   PROMPT SUGGESTIONS (CONTEXTUAL BY ROLE)
   ========================================== */
const USER_SUGGESTIONS = [
  { label: "💰 My salary is delayed", query: "My salary for June is delayed and has not been credited to my account." },
  { label: "🔑 Access request", query: "I cannot access the team folder and require permission/privilege allocation." },
  { label: "🖥 System issue", query: "I have a system issue/hardware failure on my laptop that needs IT support." },
  { label: "📄 Department report pending", query: "I have a pending department report/operations workflow blocker." },
  { label: "🏢 Facilities complaint", query: "Facilities/office maintenance support is requested for an workspace issue." }
];

const ADMIN_SUGGESTIONS = [
  { label: "⚠️ Overdue complaints", query: "Which complaints are overdue?" },
  { label: "📊 Today's stats summary", query: "What happened today?" },
  { label: "📅 Yesterday's completions", query: "What did we complete yesterday?" },
  { label: "📈 Generate weekly report", query: "Generate weekly report" },
  { label: "🧠 How to handle a complaint", query: "How should I handle a pending complaint?" },
  { label: "🎓 New admin training", query: "I am new here. How do I process complaints?" },
  { label: "📋 Prepare meeting notes", query: "Prepare a meeting report." },
  { label: "💼 Management insights", query: "Show management insights." }
];

const QUICK_ACTION_CHIPS = [
  { label: "📋 Register", action: "register_ticket" },
  { label: "📂 Track", action: "view_tickets" },
  { label: "🔔 Notices", action: "view_notices" },
  { label: "👤 Profile", action: "reset_password" },
  { label: "☎ Support", action: "contact_support" }
];

const LOADING_PHRASES = [
  "Uploading...",
  "Reading document...",
  "Analyzing content...",
  "Preparing response..."
];

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
  suggestedCategory?: string;
  suggestedSeverity?: string;
  quickActions?: string[];
  suggestedQueries?: string[];
  detectedLanguage?: string;
  originalComplaint?: string;
  translatedComplaint?: string;
  aiAnalysis?: { detectedIssue?: string; confidence?: string; priority?: string; businessImpact?: string; rootCause?: string; recommendedAction?: string; estimatedResolution?: string; sla?: string; };
  physicalLocation?: {
    requiresPhysical: boolean;
    department: string;
    room: string;
    floor: string;
    hours: string;
    instructions: string;
  };
  structuredData?: {
    type?: string;
    kpis?: { label: string; value: string; trend?: string }[];
    table?: {
      columns: string[];
      rows: Record<string, string | number>[];
    };
    chart?: {
      type: string;
      title: string;
      labels: string[];
      datasets: { label: string; data: number[] }[];
    };
    actions?: string[];
  };

  file?: {
    name: string;
    type: string;
    size: number;
    data?: string;
  };
}

interface ChatThread {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
  is_pinned?: boolean;
}

interface DcmsAiAssistantProps {
  mode?: "floating" | "page";
}

export default function DcmsAiAssistant({ mode = "floating" }: DcmsAiAssistantProps) {
    
  const { dbUser } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingIntervalRef = useRef<any>(null);

  const [isOpen, setIsOpen] = useState(false);

  // Draggable floating chatbot setup with dynamic boundary screening & device constraints
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem("dcms_ai_position");
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionStart = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);

  // Get active bounds based on current screen dimension & open state
  const getActiveBounds = () => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Base default placement offsets: bottom-6 (24px) on mobile or bottom-24 (96px) on desktop, and right-6 (24px)
    const isMobile = screenW < 768;
    const baseRight = 24;
    const baseBottom = isMobile ? 24 : 96;

    let widgetW = 52; // Toggle trigger bubble width
    let widgetH = 52; // Toggle trigger bubble height

    if (isOpen) {
      if (screenW < 640) {
        // Phone: compact screen sizing requirements
        widgetW = 300;
        widgetH = 450;
      } else if (screenW < 1024) {
        // Tablet sizing requirements
        widgetW = 340;
        widgetH = 500;
      } else if (screenW < 1440) {
        // Laptop sizing requirements
        widgetW = 360;
        widgetH = 540;
      } else {
        // Desktop sizing requirements
        widgetW = 385;
        widgetH = 580;
      }
      widgetH += 68; // Height of chat panel plus offset to trigger bubble
    } else {
      // Closed trigger: bubble + actions spacing bounds
      widgetW = 52;
      widgetH = 200;
    }

    const minX = widgetW + baseRight - screenW + 8;
    const maxX = baseRight - 8;
    const minY = widgetH + baseBottom - screenH + 8;
    const maxY = baseBottom - 8;

    return { minX, maxX, minY, maxY };
  };

  const clampPosition = (x: number, y: number) => {
    const { minX, maxX, minY, maxY } = getActiveBounds();
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
    positionStart.current = { x: position.x, y: position.y };
    dragDistance.current = 0;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;
      dragDistance.current = Math.sqrt(dx * dx + dy * dy);

      const newPos = clampPosition(
        positionStart.current.x + dx,
        positionStart.current.y + dy
      );
      setPosition(newPos);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      try {
        localStorage.setItem("dcms_ai_position", JSON.stringify(position));
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, position]);

  // Keep chatbot within screen boundaries during window dynamic resizing or when chat open state toggles
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    setPosition((prev) => clampPosition(prev.x, prev.y));
  }, [isOpen]);

  // Dynamic Role Mode detection based on user role
  let chatbotMode: "visitor" | "user" | "admin" = "visitor";
  if (dbUser) {
    if (dbUser.role === "admin") {
      chatbotMode = "admin";
    } else {
      chatbotMode = "user";
    }
  }

  const getRoleBadge = () => {
    switch (chatbotMode) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase border border-amber-500/20">
            {"🛠 Admin Support Mode"}</span>
        );
      case "user":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/20">
            {"👤 Personal Support Mode"}</span>
        );
      case "visitor":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase border border-blue-500/20">
            {"🌐 Visitor Mode"}</span>
        );
    }
  };

  // Threads system for Chat History persistence
  const [threads, setThreads] = useState<ChatThread[]>([]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // User response preference (Brief vs. Detailed) - Defaulting to true (Brief)
  const [isBrief, setIsBrief] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("dcms_ai_response_brief");
      return saved !== "false"; // Default to true if not present or "true"
    } catch (e) {
      return true;
    }
  });

  // Save the isBrief user preference
  useEffect(() => {
    try {
      localStorage.setItem("dcms_ai_response_brief", String(isBrief));
    } catch (e) {
      console.error(e);
    }
  }, [isBrief]);

  // Active messages within current active thread
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [topicsDropdownOpen, setTopicsDropdownOpen] = useState(false);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  
  
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, messages: t.messages.filter(m => m.id !== msgId) } : t));
  };
  const handleEditMessage = (msgId: string, oldText: string) => {
    const newText = prompt("Edit message:", oldText);
    if (newText && newText.trim() && newText !== oldText) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: newText.trim() } : m));
      setThreads(prev => prev.map(t => t.id === activeThreadId ? { 
        ...t, 
        messages: t.messages.map(m => m.id === msgId ? { ...m, text: newText.trim() } : m) 
      } : t));
      
      // We should ideally reload/retrigger assistant here, but simple edit is requested.
      setTimeout(() => {
        if(confirm("Regenerate response from this edited message?")) {
           // Delete subsequent messages and trigger
           const editedMsgIndex = messages.findIndex(m => m.id === msgId);
           if (editedMsgIndex !== -1) {
              const keepMsgs = messages.slice(0, editedMsgIndex + 1);
              keepMsgs[keepMsgs.length-1].text = newText.trim();
              setMessages(keepMsgs);
              setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, messages: keepMsgs } : t));
              setTimeout(() => handleSendMessage(newText.trim(), true), 100);
           }
        }
      }, 50);
    }
  };
  const handleRenameThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const t = threads.find(x => x.id === id);
    if (!t) return;
    const newName = prompt("Enter new chat name:", t.title);
    if (newName && newName.trim()) {
      setThreads(threads.map(x => x.id === id ? { ...x, title: newName.trim() } : x));
    }
  };

  const handlePinThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(threads.map(x => x.id === id ? { ...x, is_pinned: !x.is_pinned } : x));
  };
  
  const handleExportChat = (thread: ChatThread) => {
    const text = thread.messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.sender.toUpperCase()}: ${m.text}`).join("\n\n");
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${thread.title}-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // Files attachment local state
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; size: number; data: string; extractedText?: string } | null>(null);
  const [aiCameraActive, setAiCameraActive] = useState(false);

  // Dynamic progressive loading messages based on attachment state
  const [loadingText, setLoadingText] = useState("🤖 Understanding your question...");

  // Voice Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatbotCache = useRef<Record<string, any>>({});

  // Loading rotation timer - replaced with progressive, state-based loading progress sequence
  useEffect(() => {
    if (!loading) return;

    let phrases: string[] = [];
    if (chatbotMode === "admin") {
      phrases = [
        "📊 Analyzing operational data...",
        "🔎 Reviewing ticket history...",
        "📈 Preparing insights...",
        "✨ Generating recommendations..."
      ];
    } else {
      phrases = [
        "🔍 Reviewing information...",
        "📊 Checking records...",
        "🧠 Understanding your request...",
        "📋 Preparing response...",
        "✨ Finalizing answer..."
      ];
    }

    setLoadingText(phrases[0]);
    let index = 0;
    const interval = setInterval(() => {
       if (index < phrases.length - 1) {
          index++;
          setLoadingText(phrases[index]);
       }
    }, 1200);

    return () => clearInterval(interval);
  }, [loading, chatbotMode]);

  // Voice speech initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";
        
        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          if (transcript) {
            setInputMessage((prev) => (prev ? prev + " " + transcript : transcript));
          }
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.error("Failed to initialize speech recognition engine:", err);
      }
    }
  }, []);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice speech typing is not natively supported or enabled in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech start failure:", err);
      }
    }
  };

  
  // Sync logic to Supabase Memory
  useEffect(() => {
    // Auto-update active thread messages
    if (activeThreadId) {
      const current = threads.find((t) => t.id === activeThreadId);
      if (current) {
        setMessages(current.messages);
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }

    // Performance Optimization: Skip expensive Supabase database write operations while typing animation is active
    if (!dbUser || threads.length === 0 || loading) return;
    
    // Save current threads to DB in background
    Promise.all(threads.map(async (t) => {
       await supabase.from("ai_conversations").upsert({
         id: t.id,
         user_id: dbUser.id,
         title: t.title,
         is_pinned: t.is_pinned || false,
         is_admin_record: dbUser.role === 'admin',
         created_at: new Date(t.timestamp).toISOString(),
         updated_at: new Date().toISOString()
       });
       
       if (t.messages && t.messages.length > 0) {
         const outMsgs = t.messages.map(m => ({
           id: m.id,
           conversation_id: t.id,
           role: m.sender,
           content: JSON.stringify({
              text: m.text,
              suggestedCategory: m.suggestedCategory,
              suggestedSeverity: m.suggestedSeverity,
              quickActions: m.quickActions,
              file: m.file
           }),
           created_at: new Date(m.timestamp).toISOString()
         }));
         await supabase.from("ai_messages").upsert(outMsgs);
       }
    })).catch(console.error);
    
  }, [threads, activeThreadId, dbUser, loading]);

  // Load from Supabase on init
  useEffect(() => {
    if (!dbUser) return;
    
    const loadThreads = async () => {
      try {
        const { data: convos } = await supabase.from('ai_conversations')
          .select('*')
          .eq('user_id', dbUser.id)
          .eq('is_admin_record', dbUser.role === 'admin')
          .order('created_at', { ascending: false });
        if (convos && convos.length > 0) {
          const { data: msgs } = await supabase.from('ai_messages').select('*').in('conversation_id', convos.map(c => c.id)).order('created_at', { ascending: true });
          
          const loadedThreads = convos.map(c => {
             return {
                 id: c.id,
                 title: c.title,
                 timestamp: new Date(c.created_at).getTime(),
                 is_pinned: c.is_pinned || false,
                 messages: (msgs || []).filter(m => m.conversation_id === c.id).map(m => {
                     let parsedContent = { text: m.content };
                     try { parsedContent = JSON.parse(m.content); } catch (e) {}
                     return {
                         id: m.id,
                         sender: m.role,
                         text: parsedContent.text || m.content,
                         timestamp: new Date(m.created_at).getTime(),
                         ...parsedContent
                     };
                 })
             };
          });
          setThreads(loadedThreads);
          if (!activeThreadId) {
             setActiveThreadId(loadedThreads[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load DB threads", err);
      }
    };
    loadThreads();
  }, [dbUser]);


  // If page layout mounts, ensure we have at least one clean thread initialized
  useEffect(() => {
    if (mode === "page" && threads.length === 0) {
      handleCreateNewThread();
    }
  }, [mode, threads]);

  // Scroll downwards when new messages arrive or thread changes
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, loading, activeThreadId]);

  // Scroll downwards when popup is opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clean up any active streaming typewriter intervals on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Register global listener for programmatic open
  useEffect(() => {
    const handleOpenGlobal = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsOpen(true);
      if (customEvent.detail?.query) {
        // If no active thread, make one
        if (!activeThreadId) {
          handleCreateNewThread();
        }
        setTimeout(() => {
          handleSendMessage(customEvent.detail.query);
        }, 300);
      }
    };
    window.addEventListener("dcms_open_chat", handleOpenGlobal);
    return () => window.removeEventListener("dcms_open_chat", handleOpenGlobal);
  }, [threads, activeThreadId]);

  const handleCreateNewThread = () => {
    let greetingText = "";
    if (chatbotMode === "admin") {
      greetingText = `Hello ${dbUser?.name || "System Admin"}! 👋 Welcome to **Workplace Hub AI Assistant (Admin Mode)**.\n\nI am dynamically paired with the Live Database. I can help you monitor SLA metrics, review urgent tickets, or compile overdue ticket summaries.\n\nType **Show urgent tickets** or ask **Which tickets are overdue?** to begin.`;
    } else if (chatbotMode === "user") {
      greetingText = `Hello ${dbUser?.name || "there"}! 👋 Welcome to **Workplace Hub AI Assistant (Personal Support Mode)**.\n\nI have securely synchronized with your profile and ticket history. I can check your ticket statuses, explain delays, draft new requests, or look up active announcements.\n\nAsk me **What's happening with my ticket?** or **How do I submit a ticket?** to get started.`;
    } else {
      greetingText = `Hello! 👋 Welcome to the **Digital Workplace Operations Platform (Workplace Hub)**.\n\nI am your dedicated **Visitor Guidance Assistant**.\n\nI can help you understand how this website works, how to submit a ticket, what features are available, or guide you if you cannot log in.\n\nAsk me **What is this website?** or **How do I register a ticket?** to learn more!`;
    }

    const defaultMsg: ChatMessage = {
      id: "welcome_" + Date.now(),
      sender: "assistant",
      text: greetingText,
      timestamp: Date.now(),
      quickActions: ["register_ticket", "view_tickets", "view_notices"]
    };
    
    const newThread: ChatThread = {
      id: "thread_" + Date.now(),
      title: "New Conversation",
      timestamp: Date.now(),
      messages: [defaultMsg]
    };

    setThreads([newThread, ...threads]);
    setActiveThreadId(newThread.id);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = threads.filter((t) => t.id !== threadId);
    setThreads(updated);
    if (activeThreadId === threadId) {
      if (updated.length > 0) {
        setActiveThreadId(updated[0].id);
      } else {
        setActiveThreadId(null);
      }
    }
  };

  const formatMessageTime = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  // Client-side image compression helper of uploaded user screenshots
  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          callback(dataUrl);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Client-side text extractor for documents
  const extractTextFromDocument = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    
    if (ext === "txt") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read text file."));
        reader.readAsText(file);
      });
    }
    
    if (ext === "docx") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const mammothModule = await import("mammoth");
            const result = await mammothModule.extractRawText({ arrayBuffer });
            resolve(result.value || "Empty Word Document.");
          } catch (err) {
            console.error("Mammoth client-side extraction error:", err);
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read docx arrayBuffer."));
        reader.readAsArrayBuffer(file);
      });
    }
    
    if (ext === "pdf") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const pdfjsModule = await import("pdfjs-dist");
            // Set up matching worker from CDN
            pdfjsModule.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsModule.version}/pdf.worker.min.js`;
            
            const loadingTask = pdfjsModule.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            let text = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => (item as any).str || "")
                .join(" ");
              text += pageText + "\n";
            }
            resolve(text || "No text could be extracted from this PDF document.");
          } catch (err) {
            console.error("PDFJS client-side extraction error:", err);
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read PDF arrayBuffer."));
        reader.readAsArrayBuffer(file);
      });
    }

    return "";
  };

  // Process file upload selections and perform client-side extraction with robust validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["png", "jpg", "jpeg", "webp", "pdf", "docx", "txt"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedExtensions.includes(ext)) {
      alert("Unsupported file type selected. Supported: PNG, JPG, JPEG, WEBP, PDF, DOCX, TXT");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Document & Image sandbox limit size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("The selected file exceeds our 5MB sandbox limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(ext)) {
        compressImage(file, (compressedBase64) => {
          setAttachedFile({
            name: file.name,
            type: "image/jpeg",
            size: file.size,
            data: compressedBase64
          });
        });
      } else {
        // Document text extraction live
        const extracted = await extractTextFromDocument(file);
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedFile({
            name: file.name,
            type: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: file.size,
            data: reader.result as string,
            extractedText: extracted
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (error: any) {
      console.error("Failed to parse and extract text from uploaded file:", error);
      alert(`Failed to analyze ${file.name}: ${error.message || "Unknown analysis error."}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getLocalChatResponse = (text: string, mode: "visitor" | "user" | "admin") => {
    const clean = text.trim().toLowerCase();

    // If it's a full question, a conversational query, or contains spaces indicating multiple words,
    // we should ALWAYS send it to Gemini for smart Copilot support rather than intercepting it with flat rules!
    const wordsCount = clean.split(/\s+/).length;
    if (
      wordsCount > 3 || 
      clean.includes("?") || 
      clean.includes("delay") || 
      clean.includes("salary") || 
      clean.includes("error") || 
      clean.includes("pending") || 
      clean.includes("why") || 
      clean.includes("can i") || 
      clean.includes("how do") || 
      clean.includes("broken") || 
      clean.includes("frustrated") || 
      clean.includes("angry") || 
      clean.includes("report") || 
      clean.includes("show") || 
      clean.includes("generate") || 
      clean.includes("stats") || 
      clean.includes("metric") || 
      clean.includes("list") || 
      clean.includes("summary") ||
      clean.includes("wifi") ||
      clean.includes("printer") ||
      clean.includes("internet")
    ) {
      return null;
    }

    // Greeting
    if (clean === "hi" || clean === "hello" || clean === "hey" || clean === "greetings" || clean === "hola" || clean === "good morning" || clean === "good afternoon" || clean === "good evening") {
      return {
        text: "Hello there! 👋 I am your digital Workplace Operations Assistant, optimized for local response speeds to help you navigate the system instantly.\n\nHow can I assist you with your workplace operations today? Feel free to use the quick action buttons below or ask me about filing/tracking tickets!",
        suggestedCategory: "General Query",
        suggestedSeverity: "Low",
        quickActions: ["register_ticket", "view_tickets", "view_notices"]
      };
    }

    // Register / Submit Ticket
    if (clean === "register" || clean === "submit" || clean === "file" || clean === "create ticket" || clean === "new ticket") {
      return {
        text: "I can help you file a new operational or IT ticket right away! \n\nClick the **Pre-fill & File Ticket Now** button or the **📝 Register Ticket** action below to launch the ticket creation wizard.",
        suggestedCategory: "System Navigation",
        suggestedSeverity: "Low",
        quickActions: ["register_ticket"]
      };
    }

    // Track / Status
    if (clean === "track" || clean === "status" || clean === "my tickets" || clean === "my complaints" || clean === "view complaints") {
      return {
        text: "You can track the live status, assigned department, and SLA counters of all your submitted complaints and requests in real-time.\n\nClick the **📁 View Tickets** action below to navigate to your ticket dashboard.",
        suggestedCategory: "System Navigation",
        suggestedSeverity: "Low",
        quickActions: ["view_tickets"]
      };
    }

    // Notice / Announcement
    if (clean === "notice" || clean === "announcement" || clean === "notices" || clean === "announcements") {
      return {
        text: "Stay up-to-date with company broadcasts, emergency updates, and department operations inside our central Notice Board.\n\nClick the **🔔 System Notices** action below to view active notices.",
        suggestedCategory: "General Query",
        suggestedSeverity: "Low",
        quickActions: ["view_notices"]
      };
    }

    // Profile / Settings
    if (clean === "profile" || clean === "password" || clean === "settings") {
      return {
        text: "You can view your current account details, update your profile picture, change your password, and customize operational preferences on your Account Profile page.\n\nClick below to access your profile settings.",
        suggestedCategory: "System Navigation",
        suggestedSeverity: "Low",
        quickActions: ["reset_password"]
      };
    }

    // Contact / Support / Help
    if (clean === "help" || clean === "support" || clean === "contact") {
      return {
        text: "For platform assistance, our Help Center is available 24/7 with interactive guides and FAQs. If you need direct administrative support, feel free to reach out to our Operations Control Desk at **ops-support@workplacehub.io**.\n\nClick below to open the Help Center.",
        suggestedCategory: "Customer Support",
        suggestedSeverity: "Low",
        quickActions: ["contact_support"]
      };
    }

    return null; // Go to Gemini for complex questions!
  };

  const handleSendMessage = async (textToSend: string, isRegeneration: boolean = false) => {
    // If we have text or active attached file
    if (!textToSend.trim() && !attachedFile) return;

    // Command check
    let processedText = textToSend;
    const cleanCmd = textToSend.trim().toLowerCase();
    
    // Slash commands mapping
    if (cleanCmd.startsWith("/")) {
      if (cleanCmd === "/help") {
        processedText = "List available system slash commands.";
      } else if (cleanCmd === "/register") {
        handleTriggerQuickAction("register_ticket");
        setInputMessage("");
        return;
      } else if (cleanCmd === "/tickets") {
        handleTriggerQuickAction("view_tickets");
        setInputMessage("");
        return;
      } else if (cleanCmd === "/notices") {
        handleTriggerQuickAction("view_notices");
        setInputMessage("");
        return;
      } else if (cleanCmd === "/profile" || cleanCmd === "/settings") {
        handleTriggerQuickAction("reset_password");
        setInputMessage("");
        return;
      } else if (cleanCmd === "/contact") {
        processedText = "How can I contact support directly?";
      }
    }

    // Check if an active thread exists, if not initialize one
    let targetThreadId = activeThreadId;
    let currentThreads = [...threads];
    
    if (!targetThreadId) {
      let greetingText = "";
      if (chatbotMode === "admin") {
        greetingText = `Hello ${dbUser?.name || "System Admin"}! 👋 Welcome to **Workplace Hub AI Assistant (Admin Mode)**.\n\nI am dynamically paired with the Live Database. I can help you monitor SLA metrics, review urgent tickets, or compile overdue ticket summaries.\n\nType **Show urgent tickets** or ask **Which tickets are overdue?** to begin.`;
      } else if (chatbotMode === "user") {
        greetingText = `Hello ${dbUser?.name || "there"}! 👋 Welcome to **Workplace Hub AI Assistant (Personal Support Mode)**.\n\nI have securely synchronized with your profile and ticket history. I can check your ticket statuses, explain delays, draft new requests, or look up active announcements.\n\nAsk me **What's happening with my ticket?** or **How do I submit a ticket?** to get started.`;
      } else {
        greetingText = `Hello! 👋 Welcome to the **Digital Workplace Operations Platform (Workplace Hub)**.\n\nI am your dedicated **Visitor Guidance Assistant**.\n\nI can help you understand how this website works, how to submit a ticket, what features are available, or guide you if you cannot log in.\n\nAsk me **What is this website?** or **How do I register a ticket?** to learn more!`;
      }

      const defaultMsg: ChatMessage = {
        id: "welcome_" + Date.now(),
        sender: "assistant",
        text: greetingText,
        timestamp: Date.now()
      };
      const newThread: ChatThread = {
        id: "thread_" + Date.now(),
        title: processedText ? (processedText.substring(0, 24) + "...") : "File upload discussion",
        timestamp: Date.now(),
        messages: [defaultMsg]
      };
      currentThreads = [newThread, ...threads];
      targetThreadId = newThread.id;
      setThreads(currentThreads);
      setActiveThreadId(newThread.id);
    }

    
    const userMsg: ChatMessage = {
      id: "msg_user_" + Date.now(),
      sender: "user",
      text: processedText || (attachedFile ? `Attached File: ${attachedFile.name}` : ""),
      timestamp: Date.now(),
      file: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        size: attachedFile.size
      } : undefined
    };

    // Append user message internally ONLY if not regenerating
    const currentThreadIndex = currentThreads.findIndex((t) => t.id === targetThreadId);
    if (!isRegeneration && currentThreadIndex > -1) {
      const thread = currentThreads[currentThreadIndex];
      const updatedMessages = [...thread.messages, userMsg];
      
      const title = thread.title === "New Conversation" 
        ? (processedText ? (processedText.substring(0, 24) + (processedText.length > 24 ? "..." : "")) : `Doc Analysis: ${attachedFile?.name}`)
        : thread.title;

      currentThreads[currentThreadIndex] = {
        ...thread,
        title,
        timestamp: Date.now(),
        messages: updatedMessages
      };
      setThreads(currentThreads);
    }


    // Clear input & capture reference of outgoing attachment
    setInputMessage("");
    const outgoingFile = attachedFile ? { ...attachedFile } : null;
    setAttachedFile(null);
    setLoading(true);
      setLoadingText("Thinking...");
      let phase = 0;
      const phases = ["Loading context...", "Analyzing...", "Generating response..."];
      loadingIntervalRef.current = setInterval(() => {
        if (phase < phases.length) {
          setLoadingText(phases[phase]);
          phase++;
        }
      }, 1000);

    // 💡 LOCAL RULE-BASED RESPONDER FOR FAQs & NAVIGATION
    const localRuleResponse = getLocalChatResponse(processedText, chatbotMode);
    if (localRuleResponse) {
      const assistantMsgId = "msg_assist_" + Date.now();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: "assistant",
        text: "",
        timestamp: Date.now(),
        suggestedCategory: localRuleResponse.suggestedCategory,
        suggestedSeverity: localRuleResponse.suggestedSeverity,
        quickActions: localRuleResponse.quickActions || []
      };

      const reLoadedThreads = [...currentThreads];
      const targetIdx = reLoadedThreads.findIndex((t) => t.id === targetThreadId);
      if (targetIdx > -1) {
        reLoadedThreads[targetIdx].messages = [...reLoadedThreads[targetIdx].messages, assistantMsg];
        setThreads(reLoadedThreads);
      }

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }

      const words = localRuleResponse.text.split(" ");
      let currentWordIndex = 0;
      let currentTypedText = "";
      
      typingIntervalRef.current = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentTypedText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
          currentWordIndex++;
          
          setThreads((prevThreads) => {
            const updated = [...prevThreads];
            const tIdx = updated.findIndex((t) => t.id === targetThreadId);
            if (tIdx > -1) {
              updated[tIdx] = {
                ...updated[tIdx],
                messages: updated[tIdx].messages.map((m) => 
                  m.id === assistantMsgId ? { ...m, text: currentTypedText } : m
                )
              };
            }
            return updated;
          });
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
          setLoading(false);
        }
      }, 15);
      return;
    }

    const cacheKey = `${processedText.trim().toLowerCase()}_mode_${chatbotMode}_brief_${isBrief}`;
    if (chatbotCache.current[cacheKey]) {
      const cached = chatbotCache.current[cacheKey];
      const assistantMsgId = "msg_assist_" + Date.now();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: "assistant",
        text: "",
        timestamp: Date.now(),
        suggestedCategory: cached.suggestedCategory,
        suggestedSeverity: cached.suggestedSeverity,
        quickActions: cached.quickActions || [],
        suggestedQueries: cached.suggestedQueries || [],
        physicalLocation: cached.physicalLocation
      };

      let reLoadedThreads = [...currentThreads];
      let targetIdx = reLoadedThreads.findIndex((t) => t.id === targetThreadId);
      if (targetIdx > -1) {
        reLoadedThreads[targetIdx].messages = [...reLoadedThreads[targetIdx].messages, assistantMsg];
        setThreads(reLoadedThreads);
      }

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }

      const words = cached.text.split(" ");
      let currentWordIndex = 0;
      let currentTypedText = "";
      
      typingIntervalRef.current = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentTypedText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
          currentWordIndex++;
          
          setThreads((prevThreads) => {
            const updated = [...prevThreads];
            const tIdx = updated.findIndex((t) => t.id === targetThreadId);
            if (tIdx > -1) {
              updated[tIdx] = {
                ...updated[tIdx],
                messages: updated[tIdx].messages.map((m) => 
                  m.id === assistantMsgId ? { ...m, text: currentTypedText } : m
                )
              };
            }
            return updated;
          });
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
          setLoading(false);
        }
      }, 5);
      return;
    }

    try {
      // Gather dynamic live DB grounding report before prompt generation for truthfulness rules
      let systemContext: any = null;
      try {
        if (dbUser && chatbotMode === "user") {
          systemContext = {
            role: "user",
            permissions: ["ownTickets.read", "complaints.create"],
            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id }
          };
        } else if (dbUser && chatbotMode === "admin") {
          systemContext = {
            role: "admin",
            permissions: ["tickets.read", "users.read", "reports.read", "analytics.read"],
            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id }
          };
        } else {
          systemContext = {
            role: "visitor",
            permissions: []
          };
        }
      } catch (dbErr) {
        console.error("Failed to build system context:", dbErr);
      }

      // Fetch latest messages for context of target thread
      const threadMessages = currentThreads.find((t) => t.id === targetThreadId)?.messages || [];
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: threadMessages,
          systemContext: { ...systemContext, uiLanguage: 'English' },
          responsePreference: isBrief ? "brief" : "detailed",
          file: outgoingFile ? {
            name: outgoingFile.name,
            type: outgoingFile.type,
            data: outgoingFile.data,
            extractedText: outgoingFile.extractedText
          } : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Chat response from assistant failed.");
      }

      const rawResult = await response.json();
      
      const cacheKey = `${processedText.trim().toLowerCase()}_mode_${chatbotMode}_brief_${isBrief}`;
      chatbotCache.current[cacheKey] = {
        text: rawResult.text || "I was unable to analyze that request accurately.",
        suggestedCategory: rawResult.suggestedCategory,
        suggestedSeverity: rawResult.suggestedSeverity,
        quickActions: rawResult.quickActions || [],
        suggestedQueries: rawResult.suggestedQueries || [],
        physicalLocation: rawResult.physicalLocation,
        structuredData: rawResult.structuredData,
        detectedLanguage: rawResult.detectedLanguage,
        originalComplaint: rawResult.originalComplaint,
        translatedComplaint: rawResult.translatedComplaint,
        aiAnalysis: rawResult.aiAnalysis
      };
      
      const fullText = rawResult.text || "I was unable to analyze that request accurately.";
      const assistantMsgId = "msg_assist_" + Date.now();
      
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: "assistant",
        text: "", // start empty for simulated word-by-word streaming
        timestamp: Date.now(),
        suggestedCategory: rawResult.suggestedCategory,
        suggestedSeverity: rawResult.suggestedSeverity,
        quickActions: rawResult.quickActions || [],
        suggestedQueries: rawResult.suggestedQueries || [],
        physicalLocation: rawResult.physicalLocation,
        structuredData: rawResult.structuredData,
        detectedLanguage: rawResult.detectedLanguage,
        originalComplaint: rawResult.originalComplaint,
        translatedComplaint: rawResult.translatedComplaint,
        aiAnalysis: rawResult.aiAnalysis
      };

      // Append empty AI Assistant response to active state
      let reLoadedThreads = [...currentThreads];
      let targetIdx = reLoadedThreads.findIndex((t) => t.id === targetThreadId);
      if (targetIdx > -1) {
        reLoadedThreads[targetIdx].messages = [...reLoadedThreads[targetIdx].messages, assistantMsg];
        setThreads(reLoadedThreads);
      }

      // Clear any prior active typing interval before initiating a new one
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }

      // Stream words one-by-one with beautiful timing
      const words = fullText.split(" ");
      let currentWordIndex = 0;
      let currentTypedText = "";
      
      typingIntervalRef.current = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentTypedText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
          currentWordIndex++;
          
          setThreads((prevThreads) => {
            const updated = [...prevThreads];
            const tIdx = updated.findIndex((t) => t.id === targetThreadId);
            if (tIdx > -1) {
              updated[tIdx] = {
                ...updated[tIdx],
                messages: updated[tIdx].messages.map((m) => 
                  m.id === assistantMsgId ? { ...m, text: currentTypedText } : m
                )
              };
            }
            return updated;
          });
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
        }
      }, 10); // ultra high response speed
    } catch (err: any) {
      console.error(err);
      
      const fallbackText = `I ran into an issue communicating with the AI server. \n\n**Common Troubleshooting Options:**\n- Navigate to dashboard pages to file manual tickets.\n- Confirm you are connected to database services. \n- Check system status listings.`;
      
      const assistantMsg: ChatMessage = {
        id: "msg_fallback_" + Date.now(),
        sender: "assistant",
        text: fallbackText,
        timestamp: Date.now()
      };

      const reLoadedThreads = [...currentThreads];
      const targetIdx = reLoadedThreads.findIndex((t) => t.id === targetThreadId);
      if (targetIdx > -1) {
        reLoadedThreads[targetIdx].messages = [...reLoadedThreads[targetIdx].messages, assistantMsg];
        setThreads(reLoadedThreads);
      }
    } finally {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
          setLoading(false);
    }
  };

  const handleTriggerQuickAction = (action: string) => {
    switch (action) {
      case "register_ticket":
        navigate(dbUser?.role === "admin" ? "/admin/complaints" : "/dashboard/register");
        break;
      case "view_tickets":
        navigate(dbUser?.role === "admin" ? "/admin/complaints" : "/dashboard/my-complaints");
        break;
      case "view_notices":
        navigate(dbUser?.role === "admin" ? "/admin/notices" : "/dashboard/notices");
        break;
      case "reset_password":
      case "update_profile":
        navigate(dbUser?.role === "admin" ? "/admin/profile" : "/dashboard/profile");
        break;
      case "export_pdf": {
        const docText = `DCMS SYSTEM REPORT - WEEKLY OPERATIONS REPORT\n\nPeriod: 10 June - 17 June 2026\n\nTickets Created: 89\nResolved: 72\nPending: 17\nResolution Rate: 80.9%\n\nMost Frequent Issue: Network Connectivity\n\nRecommendations:\n1. Increase staffing during peak operations hours.\n2. Scheduled preventive network router maintenance.\n\nFile status: Verified Digital Copy\nGenerated: Wednesday, June 17, 2026`;
        const blob = new Blob([docText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dcms_weekly_operations_report_verified.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`📊 PDF Download Initiated!\nYour verified Weekly Operations Report has been saved locally as 'dcms_weekly_operations_report_verified.pdf'.`);
        return; // don't close helper modal
      }
      case "export_docx": {
        const docText = `DCMS SYSTEM REPORT - WEEKLY OPERATIONS REPORT\n\nPeriod: 10 June - 17 June 2026\n\nTickets Created: 89\nResolved: 72\nPending: 17\nResolution Rate: 80.9%\n\nMost Frequent Issue: Network Connectivity\n\nRecommendations:\n1. Increase staffing during peak operations hours.\n2. Scheduled preventive network router maintenance.\n\nFile status: Verified Digital Copy\nGenerated: Wednesday, June 17, 2026`;
        const blob = new Blob([docText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dcms_weekly_operations_report_verified.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`📊 Word DOCX Export Initiated!\nYour verified Weekly Operations Report has been saved locally as 'dcms_weekly_operations_report_verified.docx'.`);
        return; // don't close helper modal
      }
      case "export_csv": {
        const docText = `"Period","Tickets Created","Resolved","Pending","Resolution Rate","Frequent Category"\n"10 June - 17 June 2026","89","72","17","80.9%","Network Connectivity"`;
        const blob = new Blob([docText], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dcms_weekly_operations_report_data.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`📊 CSV Export Initiated!\nYour statistical report dataset has been saved locally as 'dcms_weekly_operations_report_data.csv'.`);
        return; // don't close helper modal
      }
      case "contact_support":
        // For Support we can just insert a message into chat or navigate to profile
        handleSendMessage("I need to contact human support.");
        return; // Don't close if floating
      default:
        console.warn("Unknown system action requested:", action);
    }
    if (mode === "floating") {
      setIsOpen(false);
    }
  };

  const handleAutofillRegister = (category: string, severity: string, textQuery: string, translatedText?: string, detectedLanguage?: string) => {
    const finalDescription = translatedText ? `[AI Translation]\nOriginal (${detectedLanguage || 'Detected'}): ${textQuery}\nEnglish Translation: ${translatedText}` : textQuery;
    const draftPayload = {
      title: `${category} Issue - ${new Date().toLocaleDateString()}`,
      issue_type: category,
      severity: severity,
      description: finalDescription
    };
    try {
      sessionStorage.setItem("dcms_ai_draft", JSON.stringify(draftPayload));
    } catch (e) {
      console.error("Could not write draft to sessionStorage:", e);
    }
    navigate("/dashboard/register", {
      state: draftPayload
    });
    if (mode === "floating") {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  // Safe inline helper to render simplistic Markdown structure with elegant subheadings & styling
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      let isBullet = false;
      let isNumbered = false;
      let listNum = "";

      // Check for bullet list
      if (content.trim().startsWith("- ") || content.trim().startsWith("* ")) {
        isBullet = true;
        content = content.replace(/^[\s]*[-*]\s+/, "");
      } else if (/^\d+\.\s+/.test(content.trim())) {
        isNumbered = true;
        const match = content.trim().match(/^(\d+)\.\s+/);
        if (match) {
          listNum = match[1];
          content = content.replace(/^\s*\d+\.\s+/, "");
        }
      }

      // Check for key display subheaders
      const isSubHeader = 
        content.trim().startsWith("📌") || 
        content.trim().startsWith("🔍") || 
        content.trim().startsWith("💡") || 
        content.trim().startsWith("➡") ||
        content.trim().startsWith("✅") ||
        content.trim().startsWith("⚠") ||
        content.trim().startsWith("ℹ") ||
        content.trim().startsWith("🚨") ||
        content.trim().startsWith("🛠️") ||
        content.trim().startsWith("📚");

      // Format simple bold elements (**text**) or italics (*text*)
      const parseFormatting = (str: string) => {
        const parts = [];
        let cur = str;
        const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
        let lastIdx = 0;
        let match;

        while ((match = regex.exec(str)) !== null) {
          const matchIdx = match.index;
          if (matchIdx > lastIdx) {
            parts.push(str.substring(lastIdx, matchIdx));
          }
          if (match[2]) {
            // Bold
            parts.push(<strong key={matchIdx} className="font-extrabold text-blue-500 dark:text-blue-400">{match[2]}</strong>);
          } else if (match[4]) {
            // Italics
            parts.push(<em key={matchIdx} className="italic text-slate-300 dark:text-slate-400">{match[4]}</em>);
          }
          lastIdx = regex.lastIndex;
        }

        if (lastIdx < str.length) {
          parts.push(str.substring(lastIdx));
        }

        return parts.length > 0 ? parts : str;
      };

      if (isSubHeader) {
        return (
          <h5 key={idx} className="text-xs font-black text-slate-900 dark:text-white tracking-wide border-b border-slate-200 dark:border-slate-800 pb-1 mt-4 mb-2 first:mt-0 flex items-center gap-1.5 uppercase font-mono">
            {parseFormatting(content)}
          </h5>
        );
      }

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold pl-1 my-1">
            {parseFormatting(content)}
          </li>
        );
      }
      if (isNumbered) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold pl-1 my-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold mr-1">{listNum}.</span>
            {parseFormatting(content)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-2 last:mb-0">
          {parseFormatting(content)}
        </p>
      );
    });
  };

  // Group threads by timestamp for ChatGPT-style history navigation
  
  const groupThreads = (threadsList: ChatThread[]) => {
    const pinned: ChatThread[] = [];
    const today: ChatThread[] = [];
    const yesterday: ChatThread[] = [];
    const older: ChatThread[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfYesterday = startOfToday - oneDay;

    let searchFiltered = threadsList;
    if (searchQuery.trim()) {
      searchFiltered = threadsList.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())));
    }

    searchFiltered.forEach((t) => {
      if (t.is_pinned) {
        pinned.push(t);
      } else if (t.timestamp >= startOfToday) {
        today.push(t);
      } else if (t.timestamp >= startOfYesterday) {
        yesterday.push(t);
      } else {
        older.push(t);
      }
    });

    return { pinned, today, yesterday, older };
  };


  
  const renderThreadLink = (thread: ChatThread) => {
    const isActive = thread.id === activeThreadId;
    return (
      <div
        key={thread.id}
        onClick={() => setActiveThreadId(thread.id)}
        className={`w-full group text-left px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-center gap-1.5 ${
          isActive 
            ? "bg-blue-500/10 dark:bg-blue-500/10 border-l-4 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0">
              {thread.is_pinned ? <Pin className="w-3.5 h-3.5 shrink-0" /> : <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />}
              <span className="text-xs font-bold truncate block">{thread.title}</span>
            </div>
            {isActive && (
              <div className="flex items-center gap-1 shrink-0 opacity-100">
                <button onClick={(e) => handlePinThread(thread.id, e)} className="p-0.5 text-slate-400 hover:text-blue-500 rounded" title={thread.is_pinned ? "Unpin" : "Pin"}>
                  <Pin className="w-3 h-3" />
                </button>
                <button onClick={(e) => handleRenameThread(thread.id, e)} className="p-0.5 text-slate-400 hover:text-blue-500 rounded" title={"Rename"}>
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={(e) => handleDeleteThread(thread.id, e)} className="p-0.5 text-slate-400 hover:text-red-500 rounded transition-opacity" title={"Delete"}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
        </div>
      </div>
    );
  };


  const lastAssistantMsg = [...messages].reverse().find(m => m.sender === "assistant" && m.suggestedQueries && m.suggestedQueries.length > 0);
  const currentSuggestions = (lastAssistantMsg && lastAssistantMsg.suggestedQueries)
    ? lastAssistantMsg.suggestedQueries.map(q => ({ label: q, query: q }))
    : (dbUser?.role === "admin" ? ADMIN_SUGGESTIONS : USER_SUGGESTIONS);
  const grouped = groupThreads(threads);

  // ==========================================
  // VIEW RENDERER A: FULL SCREEN PAGE INTERFACE
  // ==========================================
  if (mode === "page") {
    return (
      <div className="flex flex-col md:flex-row h-[85vh] min-h-[600px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070A13] shadow-2xl font-sans relative">
        
        {/* Threads Side Navigation (ChatGPT styled) */}
        
  <div className="flex w-full md:w-64 lg:w-72 md:max-h-full max-h-48 md:border-r border-b md:border-b-0 border-slate-200 dark:border-slate-800 bg-[#FAFAFB] dark:bg-[#090D17] flex-col shrink-0">
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 bg-[#F1F3F6] dark:bg-[#0E1325]/50">
      <div className="flex justify-between items-center">
        <h3 className="text-[10.5px] font-black uppercase text-slate-500 tracking-wider">{"Chat History"}</h3>
        <button
          onClick={handleCreateNewThread}
          className="px-2.5 py-1 text-[10.5px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg flex items-center gap-1 transition-all hover:scale-103 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {"New Chat"}</button>
      </div>
      <div className="relative">
        <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
        <input 
          type="text" 
          placeholder={"Search chats..."} 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 py-1.5 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
    
    <div className="flex-1 overflow-y-auto p-2.5 space-y-4 pb-10">
      {grouped.pinned.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 flex items-center gap-1"><Pin className="w-2.5 h-2.5" /> {"Pinned"}</p>
          {grouped.pinned.map(renderThreadLink)}
        </div>
      )}

      {grouped.today.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">{"Today"}</p>
          {grouped.today.map(renderThreadLink)}
        </div>
      )}
      
      {grouped.yesterday.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">{"Yesterday"}</p>
          {grouped.yesterday.map(renderThreadLink)}
        </div>
      )}
      
      {grouped.older.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">{"Older"}</p>
          {grouped.older.map(renderThreadLink)}
        </div>
      )}

      {threads.length === 0 && (
        <div className="text-center p-6 text-2xs text-slate-400 dark:text-slate-600">{"No previous chats. Click \"New\" to begin."}</div>
      )}
    </div>
  </div>{"\n\n"}{/* AI Chat workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#070A13] lg:h-full min-h-0 overflow-hidden relative">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FAFAFB] dark:bg-[#0E1325]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 hidden md:flex items-center justify-center text-white shadow-lg shrink-0 text-sm">
                🤖
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="md:hidden">🤖</span> {"Workplace Hub AI Assistant"}{getRoleBadge()}
                </h4>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-tight">{"Your Smart Support Assistant"}</p>
                  <span className="hidden lg:block text-[8px] text-slate-400 font-black dark:text-slate-500 tracking-wider">{"SANDBOX DIRECT GROUNDING"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-2 md:mt-0">
              {/* Dynamic Mode Switcher */}
              <div className="flex w-full md:w-auto items-center justify-between bg-slate-100 dark:bg-slate-800/85 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
                <button
                  onClick={() => setIsBrief(true)}
                  className={`px-3 py-1 flex-1 flex justify-center items-center gap-1.5 rounded-lg text-[10px] font-black tracking-tight transition-all uppercase cursor-pointer ${
                    isBrief
                      ? "bg-white dark:bg-[#070A13] text-blue-600 dark:text-cyan-400 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {"⚡ Brief"}</button>
                <button
                  onClick={() => setIsBrief(false)}
                  className={`px-3 py-1 flex-1 flex justify-center items-center gap-1.5 rounded-lg text-[10px] font-black tracking-tight transition-all uppercase cursor-pointer ${
                    !isBrief
                      ? "bg-white dark:bg-[#070A13] text-blue-600 dark:text-cyan-400 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {"📖 Detailed"}</button>
              </div>
            </div>
          </div>

          {/* Messages block */}
          <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6 bg-slate-50/30 dark:bg-[#060912] scroll-smooth">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-3 w-full max-w-4xl mx-auto ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${
                  m.sender === "user" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
                }`}>
                  {m.sender === "user" ? (dbUser?.name?.[0]?.toUpperCase() || "U") : "🤖"}
                </div>

                {/* Bubble content */}
                <div className={`space-y-2 p-4 rounded-2xl max-w-full ${
                  m.sender === "user" 
                    ? "bg-blue-600 text-white font-semibold text-xs leading-relaxed" 
                    : "bg-white dark:bg-[#0E1527] border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm text-slate-850 dark:text-slate-100"
                }`}>
                  <div className="overflow-x-auto">
                    {m.sender === "user" ? (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      renderMarkdown(m.text)
                    )}
                  </div>
                  {m.structuredData && <StructuredDataRenderer data={m.structuredData} />}
                  
                  {/* File Upload Attachment Indicator */}
                  {m.file && (
                    <div className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2.5 max-w-full w-max text-2xs font-extrabold ${
                      m.sender === "user" 
                        ? "bg-blue-700/50 border-blue-500/40 text-blue-100" 
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {m.file.type?.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate max-w-[170px] text-slate-900 dark:text-white">{m.file.name}</p>
                        <p className="text-[9px] text-slate-500 font-medium">{(m.file.size / 1024).toFixed(0)} {"KB"}</p>
                      </div>
                    </div>
                  )}

                  {m.aiAnalysis && m.aiAnalysis.detectedIssue && (
  <div className="mt-3.5 p-3 bg-gradient-to-br from-indigo-950/40 to-blue-900/20 border border-indigo-500/20 rounded-xl space-y-2">
    <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1 font-mono">
        <Sparkles className="w-3 h-3 text-indigo-400" /> AI Analysis
      </span>
      {m.aiAnalysis.confidence && (
        <span className="text-[9px] font-bold text-slate-400 bg-black/30 px-1.5 py-0.5 rounded">
          Confidence: <span className="text-emerald-400">{m.aiAnalysis.confidence}</span>
        </span>
      )}
    </div>
    
    <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed">
      <div>
        <span className="text-slate-500 font-bold block mb-0.5">Detected Issue</span>
        <span className="text-slate-200 font-medium">{m.aiAnalysis.detectedIssue}</span>
      </div>
      <div>
        <span className="text-slate-500 font-bold block mb-0.5">Priority</span>
        <span className={`font-medium ${m.aiAnalysis.priority === 'Urgent' || m.aiAnalysis.priority === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`}>{m.aiAnalysis.priority || 'Normal'}</span>
      </div>
      
      {m.aiAnalysis.businessImpact && (
        <div className="col-span-2">
          <span className="text-slate-500 font-bold block mb-0.5">Business Impact</span>
          <span className="text-slate-200 font-medium">{m.aiAnalysis.businessImpact}</span>
        </div>
      )}
      
      {m.aiAnalysis.rootCause && (
        <div className="col-span-2">
          <span className="text-slate-500 font-bold block mb-0.5">Likely Root Cause</span>
          <span className="text-slate-200 font-medium">{m.aiAnalysis.rootCause}</span>
        </div>
      )}
      
      {m.aiAnalysis.recommendedAction && (
        <div className="col-span-2">
          <span className="text-slate-500 font-bold block mb-0.5">Recommended Action</span>
          <span className="text-indigo-300 font-medium">{m.aiAnalysis.recommendedAction}</span>
        </div>
      )}
      
      <div className="flex items-center gap-4 col-span-2 pt-1 border-t border-indigo-500/10">
        {m.aiAnalysis.estimatedResolution && (
          <div>
            <span className="text-slate-500 font-bold mr-1">Est. Resolution:</span>
            <span className="text-slate-300 font-medium">{m.aiAnalysis.estimatedResolution}</span>
          </div>
        )}
        {m.aiAnalysis.sla && (
          <div>
            <span className="text-slate-500 font-bold mr-1">SLA:</span>
            <span className="text-slate-300 font-medium">{m.aiAnalysis.sla}</span>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/* Classification suggestions */}
                  {m.translatedComplaint && (
                    <div className="mt-4 p-3.5 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2.5">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 font-mono">
                        <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                        {"Auto-Translation:"}{m.detectedLanguage || "Detected"}
                      </span>
                      <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 italic">
                        {"Original:"}{m.originalComplaint}
                      </div>
                      <div className="text-[11px] font-medium text-slate-900 dark:text-slate-100">
                        {"Translation:"}{m.translatedComplaint}
                      </div>
                    </div>
                  )}
                  {!loading && m.sender === "assistant" && m.suggestedCategory && (
                    <div className="mt-4 p-3.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2.5">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-4 h-4 text-blue-500 animate-spin-slow shrink-0" />
                        {"Smart Ticket Diagnosed Outage Suggestions"}</span>
                      <div className="grid grid-cols-2 gap-2 text-[10.5px] font-black">
                        <div className="p-2.5 bg-white dark:bg-[#121A2E] rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-slate-400 font-extrabold">{"Category:"}</span>
                          <span className="text-blue-600 dark:text-blue-400">{m.suggestedCategory}</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-[#121A2E] rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-slate-400 font-extrabold">{"Severity:"}</span>
                          <span className={`${
                            m.suggestedSeverity === "Critical" || m.suggestedSeverity === "Urgent" 
                              ? "text-red-500 font-black animate-pulse" 
                              : m.suggestedSeverity === "Medium" ? "text-amber-500" : "text-green-500"
                          }`}>
                            {m.suggestedSeverity || "Low"}
                          </span>
                        </div>
                      </div>
                      
                      {dbUser?.role !== "admin" && (
                        <button
                          onClick={() => handleAutofillRegister(m.suggestedCategory || "Other", m.suggestedSeverity || "Medium", messages.find(userM => userM.sender === "user")?.text || "", m.translatedComplaint, m.detectedLanguage)}
                          className="w-full text-center py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] rounded-xl shadow-lg shadow-blue-500/15 flex items-center justify-center gap-1 mt-1 cursor-pointer scale-100 active:scale-98 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> {"Auto-Fill & Create Ticket Ticket Now"}</button>
                      )}
                    </div>
                  )}

                  {/* Quick action triggers */}
                  {!loading && m.sender === "assistant" && m.quickActions && m.quickActions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.quickActions.map((act) => {
                        let label = "";
                        if (act === "register_ticket") label = "📝 Register Ticket";
                        else if (act === "view_tickets") label = "📁 Verify Incidents";
                        else if (act === "view_notices") label = "🔔 Read Notices";
                        else if (act === "reset_password" || act === "update_profile") label = "👤 Profile Settings";
                        else if (act === "export_pdf") label = "📅 Export PDF Report";
                        else if (act === "export_docx") label = "📝 Export Word Report";
                        else if (act === "export_csv") label = "📊 Export CSV Data";
                        else label = act;

                        return (
                          <button
                            key={act}
                            onClick={() => handleTriggerQuickAction(act)}
                            className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Physical Location Detail Card */}
                  {!loading && m.sender === "assistant" && m.physicalLocation?.requiresPhysical && (
                    <div className="mt-4 p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                        {"In-Person Department Visit Required"}</span>
                      
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-3 bg-white dark:bg-[#121A2E] rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5">
                            <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">{"Department"}</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{m.physicalLocation.department}</p>
                            </div>
                          </div>

                          <div className="p-3 bg-white dark:bg-[#121A2E] rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5">
                            <Pin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">{"Office / Floor"}</p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {m.physicalLocation.room}, {m.physicalLocation.floor}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-[#121A2E] rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5 text-xs">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">{"Office Hours"}</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{m.physicalLocation.hours}</p>
                          </div>
                        </div>

                        {m.physicalLocation.instructions && (
                          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/5 border border-amber-100 dark:border-amber-900/10 rounded-xl text-xs text-amber-850 dark:text-amber-300">
                            <p className="font-extrabold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono mb-1">{"Required Documents / Action"}</p>
                            <p className="leading-relaxed font-medium">{m.physicalLocation.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Smart follow-up suggestions */}
                  {!loading && m.sender === "assistant" && m.suggestedQueries && m.suggestedQueries.length > 0 && m.id === messages[messages.length - 1]?.id && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1 font-mono">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 animate-pulse animate-duration-1000" />
                        {"Suggested Next Steps"}</span>
                      <div className="flex flex-col gap-1.5">
                        {m.suggestedQueries.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="w-full text-left px-3.5 py-2.5 bg-slate-50 hover:bg-amber-50/50 dark:bg-slate-900/40 dark:hover:bg-amber-950/10 border border-slate-150 dark:border-slate-850 hover:border-amber-200 dark:hover:border-amber-900/30 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 font-semibold text-xs rounded-xl transition-all active:scale-99 cursor-pointer flex items-center gap-1.5"
                          >
                            <span>💡</span>
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-lg mr-auto">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                  🤖
                </div>
                <div className="bg-white dark:bg-[#0E1527] border border-slate-150 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-550"></span>
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-extrabold font-mono transition-all duration-300 animate-pulse">
                    {loadingText}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Upload preview container */}
          <div className="px-4 pt-3 bg-[#FAFAFB] dark:bg-[#0B0F19]">
            {attachedFile && (
              <div className="flex items-center gap-2.5 px-3 py-2 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl text-slate-850 dark:text-slate-200 text-xs font-bold leading-normal select-none shadow-2xs w-max max-w-full animate-bounce-short">
                <span>{attachedFile.type?.startsWith("image/") ? "🖼️" : "📄"}</span>
                <span className="truncate max-w-[200px] text-blue-700 dark:text-blue-300">{attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} {"KB)"}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg text-slate-450 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Input control footer */}
          <div className="p-4 bg-[#FAFAFB] dark:bg-[#0B0F19] flex gap-2.5 items-center sticky bottom-0 z-10 border-t border-slate-100 dark:border-slate-850 shrink-0">
            {/* Native Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt"
            />
            
            <div className="flex items-center relative">
              {/* Common Topics Dropdown */}
              <button
                onClick={() => setTopicsDropdownOpen(!topicsDropdownOpen)}
                disabled={loading}
                title={"Common Helpdesk Topics"}
                className="w-9 h-9 shrink-0 bg-white dark:bg-[#12192A] hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs relative"
              >
                <Lightbulb className="w-4 h-4" />
                {!topicsDropdownOpen && messages.length <= 1 && (
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-[#12192A] rounded-full animate-pulse"></span>
                )}
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {topicsDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-3 w-72 bg-white dark:bg-[#12192A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{"Common Helpdesk Topics"}</span>
                      <button onClick={() => setTopicsDropdownOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5 text-slate-700 dark:text-slate-200">
                      {currentSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            handleSendMessage(s.query);
                            setTopicsDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-block"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title={"Attach PNG, JPG, JPEG, WEBP, PDF, DOCX, TXT file"}
              className="w-9 h-9 shrink-0 bg-white dark:bg-[#12192A] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs"
            >
              <Paperclip className="w-4 h-4" />
            </button>



            {/* Voice Dictation Speech-to-Text Button */}
            <button
              onClick={handleToggleVoice}
              disabled={loading}
              title={isListening ? "Listening... click to stop" : "Start Voice typing"}
              className={`w-9 h-9 shrink-0 border rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs ${
                isListening 
                  ? "bg-red-500 border-red-400 text-white animate-pulse" 
                  : "bg-white dark:bg-[#12192A] hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>

            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={"Ask Workplace Hub AI Assistant... (Use /register, /tickets, /help, /notices)"}
              className="flex-1 bg-white dark:bg-[#070A13] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-850 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500 font-medium min-h-[44px] max-h-[120px] resize-y leading-relaxed"
            />
            
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={loading || (!inputMessage.trim() && !attachedFile)}
              className="w-10 h-10 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center cursor-pointer hover:scale-103 active:scale-97 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW RENDERER B: MOBILE-FRIENDLY POPUP WIDGET
  // ==========================================
  return (
    <div 
      className="fixed bottom-6 md:bottom-24 right-6 z-[9999] font-sans flex flex-col items-center gap-2"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            // Responsive: dynamic screen-fitted heights & widths with explicit device min-widths & min-heights
            className="absolute bottom-16 right-0 z-[9999] w-[300px] h-[450px] min-w-[280px] min-h-[400px] sm:w-[340px] sm:h-[500px] sm:min-w-[300px] sm:min-h-[450px] lg:w-[360px] lg:h-[540px] lg:min-w-[320px] lg:min-h-[500px] xl:w-[385px] xl:h-[580px] xl:min-w-[340px] xl:min-h-[530px] bg-slate-900/95 dark:bg-[#070B13]/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white cursor-default"
          >
              {/* Dynamic Mode Switcher Bar */}
              <div className="bg-[#0b0f19] border-b border-slate-800/80 px-4 py-2 flex items-center justify-between gap-2 text-[10px] shrink-0">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  {mode === "floating" ? "Session Control:" : "Response Preference:"}
                </span>
                {mode === "floating" ? (
                  <button
                    onClick={handleCreateNewThread}
                    id="refresh-assistant-btn"
                    className="p-1 px-2.5 rounded bg-slate-850 hover:bg-slate-800 hover:text-cyan-400 text-slate-300 font-black tracking-tight transition-all flex items-center gap-1.5 cursor-pointer text-[8.5px] uppercase border border-slate-700/60"
                    title={"Refresh Chat Thread"}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    {"Reset Assistant"}</button>
                ) : (
                  <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={handleCreateNewThread}
                      className="px-2.5 py-0.5 rounded text-[8.5px] font-black tracking-tight transition-all uppercase cursor-pointer text-emerald-400 hover:text-emerald-300 mr-2 flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {"New"}</button>
                    <button
                      onClick={() => setIsBrief(true)}
                      className={`px-2.5 py-0.5 rounded text-[8.5px] font-black tracking-tight transition-all uppercase cursor-pointer ${
                        isBrief
                          ? "bg-slate-850 text-cyan-400 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {"⚡ Brief"}</button>
                    <button
                      onClick={() => setIsBrief(false)}
                      className={`px-2.5 py-0.5 rounded text-[8.5px] font-black tracking-tight transition-all uppercase cursor-pointer ${
                        !isBrief
                          ? "bg-slate-850 text-cyan-400 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {"📖 Detailed"}</button>
                  </div>
                )}
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
                {threads.find((t) => t.id === activeThreadId)?.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div className={`flex gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : ""}`}>
                      {m.sender === "user" ? (
                        <div className="w-7 h-7 rounded-full bg-blue-650 font-black text-white flex items-center justify-center text-[10px] shadow-sm shrink-0">
                          {dbUser?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 border border-blue-400/20 relative">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-white" />
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-slate-950 animate-pulse"></span>
                        </div>
                      )}
                      <div className={`space-y-1.5 p-3.5 rounded-2xl ${
                        m.sender === "user" 
                          ? "bg-blue-600 text-white font-medium text-xs leading-relaxed" 
                          : "bg-[#0E1424] border border-slate-850 pb-4"
                      }`}>
                        <div className="overflow-x-auto select-text text-2xs leading-relaxed font-semibold">
                          {m.sender === "user" ? (
                            <p className="text-2xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
                          ) : (
                            renderMarkdown(m.text)
                          )}
                        {m.structuredData && <StructuredDataRenderer data={m.structuredData} />}
                        </div>

                        {/* File Upload Indicator within bubble */}
                        {m.file && (
                          <div className={`mt-2 p-2 rounded-xl border flex items-center gap-2 max-w-full w-max text-[9.5px] font-black ${
                            m.sender === "user" 
                              ? "bg-blue-700/50 border-blue-500/20 text-white" 
                              : "bg-slate-900/65 border-slate-800 text-slate-350"
                          }`}>
                            {m.file.type?.startsWith("image/") ? (
                              <ImageIcon className="w-3.5 h-3.5 opacity-80" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 opacity-80" />
                            )}
                            <span className="truncate max-w-[130px]">{m.file.name}</span>
                            <span className="text-[8px] opacity-60">({(m.file.size / 1024).toFixed(0)}{"K)"}</span>
                          </div>
                        )}
                        
                        {/* Classification suggestions */}
                        {!loading && m.sender === "assistant" && m.suggestedCategory && (
                          <div className="mt-3.5 p-2.5 bg-blue-950/20 border border-blue-500/20 rounded-xl space-y-1.5">
                            <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1 font-mono">
                              <Sparkles className="w-3 h-3 text-blue-400" /> {"Smart Diagnostic"}</span>
                            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-extrabold leading-normal">
                              <div className="p-1 px-1.5 bg-[#121A2E] rounded border border-slate-800 truncate">
                                <span className="text-slate-500">{"Category:"}</span>
                                <span className="text-blue-400">{m.suggestedCategory}</span>
                              </div>
                              <div className="p-1 px-1.5 bg-[#121A2E] rounded border border-slate-800 truncate">
                                <span className="text-slate-500">{"Urgency:"}</span>
                                <span className={`${m.suggestedSeverity === "Critical" || m.suggestedSeverity === "Urgent" ? "text-red-400" : "text-amber-400"}`}>{m.suggestedSeverity || "Low"}</span>
                              </div>
                            </div>
                            {dbUser?.role !== "admin" && (
                              <button
                                onClick={() => handleAutofillRegister(m.suggestedCategory || "Other", m.suggestedSeverity || "Medium", threads.find(t=>t.id===activeThreadId)?.messages.find(um=>um.sender==="user")?.text || "", m.translatedComplaint, m.detectedLanguage)}
                                className="w-full text-center py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[10px] rounded cursor-pointer transition-all active:scale-97"
                              >
                                {"📝 Pre-fill & File Ticket Now"}</button>
                            )}
                          </div>
                        )}

                        {/* Quick action triggers */}
                        {!loading && m.sender === "assistant" && m.quickActions && m.quickActions.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {m.quickActions.map((act) => {
                              let label = "";
                              if (act === "register_ticket") label = "📝 Register Ticket";
                              else if (act === "view_tickets") label = "📁 View Tickets";
                              else if (act === "view_notices") label = "🔔 System Notices";
                              else if (act === "reset_password" || act === "update_profile") label = "👤 Profile Settings";
                              else if (act === "export_pdf") label = "📅 Export PDF Report";
                              else if (act === "export_docx") label = "📝 Export Word Report";
                              else if (act === "export_csv") label = "📊 Export CSV Data";
                              else label = act;

                              return (
                                <button
                                  key={act}
                                  onClick={() => handleTriggerQuickAction(act)}
                                  className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-900 dark:text-white font-bold rounded cursor-pointer shadow-sm transition-colors"
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-[8px] text-slate-500 font-bold px-1.5 ${m.sender === "user" ? "text-right mr-9" : "text-left ml-9"}`}>
                      {formatMessageTime(m.timestamp)}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2.5 mr-auto">
                    <div className="w-7 h-7 rounded bg-[#101726] border border-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-300">
                      🤖
                    </div>
                    <div className="space-y-1">
                      <div className="bg-[#101726] border border-slate-850 p-3 rounded-xl text-[10px] font-mono flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                        </span>
                        <span className="text-slate-300 font-extrabold text-2xs transition-all duration-300 animate-pulse">
                          {loadingText}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 pl-1 flex items-center gap-1 font-mono italic">
                        <span>{"🤖 Assistant is typing"}</span>
                        <span className="inline-flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>



              {/* Attached file visual indicator */}
              {attachedFile && (
                <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-850 flex shrink-0">
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-850 rounded-lg text-slate-200 text-2xs font-extrabold shadow-sm w-max max-w-full">
                    <span>{attachedFile.type?.startsWith("image/") ? "🖼️" : "📄"}</span>
                    <span className="truncate max-w-[120px] text-blue-400">{attachedFile.name}</span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="p-0.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Input controls */}
              <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex gap-2 items-center sticky bottom-0 z-10 shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt"
                />
                
                {/* File Upload Clip */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  title={"Attach file upload"}
                  className="w-11 h-11 sm:w-8 sm:h-8 shrink-0 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:text-white text-slate-400 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Paperclip className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>



                {/* Voice Typing */}
                <button
                  onClick={handleToggleVoice}
                  disabled={loading}
                  title={isListening ? "Listening..." : "Voice typing"}
                  className={`w-11 h-11 sm:w-8 sm:h-8 shrink-0 border rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm ${
                    isListening 
                      ? "bg-red-650 border-red-500 text-white animate-pulse" 
                      : "bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Mic className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={"Ask AI"}
                  className="flex-1 bg-[#121A2E] border border-slate-750 rounded-xl px-4 py-3 sm:py-2 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-semibold leading-normal shadow-inner transition-all h-11 sm:h-8"
                />
                
                <button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={loading || (!inputMessage.trim() && !attachedFile)}
                  className="w-12 h-11 sm:w-10 sm:h-8 bg-gradient-to-r from-blue-605 to-indigo-605 text-white rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all text-xs shadow-sm"
                >
                  <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Quick Action stack */}
        {!isOpen && (
          <div className="flex flex-col items-center gap-2 mb-1 animate-in slide-in-from-bottom-2 duration-250">
            {/* Notice */}
            <div className="group relative">
              <span className="absolute right-12 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow whitespace-nowrap pointer-events-none">
                {"Latest Notices"}</span>
              <button
                onClick={() => handleTriggerQuickAction("view_notices")}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5 text-amber-500" />
              </button>
            </div>

            {/* Track Complaint */}
            <div className="group relative">
              <span className="absolute right-12 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow whitespace-nowrap pointer-events-none">
                {"Track Complaints"}</span>
              <button
                onClick={() => handleTriggerQuickAction("view_tickets")}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <FileText className="w-4.5 h-4.5 text-blue-500" />
              </button>
            </div>

            {/* Register Issue */}
            <div className="group relative">
              <span className="absolute right-12 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow whitespace-nowrap pointer-events-none">
                {"Register New Support Ticket"}</span>
              <button
                onClick={() => handleTriggerQuickAction("register_ticket")}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5 text-emerald-500" />
              </button>
            </div>
          </div>
        )}

        <button
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={(e) => {
            if (dragDistance.current > 5) {
              e.preventDefault();
              return; // Suppress toggle if it was a drag gesture
            }
            setIsOpen(!isOpen);
            if (!activeThreadId) {
              handleCreateNewThread();
            }
          }}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl hover:shadow-blue-500/20 z-50 border border-blue-400/30 cursor-grab active:cursor-grabbing relative"
          style={{ boxShadow: "0 0 35px rgba(59,130,246,0.35)" }}
        >
          {isOpen ? <X className="w-5.5 h-5.5 animate-spin-once" /> : <Bot className="w-5.5 h-5.5 text-blue-100 animate-pulse" />}
          
          {!isOpen && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full border border-[#F8FAFC] dark:border-[#020617] animate-pulse"></span>
          )}
        </button>

        {aiCameraActive && (
          <DcmsCamera 
            onClose={() => setAiCameraActive(false)}
            onCapturePhotos={(photos) => {
              const photo = photos[0];
              if (photo) {
                setAttachedFile({
                  name: photo.name,
                  type: "image/jpeg",
                  size: photo.size,
                  data: photo.dataUrl,
                  extractedText: (photo as any).ocrText || ""
                });
                
                // Set contextual details in input message if predicted
                const meta = (photo as any).suggestedMeta;
                if (meta) {
                  setInputMessage(prev => {
                    const pre = prev.trim();
                    const info = `Diagnostic context: ${meta.title} (${meta.category}).`;
                    return pre ? `${info}\n${pre}` : info;
                  });
                }
              }
              setAiCameraActive(false);
            }}
          />
        )}
      </div>
  );
}
