import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext.tsx";
import { useMeeting } from "../lib/MeetingContext.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";
import {
  Group,
  Panel,
  Separator
} from "react-resizable-panels";
import {
  Users, Hash, MessageSquare, Send, Paperclip, Smile, Reply, Edit2,
  Trash2, Search, Bell, Sparkles, Check, CheckCheck, CornerDownRight, X, Phone, Video,
  Pin, MoreVertical, Plus, Trash, Edit, Shield, ArrowRight, Volume2, ShieldAlert,
  Archive, FileText, CheckCircle2, Play, Pause, Mic, Square, Trash2 as TrashIcon, RotateCcw,
  VolumeX, Menu, ChevronRight, ChevronLeft, PhoneOff, VideoOff, Monitor, Settings as SettingsIcon, Link2, Activity, CheckSquare, XCircle, ChevronDown, Minimize2, MicOff
} from "lucide-react";
import { AudioVisualizer } from "../components/AudioVisualizer";

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  is_pinned?: boolean;
  is_archived?: boolean; // NEW: Archive Channel support
  created_at: string;
  created_by?: string;
  deleted_by_user?: string[]; // list of user ids who deleted this room
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  time: string;
  reply_to?: {
    id: string;
    sender_name: string;
    text: string;
  } | null;
  reactions?: Record<string, string[]>; // emoji -> list of admin names
  attachments?: Array<{ name: string; url: string; type: string }>;
  is_edited?: boolean;
  is_pinned?: boolean;
  deleted_for?: string[]; // list of user ids who deleted this message
  message_status?: "sent" | "delivered" | "read";
  is_voice_note?: boolean; // Voice memo support
  voice_duration?: number; // duration in seconds
  audio_url?: string; // real audio url blob
  call_summary?: {
    type: "voice" | "video";
    duration: string;
    participants: string[];
    screenShareUsed?: boolean;
    recordingNotes?: string;
    ticketNumber?: string;
    ticketTitle?: string;
    description?: string;
    discussionSummary?: string[];
    recordingAvailable?: boolean;
    transcriptSaved?: boolean;
    screensShared?: number;
  };
}

interface Teammate {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "offline" | "away" | "in_call";
}

interface RecentCall {
  id: string;
  type: "voice" | "video";
  timestamp: string;
  title: string;
  participants: string[];
  duration: string;
}

export default function AdminTeamChat() {
  const { dbUser } = useAuth();

  const currentAdminName = dbUser?.name || "Kavitha";
  const currentAdminId = dbUser?.id || "usr_kavitha";

  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>("ch_general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Layout & Resizing States
  const [panelKey, setPanelKey] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<"channels" | "chat" | "users">("chat");
  const [isArchivedSectionExpanded, setIsArchivedSectionExpanded] = useState<boolean>(false);

  // Form inputs
  const [commentInput, setCommentInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [globalSearch, setGlobalSearch] = useState<string>(""); // Left-side search channels
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState<string>("");
  const [chatFiles, setChatFiles] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Mention Suggestions popup state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState<boolean>(false);
  const [mentionFilter, setMentionFilter] = useState<string>("");

  // Drag-and-Drop file overlay
  const [isDraggingOverChat, setIsDraggingOverChat] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);

  // Simulated Voice Note state
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceSeconds, setVoiceSeconds] = useState<number>(0);
  const voiceTimerRef = useRef<any>(null);

  // Playing state for voices
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playingVoiceProg, setPlayingVoiceProg] = useState<number>(0);
  const playbackTimerRef = useRef<any>(null);
  const [expandedCallDetailsMessageIds, setExpandedCallDetailsMessageIds] = useState<string[]>([]);

  // RECENT CALL HISTORY SIDEBAR SECTION STATES
  const [isRecentCallsCollapsed, setIsRecentCallsCollapsed] = useState<boolean>(false);
  const [isFetchingRecentCalls, setIsFetchingRecentCalls] = useState<boolean>(true);
  const [selectedCallDetail, setSelectedCallDetail] = useState<RecentCall | null>(null);

  // Channel Unread statuses (simulated updates)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({
    "ch_infrastructure": 2,
    "ch_triage_policy": 0
  });

  // UI Panels / Menus
  const [isChannelsSidebarOpen, setIsChannelsSidebarOpen] = useState<boolean>(true);
  const [isChannelsSidebarCollapsed, setIsChannelsSidebarCollapsed] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("dcms_chat_channels_collapsed") === "true";
  });
  const [showMembersPanel, setShowMembersPanel] = useState<boolean>(() => {
    return localStorage.getItem("dcms_chat_show_members") !== "false";
  });
  const [showAiMenu, setShowAiMenu] = useState<boolean>(false);
  const [activeMessageActionId, setActiveMessageActionId] = useState<string | null>(null);

  // Batch Select Mode State
  const [isSelectModeActive, setIsSelectModeActive] = useState<boolean>(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [selectedTeammatesForCall, setSelectedTeammatesForCall] = useState<string[]>([]);



  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dcms_chat_deleted_for_me");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDeleteForMe = (msgId: string) => {
    const updated = [...deletedForMeIds, msgId];
    setDeletedForMeIds(updated);
    localStorage.setItem("dcms_chat_deleted_for_me", JSON.stringify(updated));

    // Also update main messages store in local storage to keep them in sync
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];
    const updatedMsgs = allMessages.map(m => {
      if (m.id === msgId) {
        return { ...m, deleted_for: [...(m.deleted_for || []), currentAdminId] };
      }
      return m;
    });
    saveMessagesToStorage(updatedMsgs);
  };

  const channelsPanelRef = useRef<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showNewChatPanel, setShowNewChatPanel] = useState<boolean>(false);
  const [customRoomName, setCustomRoomName] = useState<string>("");
  const [customRoomDesc, setCustomRoomDesc] = useState<string>("");
  const [dropdownRoomId, setDropdownRoomId] = useState<string | null>(null);
  const [forwardDialogMsg, setForwardDialogMsg] = useState<ChatMessage | null>(null);

  // Admin user active status setting
  const [currentUserStatus, setCurrentUserStatus] = useState<"online" | "offline" | "away">("online");
  const [showStatusMenu, setShowStatusMenu] = useState<boolean>(false);

  // Deletion Dialog State
  const [deleteConfRoom, setDeleteConfRoom] = useState<ChatRoom | null>(null);
  const [deleteConfMsg, setDeleteConfMsg] = useState<ChatMessage | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState<boolean>(false);

  // AI improve loading indicators
  const [loadingImprove, setLoadingImprove] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<string | null>(null);
  const [polishMode, setPolishMode] = useState<"professional" | "friendly" | "shorten" | "detailed">("professional");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Panel sizing persistence helper
  const [panelLayouts, setPanelLayouts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("dcms-chat-panel-layout-map-v2");
      return saved ? JSON.parse(saved) : {
        "channels-panel": 25,
        "chat-panel": 60,
        "users-panel": 15
      };
    } catch {
      return {
        "channels-panel": 25,
        "chat-panel": 50,
        "users-panel": 25
      };
    }
  });

  // Teammates database structure
  const [teammates, setTeammates] = useState<Teammate[]>([
    { id: "usr_kavitha", name: "Kavitha", role: "Triage Supervisor", avatar: "👩‍💼", status: "online" },
    { id: "usr_arun", name: "Arun", role: "Network Administrator", avatar: "👨‍💻", status: "online" },
    { id: "usr_priya", name: "Priya", role: "Software Support", avatar: "👩‍💻", status: "online" },
    { id: "usr_karthik", name: "Karthik", role: "Senior Database Architect", avatar: "👨", status: "in_call" },
    { id: "usr_sarah", name: "Sarah", role: "Systems Security Specialist", avatar: "👩‍💻", status: "offline" },
    { id: "usr_kiki", name: "Kiki Employee", role: "Support Desk", avatar: "👧", status: "offline" }
  ]);

  // CUSTOM CALL SELECTION DIALOGUE STATES
  const [isNewCallDialogOpen, setIsNewCallDialogOpen] = useState<boolean>(false);
  const [newCallType, setNewCallType] = useState<"voice" | "video">("voice");
  const [newCallMode, setNewCallMode] = useState<"direct" | "multi" | "group">("multi");
  const [selectedParticipantsForNewCall, setSelectedParticipantsForNewCall] = useState<string[]>([]);

  // Synchronize dynamic user details to teammates array to avoid key and name representation conflicts
  useEffect(() => {
    setTeammates(prev => {
      let changed = false;
      const nextTeammates = prev.map(t => {
        if (t.id === "usr_kavitha" || t.id === currentAdminId || t.name === "Kavitha" || t.name === currentAdminName) {
          if (t.id !== currentAdminId || t.name !== currentAdminName) {
            changed = true;
            return {
              ...t,
              id: currentAdminId,
              name: currentAdminName
            };
          }
        }
        return t;
      });
      return changed ? nextTeammates : prev;
    });
  }, [currentAdminId, currentAdminName]);

  // Responsive device window detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch recent calls with a simulated network delay
  useEffect(() => {
    const defaultRecentCalls: RecentCall[] = [
      {
        id: "call_def_1",
        type: "video",
        timestamp: "2 hours ago",
        title: "Network Diagnostics Huddle",
        participants: ["Kavitha", "Arun", "Priya"],
        duration: "14:22"
      },
      {
        id: "call_def_2",
        type: "voice",
        timestamp: "Today, 10:30 AM",
        title: "System Outage Alignment",
        participants: ["Kavitha", "Karthik"],
        duration: "08:15"
      },
      {
        id: "call_def_3",
        type: "video",
        timestamp: "Yesterday, 3:45 PM",
        title: "Severity-1 Ticket Debrief",
        participants: ["Kavitha", "Arun", "Karthik", "Sarah"],
        duration: "34:10"
      }
    ];

    setIsFetchingRecentCalls(true);
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("dcms_recent_calls_v1");
      if (stored) {
        try {
          setRecentCalls(JSON.parse(stored));
        } catch (e) {
          setRecentCalls(defaultRecentCalls);
        }
      } else {
        setRecentCalls(defaultRecentCalls);
        localStorage.setItem("dcms_recent_calls_v1", JSON.stringify(defaultRecentCalls));
      }
      setIsFetchingRecentCalls(false);
    }, 550);

    return () => clearTimeout(timer);
  }, []);

  // Sync current user status changes to teammates view
  useEffect(() => {
    setTeammates(prev => {
      let changed = false;
      const nextTeammates = prev.map(t => {
        if (t.id === currentAdminId) {
          if (t.status !== currentUserStatus) {
            changed = true;
            return { ...t, status: currentUserStatus };
          }
        }
        return t;
      });
      return changed ? nextTeammates : prev;
    });
  }, [currentUserStatus, currentAdminId]);

  // ACTIVE CALL SYSTEM STATE
  interface HuddleParticipant {
    id: string;
    name: string;
    role: string;
    avatar: string;
    isSpeaking: boolean;
    isMuted: boolean;
    isCameraOn: boolean;
  }

  interface HuddleTranscript {
    senderName: string;
    text: string;
    time: string;
  }

  const {
    activeCall, setActiveCall, startHuddleCall, endHuddleCall,
    localCamStream, screenStream, userStream, audioLevel,
    micPermission, camPermission, speechStatus, setSpeechStatus,
    isVoicePlaybackMuted, setIsVoicePlaybackMuted, recentCalls, setRecentCalls,
    requestMicrophone, requestCamera, requestScreenShare, stopScreenShare,
    postHuddleNotes, speakText
  } = useMeeting();

  // Real Call simulation states & Voice feedback
  const [callParticipants, setCallParticipants] = useState<HuddleParticipant[]>([]);
  const [isAiTeammateModeActive, setIsAiTeammateModeActive] = useState<boolean>(true);
  const [busyCallTarget, setBusyCallTarget] = useState<Teammate | null>(null);
  const recognitionRef = useRef<any>(null);

  // Status system state variables
  const [statusAvailable, setStatusAvailable] = useState<string>("Available");
  const [statusBusy, setStatusBusy] = useState<string>("Busy");
  const [statusOffline, setStatusOffline] = useState<string>("Offline");
  const [statusAway, setStatusAway] = useState<string>("Away");

  // Supporting states for Busy teammate call overlay
  const [isLeavingMessage, setIsLeavingMessage] = useState<boolean>(false);
  const [stickyMessageText, setStickyMessageText] = useState<string>("");
  const [notifiedUsers, setNotifiedUsers] = useState<string[]>([]);
  const [busySuccessMessage, setBusySuccessMessage] = useState<string | null>(null);

  // Trigger immediate systems alerts when notified busy teammates return to Available status
  useEffect(() => {
    if (notifiedUsers.length === 0) return;
    let anyTriggered = false;
    let nextNotified = [...notifiedUsers];

    notifiedUsers.forEach(userId => {
      const target = teammates.find(t => t.id === userId);
      if (target && target.status === "online") {
        anyTriggered = true;
        // Voice announce
        speakText(`${target.name} is now ${statusAvailable}.`, "System Alert");
        
        // Remove from notification registry
        nextNotified = nextNotified.filter(id => id !== userId);

        // Inject alert message into active chat room
        const alertText = `🔔 **Availability Alert**: @${target.name} has completed their previous call and is now **${statusAvailable}**!`;
        handleSendMessage(undefined, alertText);
      }
    });

    if (anyTriggered) {
      setNotifiedUsers(nextNotified);
    }
  }, [teammates, notifiedUsers, statusAvailable]);

  const submitStickyMessage = () => {
    if (!stickyMessageText.trim() || !busyCallTarget) return;
    const textToSend = `📥 [Left Note for ${busyCallTarget.name}]: ${stickyMessageText.trim()}`;
    handleSendMessage(undefined, textToSend);

    setBusySuccessMessage(`✅ Message successfully left for ${busyCallTarget.name}!`);
    setStickyMessageText("");
    setTimeout(() => {
      setBusyCallTarget(null);
      setIsLeavingMessage(false);
      setBusySuccessMessage(null);
    }, 2200);
  };

  const toggleNotificationRequest = () => {
    if (!busyCallTarget) return;
    const isAlreadyNotified = notifiedUsers.includes(busyCallTarget.id);
    if (isAlreadyNotified) {
      setNotifiedUsers(prev => prev.filter(id => id !== busyCallTarget.id));
      setBusySuccessMessage(`Removed availability watch alert for ${busyCallTarget.name}.`);
      setTimeout(() => setBusySuccessMessage(null), 1500);
    } else {
      setNotifiedUsers(prev => [...prev, busyCallTarget.id]);
      setBusySuccessMessage(`🔔 Watch alert set! You will be notified with a system callout when ${busyCallTarget.name} becomes ${statusAvailable}.`);
      setTimeout(() => {
        setBusyCallTarget(null);
        setBusySuccessMessage(null);
      }, 3000);
    }
  };

  // Triggering call actions with support for 3 user call types (Direct, Multi-Select, Team Huddle)
  const startCall = (
    type: "voice" | "video",
    mode: "direct" | "multi" | "group" = "group",
    targetIds: string[] = []
  ) => {
    // 1. Filter out logged in admin from inputs to prevent duplicates
    const uniqueTargetIds = targetIds.filter(id => id !== currentAdminId);

    // 2. Busy check: Intercept calling busy teammates (i.e. status === "in_call")
    const busyPeer = teammates.find(t => uniqueTargetIds.includes(t.id) && t.status === "in_call");
    if (busyPeer) {
      setBusyCallTarget(busyPeer);
      return;
    }

    // 3. Force participant selection validation
    if (mode !== "group" && uniqueTargetIds.length === 0) {
      alert("Select at least one teammate");
      return;
    }

    // 4. Build participants state automatically adding current admin
    const currentAdminData = teammates.find(t => t.id === currentAdminId) || null;
    const initialParticipants: HuddleParticipant[] = [
      { id: currentAdminId, name: currentAdminName, role: currentAdminData ? currentAdminData.role : "Triage Supervisor", avatar: currentAdminData ? currentAdminData.avatar : "👩‍💼", isSpeaking: false, isMuted: false, isCameraOn: type === "video" }
    ];

    uniqueTargetIds.forEach(tid => {
      const match = teammates.find(t => t.id === tid);
      if (match) {
        initialParticipants.push({
          id: match.id,
          name: match.name,
          role: match.role,
          avatar: match.avatar,
          isSpeaking: false,
          isMuted: false,
          isCameraOn: type === "video"
        });
      }
    });

    setCallParticipants(initialParticipants);
    startHuddleCall(activeRoomId, type, initialParticipants, "#TKT-5486", "Database Outages & Level-2 Escalations Queue Spike");
  };

  // Helper time formatter
  const formatCallDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // Speaks live audio peak wave strings like "▂▅▇█" or "▂▃▅▇"
  const renderAudioVisualizer = (id: string, isSpeaking: boolean) => {
    if (!isSpeaking) {
      return <span className="text-slate-600 dark:text-slate-600 font-mono text-[9px] tracking-tight">▱▱▱▱</span>;
    }

    if (id === "usr_kavitha") {
      const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
      const baseVal = Math.max(1, Math.min(7, audioLevel));
      // Generate real-time fluctuating dynamic sequence for Kavitha (using actual mic level)
      const sequence = Array.from({ length: 6 }).map(() => {
        const offset = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const idx = Math.max(0, Math.min(7, baseVal + offset));
        return bars[idx];
      }).join("");
      return <span className="text-emerald-400 font-mono text-[11.5px] tracking-tighter" title="Mic Audio Stream Inward">{sequence}</span>;
    } else {
      // Simulate nice live peak stream waves for team members
      const bars = ["▂", "▃", "▄", "▅", "▆", "▇", "█"];
      const sequence = Array.from({ length: 6 }).map(() => {
        const idx = Math.floor(Math.random() * 5) + 2; // index 2 to 6
        return bars[idx];
      }).join("");
      return <span className="text-indigo-400 font-mono text-[11.5px] tracking-tighter" title="VoIP Audio Inward">{sequence}</span>;
    }
  };



  // Initial Load: seed rooms & messages
  useEffect(() => {
    loadWorkspaceRooms();
    loadWorkspaceMessages();
  }, []);

  // Update messages feed when active room switches
  useEffect(() => {
    loadWorkspaceMessages();
    setReplyTarget(null);
    setCommentInput("");
    setChatFiles([]);
    setEditingMessageId(null);
    setShowMentionSuggestions(false);
    
    // Clear unread counts for selected channel
    if (activeRoomId) {
      setUnreadCounts(prev => ({ ...prev, [activeRoomId]: 0 }));
    }
  }, [activeRoomId]);

  // Load Rooms
  const loadWorkspaceRooms = () => {
    const saved = localStorage.getItem("dcms_chat_rooms_v4");
    let loadedRooms: ChatRoom[] = saved ? JSON.parse(saved) : [];

    if (loadedRooms.length === 0) {
      loadedRooms = [
        { id: "ch_general", name: "general-support-team", description: "Default board for public administrator collaboration", is_pinned: true, count: 0, created_at: new Date().toISOString() },
        { id: "ch_tkt_548610", name: "ticket-548610", description: "Database locking incident", is_pinned: true, count: 0, created_at: new Date().toISOString() },
        { id: "ch_tkt_548611", name: "ticket-548611", description: "Billing Gateway Error", is_pinned: true, count: 0, created_at: new Date().toISOString() },
        { id: "ch_infrastructure", name: "infrastructure-incidents", description: "Critical network alerts, server downtime issues", is_pinned: false, created_at: new Date().toISOString() },
        { id: "ch_db_issues", name: "database-issues", description: "Priority 1 DB Issues discussion", is_pinned: false, created_at: new Date().toISOString() },
        { id: "ch_triage_policy", name: "triage-resolution-rules", description: "Corporate rules and ticketing guidelines", is_pinned: false, created_at: new Date().toISOString() }
      ] as ChatRoom[];
      localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(loadedRooms));
    }
    setRooms(loadedRooms);
  };

  // Load Messages
  const loadWorkspaceMessages = () => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let loadedMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];

    if (loadedMessages.length === 0) {
      loadedMessages = [
        {
          id: "seedmsg_1",
          room_id: "ch_general",
          sender_id: "usr_arun",
          sender_name: "Arun",
          text: "Welcome, team! Here is our central operations support channel. We can communicate, coordinate and direct ticket issues through this live console. Feel free to @mention me or @Priya if anything comes up.",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          time: "10:30 AM",
          message_status: "read",
          reactions: { "👍": ["Priya", "Kavitha"] }
        },
        {
          id: "seedmsg_2",
          room_id: "ch_general",
          sender_id: "usr_priya",
          sender_name: "Priya",
          text: "Thanks, Arun. I'm actively monitoring software platform outages. Feel free to drop draft screenshot issues directly here.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          time: "11:15 AM",
          message_status: "read",
          reactions: { "🎉": ["Arun"] }
        }
      ];
      localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(loadedMessages));
    }

    // Filter messages for current room, that aren't deleted
    const filtered = loadedMessages.filter(m => m.room_id === activeRoomId && (!m.deleted_for || !m.deleted_for.includes(currentAdminId)));
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Automatically flag non-self messages inside this view room as read
    const readUpdated = filtered.map(m => {
      if (m.sender_id !== currentAdminId && m.message_status !== "read") {
        return { ...m, message_status: "read" as const };
      }
      return m;
    });

    setMessages(readUpdated);
    setTimeout(() => scrollToBottom(), 80);
  };

  const saveRoomsToStorage = (updatedRooms: ChatRoom[]) => {
    localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(updatedRooms));
    setRooms(updatedRooms);
  };

  const saveMessagesToStorage = (updatedMessages: ChatMessage[]) => {
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(updatedMessages));
    loadWorkspaceMessages();
    window.dispatchEvent(new CustomEvent("dcms_messages_updated"));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Synced local states across multiple tabs and persistent huddle sessions
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dcms_chat_rooms_v4") {
        loadWorkspaceRooms();
      }
      if (e.key === "dcms_chat_messages_v4") {
        loadWorkspaceMessages();
      }
    };
    const handleCustomChange = () => {
      loadWorkspaceMessages();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("dcms_messages_updated", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("dcms_messages_updated", handleCustomChange);
    };
  }, [activeRoomId]);

  // Clean playbacks on unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  // Auto scroll to latest message when activeRoomId or messages count changes
  useEffect(() => {
    scrollToBottom();
  }, [activeRoomId, messages.length]);



  // Send message handler with delivery status cycle simulation
  const handleSendMessage = (
    e?: React.FormEvent, 
    customMsgText?: string, 
    voiceNoteMeta?: { is_voice: boolean, secs: number, audio_url?: string },
    callSummaryMeta?: ChatMessage["call_summary"]
  ) => {
    if (e) e.preventDefault();
    const finalTxt = customMsgText !== undefined ? customMsgText : commentInput;
    if (!finalTxt.trim() && chatFiles.length === 0 && !voiceNoteMeta && !callSummaryMeta) return;

    const messageId = "chatmsg_" + Date.now();
    const newMsg: ChatMessage = {
      id: messageId,
      room_id: activeRoomId,
      sender_id: currentAdminId,
      sender_name: currentAdminName,
      text: finalTxt,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reply_to: replyTarget ? { id: replyTarget.id, sender_name: replyTarget.sender_name, text: replyTarget.text } : null,
      attachments: chatFiles.length > 0 ? chatFiles : undefined,
      reactions: {},
      message_status: "sent", // single tick
      is_voice_note: voiceNoteMeta?.is_voice || undefined,
      voice_duration: voiceNoteMeta?.secs || undefined,
      audio_url: voiceNoteMeta?.audio_url || undefined,
      call_summary: callSummaryMeta || undefined
    };

    const saved = localStorage.getItem("dcms_chat_messages_v4");
    const allMsg: ChatMessage[] = saved ? JSON.parse(saved) : [];
    const combined = [...allMsg, newMsg];
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();

    if (customMsgText === undefined) {
      setCommentInput("");
    }
    setReplyTarget(null);
    setChatFiles([]);
    setShowMentionSuggestions(false);

    // Simulate delivered (double grey tick) after 600ms
    setTimeout(() => {
      const activeSaved = localStorage.getItem("dcms_chat_messages_v4");
      const currentMsgs: ChatMessage[] = activeSaved ? JSON.parse(activeSaved) : [];
      const updated = currentMsgs.map(m => m.id === messageId ? { ...m, message_status: "delivered" as const } : m);
      localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(updated));
      loadWorkspaceMessages();

      // Simulate read (double blue tick) after 1500ms
      setTimeout(() => {
        const afterSaved = localStorage.getItem("dcms_chat_messages_v4");
        const currentMsgs2: ChatMessage[] = afterSaved ? JSON.parse(afterSaved) : [];
        const updated2 = currentMsgs2.map(m => m.id === messageId ? { ...m, message_status: "read" as const } : m);
        localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(updated2));
        loadWorkspaceMessages();
      }, 900);

    }, 600);

    // Trigger simulated teammate replies based on tags/mentions or text search
    const normalized = finalTxt.toLowerCase();
    if (normalized.includes("@arun")) {
      simulateTeammateResponse("Arun", finalTxt);
    } else if (normalized.includes("@priya")) {
      simulateTeammateResponse("Priya", finalTxt);
    } else if (Math.random() > 0.6) {
      setTimeout(() => {
        const repliers = ["Arun", "Priya"];
        const chooser = repliers[Math.floor(Math.random() * repliers.length)];
        simulateTeammateResponse(chooser, finalTxt);
      }, 4500);
    }
  };

  // Smart Context-Aware Response Engine
  const getSimulatedResponse = (name: string, userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    if (name === "Arun") {
      if (msg.includes("ticket") || msg.includes("548")) {
        return "I'm checking ticket 548 now. The DB locking issue was flagged in yesterday's sync as well.";
      }
      if (msg.includes("database") || msg.includes("db") || msg.includes("lock")) {
        return "The transaction pool is spiked at 95% utilization. I'm scaling the Postgres maximum connection pool limits in the Helm config.";
      }
      if (msg.includes("network") || msg.includes("latency") || msg.includes("dns") || msg.includes("ping")) {
        return "Checking regional edge server pings. Latency is currently fluctuating, but the main cloud load balancer is healthy.";
      }
      if (msg.includes("restart") || msg.includes("reboot") || msg.includes("kill") || msg.includes("stop")) {
        return "Understood. Safe termination triggered. Connection pool scaled to 45 connections. Let's monitor database thread stabilization.";
      }
      return `Ack'd! @${currentAdminName}, let me look into that network check right away. Let me know if you need backups.`;
    }
    
    if (name === "Priya") {
      if (msg.includes("ticket") || msg.includes("548")) {
        return "I found a related database incident from yesterday. It was caused by un-indexed query scans on the client complaints table.";
      }
      if (msg.includes("database") || msg.includes("db") || msg.includes("lock")) {
        return "Yes, there's definitely a deadlock thread blocking the corporate client transactions query. Should we run a vacuum table?";
      }
      if (msg.includes("backup") || msg.includes("save") || msg.includes("export")) {
        return "I can initiate a local database backup snapshot and save it directly into the Level 2 Escalations shared drive folder.";
      }
      if (msg.includes("policy") || msg.includes("rule") || msg.includes("sla")) {
        return "The SLA response rules dictate we must resolve P1 database deadlock tickets within 30 minutes. We are on track.";
      }
      return "Got it! I am reviewing the draft ticket feedback and syncing with the database team. Keep me posted or drop me the audit logs.";
    }
    
    if (name === "Karthik") {
      if (msg.includes("ticket") || msg.includes("548") || msg.includes("database") || msg.includes("lock")) {
        return "Database deadlock is verified. Karthik here - I'm running a transaction analyzer scan and locking down thread locks on the table.";
      }
      return `Karthik here. I am online and adjusting database connection pooling limits to match SLA specifications.`;
    }
    
    return "Copy that! Standing by to assist on other active incident queues.";
  };

  const simulateTeammateResponse = (name: string, userMessage: string = "") => {
    setTimeout(() => {
      setTypingUsers(prev => [...prev, name]);
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u !== name));
        
        // Generate a context-aware simulation statement
        const responseText = getSimulatedResponse(name, userMessage);

        const autoMsg: ChatMessage = {
          id: "chatmsg_sim_" + Date.now(),
          room_id: activeRoomId,
          sender_id: `usr_${name.toLowerCase()}`,
          sender_name: name,
          text: responseText,
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          message_status: "read",
          reactions: {}
        };

        const saved = localStorage.getItem("dcms_chat_messages_v4");
        const allMsg: ChatMessage[] = saved ? JSON.parse(saved) : [];
        const combined = [...allMsg, autoMsg];
        localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
        loadWorkspaceMessages();

        // Voice playback synthesis trigger
        speakText(responseText, name);

        // If not focusing on this room, trigger unread badge update!
        if (activeRoomId !== "ch_general") {
          setUnreadCounts(prev => ({
            ...prev,
            "ch_general": (prev["ch_general"] || 0) + 1
          }));
        }
      }, 2500);
    }, 1000);
  };

  // Add highly editable new custom channel features
  const handleCreateRoom = (predefinedName?: string) => {
    const finalName = predefinedName || customRoomName.trim();
    if (!finalName) return;

    const roomId = "room_" + Date.now();
    const newRoom: ChatRoom = {
      id: roomId,
      name: finalName.toLowerCase().replace(/\s+/g, "-"),
      description: customRoomDesc.trim() || `Dedicated workspace for #${finalName}`,
      is_pinned: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      created_by: currentAdminId
    };

    const updated = [...rooms, newRoom];
    saveRoomsToStorage(updated);
    setActiveRoomId(roomId);

    setCustomRoomName("");
    setCustomRoomDesc("");
    setShowNewChatPanel(false);
  };

  // Toggle Pins
  const handleTogglePinChannel = (roomId: string) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, is_pinned: !r.is_pinned } : r);
    saveRoomsToStorage(updated);
    setDropdownRoomId(null);
  };

  // Toggle Archive statuses
  const handleToggleArchiveChannel = (roomId: string) => {
    const updated = rooms.map(r => {
      if (r.id === roomId) {
        const currentArch = !!r.is_archived;
        return { ...r, is_archived: !currentArch, is_pinned: false };
      }
      return r;
    });
    saveRoomsToStorage(updated);
    setDropdownRoomId(null);

    // If active room got archived, bounce active index to general fallback
    if (activeRoomId === roomId) {
      setActiveRoomId("ch_general");
    }
  };

  // Rename Channel Name
  const handleRenameChannel = (roomId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = rooms.map(r => r.id === roomId ? { ...r, name: newName.toLowerCase().replace(/\s+/g, "-") } : r);
    saveRoomsToStorage(updated);
    setDropdownRoomId(null);
  };

  // Physical purge confirmations
  const handleConfirmDeleteRoom = (type: "me" | "everyone") => {
    if (!deleteConfRoom) return;

    if (type === "me") {
      const updated = rooms.map(r => {
        if (r.id === deleteConfRoom.id) {
          return { ...r, deleted_by_user: [...(r.deleted_by_user || []), currentAdminId] };
        }
        return r;
      });
      saveRoomsToStorage(updated);
      if (activeRoomId === deleteConfRoom.id) {
        setActiveRoomId("ch_general");
      }
    } else {
      const updatedRooms = rooms.filter(r => r.id !== deleteConfRoom.id);
      saveRoomsToStorage(updatedRooms);

      const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
      let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];
      const keptMessages = allMessages.filter(m => m.room_id !== deleteConfRoom.id);
      localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(keptMessages));

      if (activeRoomId === deleteConfRoom.id) {
        setActiveRoomId("ch_general");
      }
    }
    setDeleteConfRoom(null);
    setDropdownRoomId(null);
  };

  // Message modifications
  const handleSaveEditMessage = (msgId: string) => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];
    const updated = allMessages.map(m => m.id === msgId ? { ...m, text: editInput, is_edited: true } : m);
    saveMessagesToStorage(updated);
    setEditingMessageId(null);
  };

  const handleConfirmDeleteMessage = (type: "me" | "everyone") => {
    if (!deleteConfMsg) return;

    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];

    if (type === "me") {
      const updated = allMessages.map(m => {
        if (m.id === deleteConfMsg.id) {
          return { ...m, deleted_for: [...(m.deleted_for || []), currentAdminId] };
        }
        return m;
      });
      // Synchronize with deletedForMeIds state and localStorage for complete state sync
      const updatedForMe = [...deletedForMeIds, deleteConfMsg.id];
      setDeletedForMeIds(updatedForMe);
      localStorage.setItem("dcms_chat_deleted_for_me", JSON.stringify(updatedForMe));

      saveMessagesToStorage(updated);
    } else {
      // The logged-in administrator is authorized to delete any message (including teammate or AI messages) for everyone
      const updated = allMessages.filter(m => m.id !== deleteConfMsg.id);
      saveMessagesToStorage(updated);
    }
    setDeleteConfMsg(null);
  };

  const handleConfirmBulkDelete = () => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];
    const updated = allMessages.filter(m => !selectedMessageIds.includes(m.id));
    saveMessagesToStorage(updated);
    setSelectedMessageIds([]);
    setIsSelectModeActive(false);
    setBulkDeleteConfirmOpen(false);
  };

  // Quick reactions ticks
  const handleToggleReaction = (msgId: string, emoji: string) => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];

    const updated = allMessages.map(m => {
      if (m.id === msgId) {
        const reactionsMap = m.reactions ? { ...m.reactions } : {};
        const reactors = reactionsMap[emoji] ? [...reactionsMap[emoji]] : [];
        const idx = reactors.indexOf(currentAdminName);

        if (idx > -1) {
          reactors.splice(idx, 1);
        } else {
          reactors.push(currentAdminName);
        }

        if (reactors.length === 0) {
          delete reactionsMap[emoji];
        } else {
          reactionsMap[emoji] = reactors;
        }

        return { ...m, reactions: reactionsMap };
      }
      return m;
    });

    saveMessagesToStorage(updated);
    setShowEmojiPicker(null);
  };

  // Pins messages highlight
  const handleTogglePinMessage = (msgId: string) => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];

    const updated = allMessages.map(m => {
      if (m.id === msgId) {
        return { ...m, is_pinned: !m.is_pinned };
      }
      return m;
    });
    saveMessagesToStorage(updated);
  };

  // Forward details
  const handleForwardMessage = (roomId: string) => {
    if (!forwardDialogMsg) return;

    const newMsg: ChatMessage = {
      id: "forward_" + Date.now(),
      room_id: roomId,
      sender_id: currentAdminId,
      sender_name: `${currentAdminName} (Forwarded)`,
      text: forwardDialogMsg.text,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: forwardDialogMsg.attachments,
      reactions: {},
      message_status: "read",
      is_voice_note: forwardDialogMsg.is_voice_note,
      voice_duration: forwardDialogMsg.voice_duration
    };

    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];
    const combined = [...allMessages, newMsg];
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));

    setForwardDialogMsg(null);
    setActiveRoomId(roomId);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Message copied to clipboard!");
  };

  // AI Enhance gemini API integration
  const handleAIEnhanceMessage = async (customMode?: "professional" | "friendly" | "shorten" | "detailed" | "grammar" | "summarize") => {
    if (!commentInput.trim()) return;
    setLoadingImprove(true);
    const activeMode = customMode || polishMode;

    const steps = [
      "Analyzing ticket draft...",
      "Matching company policy...",
      "Drafting polished text...",
      "Finalizing response..."
    ];

    let stepIdx = 0;
    setAiStep(steps[stepIdx]);

    const timer = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setAiStep(steps[stepIdx]);
      }
    }, 550);

    try {
      const res = await fetch("/api/gemini/improve-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentInput,
          mode: activeMode,
          ticketDescription: "Reviewing active system status & team SLA rules."
        })
      });

      clearInterval(timer);
      setAiStep("Done! ✨");

      if (!res.ok) throw new Error("Gemini network error");
      const data = await res.json();
      if (data.improvedText) {
        setCommentInput(data.improvedText);
      }
    } catch {
      clearInterval(timer);
      // Client-side quick replacement backup
      const prefixes: Record<string, string> = {
        professional: "Dear team, to coordinate on this concern efficiently: ",
        friendly: "Hey everyone! Quick heads up on this coordinate: ",
        shorten: "Briefly: ",
        detailed: "Comprehensive status update regarding our active coordination: ",
        grammar: "[Corrected Grammar]: ",
        summarize: "[AI Summary]: "
      };
      setCommentInput(`${prefixes[activeMode] || ""}${commentInput}`);
    } finally {
      setTimeout(() => {
        setLoadingImprove(false);
        setAiStep(null);
      }, 350);
    }
  };

  // Drag-and-Drop triggers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOverChat(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingOverChat(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files) as File[];
    processUploadedFiles(files);
  };

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processUploadedFiles(files);
  };

  const processUploadedFiles = (files: File[]) => {
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setChatFiles((prev) => [
          ...prev,
          {
            name: f.name,
            url: base64,
            type: f.type.startsWith("image/") ? "image" : "doc"
          }
        ]);
      };
      reader.readAsDataURL(f);
    });
  };

  // Input events with active mention Suggestions triggering
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentInput(val);

    const words = val.split(" ");
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      setMentionFilter(lastWord.slice(1).toLowerCase());
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const selectMentionUser = (name: string) => {
    const words = commentInput.split(" ");
    words[words.length - 1] = `@${name} `;
    setCommentInput(words.join(" "));
    setShowMentionSuggestions(false);
  };

  // Speech recognition and live typing simulators
  const typingSimTimerRef = useRef<any>(null);

  const simulateLiveTranscriptionFallback = () => {
    if (typingSimTimerRef.current) clearInterval(typingSimTimerRef.current);
    
    const samples = [
      "Reviewing system health telemetry checks in the operations environment...",
      "Confirmed SLA response threshold is active and compliant with priority levels.",
      "Updating ticket logs with the latest patch and status information.",
      "Triage supervisor validating current incident resolution rules.",
      "Alerting the network administration team regarding the core routing group update."
    ];
    const speechResult = samples[Math.floor(Math.random() * samples.length)];
    let index = 0;
    
    // Smooth delay before starting live transcription simulation
    setTimeout(() => {
      typingSimTimerRef.current = setInterval(() => {
        if (index < speechResult.length) {
          const nextChar = speechResult.charAt(index);
          setCommentInput(prev => prev + nextChar);
          index++;
        } else {
          clearInterval(typingSimTimerRef.current);
        }
      }, 50);
    }, 1200);
  };

  // Real MediaRecorder Voice Note State & Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const playbackAudioObjRef = useRef<HTMLAudioElement | null>(null);

  // Simulated recording
  const startRecordingVoiceNote = async () => {
    setIsRecordingVoice(true);
    setVoiceSeconds(0);
    voiceTimerRef.current = setInterval(() => {
      setVoiceSeconds(prev => prev + 1);
    }, 1000);

    // Live speech-to-text transcription initialization
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      try {
        const rec = new SpeechRecognitionAPI();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        
        rec.onresult = (event: any) => {
          let chunk = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              chunk += event.results[i][0].transcript;
            }
          }
          if (chunk) {
            setCommentInput(prev => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${chunk}` : chunk;
            });
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (err) {
        console.warn("SpeechRecognition start failed:", err);
        simulateLiveTranscriptionFallback();
      }
    } else {
      simulateLiveTranscriptionFallback();
    }

    // Actual MediaRecorder Start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn("Could not acquire microphone for MediaRecorder (Sandbox limits or permission denied).", err);
    }
  };

  const stopAndSendVoiceNote = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
    }
    if (typingSimTimerRef.current) {
      clearInterval(typingSimTimerRef.current);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    
    let audioUrl = "";
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioUrl = URL.createObjectURL(audioBlob);
        
        const finalSecs = voiceSeconds > 0 ? voiceSeconds : 3;
        handleSendMessage(undefined, commentInput ? commentInput : "Voice Message", { is_voice: true, secs: finalSecs, audio_url: audioUrl });
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    } else {
      const finalSecs = voiceSeconds > 0 ? voiceSeconds : 3;
      handleSendMessage(undefined, commentInput || "Voice Message (Simulated)", { is_voice: true, secs: finalSecs });
    }

    setIsRecordingVoice(false);
    setVoiceSeconds(0);
  };

  const cancelVoiceNote = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
    }
    if (typingSimTimerRef.current) {
      clearInterval(typingSimTimerRef.current);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null; // discard
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecordingVoice(false);
    setVoiceSeconds(0);
    setCommentInput(""); // discard partial dictation
  };

  // Active voice player progress simulator
  const handlePlayVoice = (id: string, duration: number, audioUrl?: string) => {
    if (playingVoiceId === id) {
      // pause
      clearInterval(playbackTimerRef.current);
      setPlayingVoiceId(null);
      if (playbackAudioObjRef.current) {
        playbackAudioObjRef.current.pause();
      }
      return;
    }

    if (playbackAudioObjRef.current) {
      playbackAudioObjRef.current.pause();
      playbackAudioObjRef.current = null;
    }

    clearInterval(playbackTimerRef.current);
    setPlayingVoiceId(id);
    setPlayingVoiceProg(0);

    if (audioUrl) {
      const audioObj = new Audio(audioUrl);
      playbackAudioObjRef.current = audioObj;
      audioObj.onended = () => {
        setPlayingVoiceId(null);
        setPlayingVoiceProg(100);
        clearInterval(playbackTimerRef.current);
      };
      audioObj.ontimeupdate = () => {
        if (!isNaN(audioObj.duration) && audioObj.duration > 0) {
          setPlayingVoiceProg((audioObj.currentTime / audioObj.duration) * 100);
        }
      };
      audioObj.play().catch(console.error);
    } else {
      let progress = 0;
      const intervalTicks = 100; // tick every 100ms
      const totalTicks = (duration * 1000) / intervalTicks;

      playbackTimerRef.current = setInterval(() => {
        progress += (100 / totalTicks);
        if (progress >= 100) {
          clearInterval(playbackTimerRef.current);
          setPlayingVoiceId(null);
          setPlayingVoiceProg(0);
        } else {
          setPlayingVoiceProg(progress);
        }
      }, intervalTicks);
    }
  };

  // Layout save helper
  const savePanelSizesToPersistence = (sizes: Record<string, number>) => {
    setPanelLayouts(sizes);
    localStorage.setItem("dcms-chat-panel-layout-map-v2", JSON.stringify(sizes));
  };

  // Reset widths action
  const resetLayoutToDefaults = () => {
    localStorage.removeItem("dcms-chat-panel-layout-map-v2");
    setPanelLayouts({
      "channels-panel": 25,
      "chat-panel": 60,
      "users-panel": 15
    });
    setPanelKey(prev => prev + 1);
  };

  // Sub-filtering & lists
  const visibleRooms = rooms.filter(r => {
    const notDeleted = !r.deleted_by_user || !r.deleted_by_user.includes(currentAdminId);
    const matchesSearch = r.name.toLowerCase().includes(globalSearch.toLowerCase().trim());
    return notDeleted && matchesSearch;
  });

  // Split active / archived
  const activeRoomsList = visibleRooms.filter(r => !r.is_archived);
  const archivedRoomsList = visibleRooms.filter(r => r.is_archived);

  const sortedRooms = [...activeRoomsList].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return a.name.localeCompare(b.name);
  });

  const activeChannelObj = rooms.find(c => c.id === activeRoomId);

  // Search filter query inside messages stream + Delete For Me filter
  const filteredChatMessages = messages
    .filter(m => !deletedForMeIds.includes(m.id))
    .filter(m => !(m.deleted_for && m.deleted_for.includes(currentAdminId)))
    .filter(m => searchQuery.trim() === "" || m.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const pinnedMessagesInRoom = messages.filter(m => m.is_pinned);

  // Highlight mentions elegantly
  const renderMessageTextWithMentionsHighlight = (text: string) => {
    if (!text) return "";
    const words = text.split(/(\s+)/);
    const mKeywords = ["@arun", "@priya", "@kavitha", "@kiki", "@testadmin"];

    return words.map((word, idx) => {
      const lower = word.toLowerCase();
      // Check if word contains any mention tags
      const match = mKeywords.find(k => lower.includes(k));
      if (match) {
        return (
          <span
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200/20 inline-block font-sans text-[11px]"
          >
            {word}
          </span>
         );
      }
      return word;
    });
  };

  // Helper Custom drag-handle
  const CustomResizeHandle = () => {
    return (
      <Separator className="group w-1.5 min-w-1.5 relative flex items-center justify-center bg-slate-100 hover:bg-indigo-500 dark:bg-[#111A2E] dark:hover:bg-indigo-600 transition-all duration-150 cursor-col-resize self-stretch select-none">
        <div className="absolute top-1/2 -translate-y-1/2 w-[3px] h-8 bg-slate-300 dark:bg-slate-700 rounded-full opacity-60 group-hover:opacity-100 group-active:bg-indigo-300 transition-all" />
      </Separator>
    );
  };

  // MentionSuggestions component
  const mentionSuggestionsList = teammates.filter(t =>
    t.name.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="w-full h-[calc(100vh-130px)] lg:h-[calc(100vh-150px)] min-h-[550px] flex flex-col justify-start overflow-hidden bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
      
      {/* RECENT CALL LOG DETAILS MODAL */}
      {selectedCallDetail && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-505/10 via-transparent to-transparent rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedCallDetail.type === "video" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {selectedCallDetail.type === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">Bridge Diagnostics Log</h3>
                  <p className="text-[10px] text-slate-405 font-mono">ID: {selectedCallDetail.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCallDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Info */}
            <div className="space-y-4 text-left">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 font-bold">Session Name / Task</span>
                <p className="text-sm font-extrabold text-white tracking-tight mt-0.5">{selectedCallDetail.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3">
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-405 block">Session Duration</span>
                  <span className="text-xs font-mono font-bold text-indigo-300">{selectedCallDetail.duration}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-405 block">Connected At</span>
                  <span className="text-xs font-mono font-bold text-teal-300">{selectedCallDetail.timestamp}</span>
                </div>
              </div>

              {/* Participants */}
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 font-bold block mb-2">Connected Huddle Members ({selectedCallDetail.participants.length})</span>
                <div className="flex flex-wrap gap-2 animate-fade-in text-white">
                  {selectedCallDetail.participants.map((pname) => {
                    const mate = teammates.find(t => t.name === pname);
                    return (
                      <div key={pname} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-xs shrink-0">{mate?.avatar || "👤"}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white leading-none whitespace-nowrap">{pname}</p>
                          <p className="text-[8px] text-slate-400 truncate max-w-[85px] leading-tight mt-0.5">{mate?.role || "Team Operator"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diagnostics details */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 font-bold block">Network Health Quality Metrics</span>
                <div className="space-y-1 bg-slate-900/20 rounded-xl p-2.5 text-[10px] font-mono border border-slate-800/40">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connection Quality</span>
                    <span className="text-emerald-400 font-bold">Excellent (100% stable)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Session Host Nodes</span>
                    <span className="text-slate-300">AWS regional-ingress-3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Audio Jitter Buffer</span>
                    <span className="text-teal-400 font-bold">12ms avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Encryption Cypher</span>
                    <span className="text-indigo-400 font-bold font-sans">AES-256 (DTLS-SRTP)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedCallDetail(null);
                  setNewCallType(selectedCallDetail.type);
                  setNewCallMode(selectedCallDetail.participants.length > 2 ? "multi" : "direct");
                  const peerNames = selectedCallDetail.participants.filter(name => name !== currentAdminName);
                  const matchedIds = peerNames.map(name => {
                    const found = teammates.find(t => t.name === name);
                    return found ? found.id : null;
                  }).filter((id): id is string => id !== null);
                  setSelectedParticipantsForNewCall(matchedIds);
                  setIsNewCallDialogOpen(true);
                }}
                className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 border-none shadow-lg active:scale-95 duration-100"
              >
                {selectedCallDetail.type === "video" ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                Re-connect Huddle
              </button>
              <button
                type="button"
                onClick={() => setSelectedCallDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer border-none"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GORGEOUS NEW CALL PARTICIPANT SELECTION DIALOG */}
      {isNewCallDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-505/10 via-transparent to-transparent rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">New Call Bridge</h3>
                  <p className="text-[10px] text-slate-400">Select participants to connect instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewCallDialogOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Call Medium Selection */}
            <div className="space-y-1.5 text-left">
              <p className="text-[9px] uppercase font-mono text-slate-400 font-bold tracking-wider">1. Select Media Type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewCallType("voice")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    newCallType === "voice"
                      ? "border-indigo-500 bg-indigo-500/10 text-white shadow-xl font-bold"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-205 hover:bg-slate-900/80"
                  }`}
                >
                  <Phone className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span className="text-xs">Audio Huddle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewCallType("video")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    newCallType === "video"
                      ? "border-rose-500 bg-rose-500/10 text-white shadow-xl font-bold"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-205 hover:bg-slate-900/80"
                  }`}
                >
                  <Video className="w-5 h-5 text-rose-400 animate-pulse" />
                  <span className="text-xs">Video War Room</span>
                </button>
              </div>
            </div>

            {/* Step 2: Distribution Mode */}
            <div className="space-y-1.5 text-left">
              <p className="text-[9px] uppercase font-mono text-slate-400 font-bold tracking-wider">2. Distribution Scope</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "direct", label: "Single Person" },
                  { id: "multi", label: "Multiple People" },
                  { id: "group", label: "Entire Team" }
                ].map((modeOpt) => (
                  <button
                    key={modeOpt.id}
                    type="button"
                    onClick={() => {
                      setNewCallMode(modeOpt.id as any);
                      if (modeOpt.id === "group") {
                        setSelectedParticipantsForNewCall(teammates.filter(t => t.id !== "usr_kavitha").map(t => t.id));
                      } else {
                        setSelectedParticipantsForNewCall([]);
                      }
                    }}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-[10.5px] transition-all cursor-pointer ${
                      newCallMode === modeOpt.id
                        ? "border-indigo-500 bg-indigo-505/15 text-white font-bold"
                        : "border-slate-850 bg-[#0F172A] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{modeOpt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Participant Checkboxes/Selectors */}
            {newCallMode !== "group" && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] uppercase font-mono text-slate-400 font-bold tracking-wider">3. Select Contacts ({selectedParticipantsForNewCall.length})</p>
                  {newCallMode === "multi" && (
                    <button
                      type="button"
                      onClick={() => {
                        const allPeerIds = teammates.filter(t => t.id !== "usr_kavitha").map(t => t.id);
                        setSelectedParticipantsForNewCall(
                          selectedParticipantsForNewCall.length === allPeerIds.length ? [] : allPeerIds
                        );
                      }}
                      className="text-[9px] hover:text-indigo-400 font-bold transition-all text-slate-400 hover:underline"
                    >
                      Toggle All
                    </button>
                  )}
                </div>
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-80s">
                  {teammates.filter(t => t.id !== "usr_kavitha").map(t => {
                    const isSelected = selectedParticipantsForNewCall.includes(t.id);
                    const isUserBusy = t.status === "in_call";
                    const isUserAway = t.status === "away";
                    const isUserOffline = t.status === "offline";

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (newCallMode === "direct") {
                            setSelectedParticipantsForNewCall([t.id]);
                          } else {
                            setSelectedParticipantsForNewCall(prev => 
                              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            );
                          }
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "border-indigo-500/70 bg-indigo-500/5"
                            : "border-slate-850 bg-slate-900/20 hover:border-slate-800 hover:bg-slate-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm select-none">
                              {t.avatar}
                            </span>
                            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-slate-900 ${
                              isUserBusy ? "bg-rose-500 animate-pulse" : isUserAway ? "bg-amber-400" : isUserOffline ? "bg-slate-500" : "bg-emerald-500"
                            }`} />
                          </div>
                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">{t.name}</span>
                              {isUserBusy && (
                                <span className="text-[7.5px] bg-rose-500/15 text-rose-400 font-extrabold px-1 rounded uppercase tracking-wider">Busy</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block leading-none mt-0.5">{t.role}</span>
                          </div>
                        </div>

                        {/* Interactive toggle indicators */}
                        {newCallMode === "direct" ? (
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-700"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3.5px]" />}
                          </div>
                        ) : (
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-705"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3.5px]" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-slate-800 hover:bg-slate-900 h-9 text-xs font-bold text-slate-300"
                onClick={() => setIsNewCallDialogOpen(false)}
              >
                Go Back
              </Button>
              <Button
                disabled={newCallMode !== "group" && selectedParticipantsForNewCall.length === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-extrabold text-white h-9 cursor-pointer"
                onClick={() => {
                  startCall(newCallType, newCallMode, selectedParticipantsForNewCall);
                  setIsNewCallDialogOpen(false);
                }}
              >
                Dial Out Call
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset view control rail */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070C15]/40 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] uppercase font-bold rounded-md">
            Custom Panels Enabled
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Drag the vertical lines to adjust widths exactly like VS Code or Discord. Sizes persist automatically.
          </span>
        </div>
        <Button
          onClick={resetLayoutToDefaults}
          variant="outline"
          size="xs"
          className="h-7 text-[10.5px] font-bold text-slate-700 border-slate-200 dark:text-slate-200 dark:border-slate-800"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset Layout
        </Button>
      </div>

      {/* MOBILE TAB CONTROLS */}
      {isMobile && (
        <div className="grid grid-cols-3 gap-1 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#070C15] p-2 select-none">
          <button
            onClick={() => setMobileActiveTab("channels")}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              mobileActiveTab === "channels" ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => setMobileActiveTab("chat")}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              mobileActiveTab === "chat" ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
            }`}
          >
            Active Chat
          </button>
          <button
            onClick={() => setMobileActiveTab("users")}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              mobileActiveTab === "users" ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
            }`}
          >
            Teammates
          </button>
        </div>
      )}

      {/* DESKTOP RESIZABLE PANELS LAYOUT */}
      {!isMobile && (
        <div className="flex-1 w-full bg-white dark:bg-[#0B1222] h-full max-h-full overflow-hidden flex flex-col relative text-left select-text">
          {/* FLOATING SIDEBAR RESTORE ARROW BUTTON */}
          {(!isChannelsSidebarOpen || isChannelsSidebarCollapsed) && (
            <button
              onClick={() => {
                if (!isChannelsSidebarOpen) {
                  setIsChannelsSidebarOpen(true);
                }
                if (isChannelsSidebarCollapsed) {
                  channelsPanelRef.current?.expand();
                }
                setIsChannelsSidebarCollapsed(false);
              }}
              className="absolute left-[22px] top-[21px] z-50 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 duration-150 border border-indigo-500/30"
              title="Expand Channels Sidebar"
            >
              <ChevronRight className="w-4 h-4 animate-pulse" />
            </button>
          )}

          <Group
            key={panelKey}
            orientation="horizontal"
            onLayoutChanged={savePanelSizesToPersistence}
            defaultLayout={panelLayouts}
          >
            
            {/* PANEL 2: CHANNELS LIST */}
            {isChannelsSidebarOpen && (
              sidebarCollapsed ? (
                <div className="w-[72px] min-w-[72px] max-w-[72px] bg-slate-50/25 dark:bg-[#070C15]/20 border-r border-[#E2E8F0] dark:border-[#1E293B] h-full flex flex-col items-center py-3 select-none shrink-0">
                  <button
                    onClick={() => {
                      setSidebarCollapsed(false);
                      localStorage.setItem("dcms_chat_channels_collapsed", "false");
                    }}
                    className="p-2 mb-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-200 rounded-xl cursor-pointer transition-colors"
                    title="Expand Sidebar"
                  >
                    <Menu className="w-[18px] h-[18px]" />
                  </button>
                  <div className="flex-1 w-full overflow-y-auto space-y-3 px-2 flex flex-col items-center">
                    {sortedRooms.map(r => {
                      const isActive = r.id === activeRoomId;
                      const hasUnread = unreadCounts[r.id] || 0;
                      const initials = r.name.replace(/[^A-Za-z0-9]/g, "").substring(0, 2).toUpperCase() || "#";
                      return (
                        <button
                          key={r.id}
                          onClick={() => setActiveRoomId(r.id)}
                          className={`w-10 h-10 rounded-xl font-black text-[10px] flex items-center justify-center relative cursor-pointer transition-all duration-75 hover:scale-105 active:scale-95 ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-md scale-105"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                          }`}
                          title={r.name}
                        >
                          {initials}
                          {hasUnread > 0 && !isActive && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-[#070C15]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Panel
                  id="channels-panel"
                  minSize={12}
                  maxSize={30}
                  collapsible={true}
                  collapsedSize={0}
                  onResize={(panelSize) => {
                    const collapsed = panelSize.asPercentage === 0;
                    setIsChannelsSidebarCollapsed(prev => {
                      if (prev !== collapsed) {
                        return collapsed;
                      }
                      return prev;
                    });
                  }}
                  panelRef={channelsPanelRef}
                  className="flex flex-col bg-slate-50/25 dark:bg-[#070C15]/20 border-r border-[#E2E8F0] dark:border-[#1E293B] h-full max-h-full select-none"
                >
                  
                  {/* Header search bar */}
                  <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSidebarCollapsed(true);
                        localStorage.setItem("dcms_chat_channels_collapsed", "true");
                      }}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer transition-colors"
                      title="Collapse Panel (VS Code style)"
                    >
                      <Menu className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-405 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        placeholder="Search channels..."
                        value={globalSearch}
                        onChange={e => setGlobalSearch(e.target.value)}
                        className="h-8 pl-8 text-[11px] bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    
                    {/* Active Channels List */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center px-1 mb-1">
                        <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-405 block">
                          Active Discussion boards
                        </span>
                        <button
                          onClick={() => setShowNewChatPanel(true)}
                          className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                          title="Create New Channel (+ New Chat)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {sortedRooms.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic block p-2">No matching active rooms</span>
                      ) : (
                        sortedRooms.map((r) => {
                          const isActive = r.id === activeRoomId;
                          const hasUnreadCount = unreadCounts[r.id] || 0;

                          return (
                            <div
                              key={r.id}
                              className={`group relative flex items-center justify-between rounded-xl transition-all ${
                                isActive
                                  ? "bg-indigo-600 text-white shadow-sm font-black"
                                  : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <button
                                onClick={() => setActiveRoomId(r.id)}
                                className="flex-1 min-width-0 text-left px-3 py-2 text-xs truncate flex items-center gap-1.5 cursor-pointer font-bold"
                              >
                                {r.is_pinned ? (
                                  <Pin className="w-3 h-3 text-indigo-300 shrink-0 rotate-45" />
                                ) : (
                                  <Hash className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                )}
                                <span className="truncate min-width-0 text-ellipsis">{r.name}</span>
                                
                                {/* Unread count badge */}
                                {hasUnreadCount > 0 && !isActive && (
                                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black bg-red-500 text-white rounded-full leading-none shrink-0">
                                    {hasUnreadCount}
                                  </span>
                                )}
                              </button>

                              {/* Quick action config dot settings */}
                              <div className="relative shrink-0 pr-1.5 select-none text-left">
                                <button
                                  onClick={() => setDropdownRoomId(dropdownRoomId === r.id ? null : r.id)}
                                  className={`h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity border-none pb-0.5 ${
                                    isActive ? "text-indigo-200 hover:bg-indigo-700" : "text-slate-405 hover:bg-slate-200 dark:hover:bg-slate-805"
                                  }`}
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {dropdownRoomId === r.id && (
                                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-bold py-1 text-[11px] text-slate-800 dark:text-slate-200">
                                    <button
                                      onClick={() => handleTogglePinChannel(r.id)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 border-none cursor-pointer flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                                    >
                                      <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                                      {r.is_pinned ? "Unpin Board" : "Pin Board to Top"}
                                    </button>
                                    
                                    <button
                                      onClick={() => handleToggleArchiveChannel(r.id)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 border-none cursor-pointer flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-purple-500" />
                                      Archive Discussion
                                    </button>

                                    <button
                                      onClick={() => {
                                        const newName = prompt(`Enter new name for #${r.name}:`, r.name);
                                        if (newName) handleRenameChannel(r.id, newName);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 border-none cursor-pointer flex items-center gap-1.5 text-slate-705 dark:text-slate-200"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-blue-500" />
                                      Rename Channel
                                    </button>
                                    
                                    <hr className="border-slate-100 dark:border-slate-800 my-1" />
                                    
                                    <button
                                      onClick={() => setDeleteConfRoom(r)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-905 border-none cursor-pointer text-red-500 flex items-center gap-1.5"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                      Delete Board Room
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Recent Calls History Section */}
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40">
                      <div className="flex justify-between items-center px-1 mb-1">
                        <button
                          type="button"
                          onClick={() => setIsRecentCallsCollapsed(!isRecentCallsCollapsed)}
                          className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <span>{isRecentCallsCollapsed ? "▶" : "▼"} Recent Bridge Calls ({recentCalls.length})</span>
                        </button>
                        {recentCalls.length > 0 && !isRecentCallsCollapsed && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Clear call history logs?")) {
                                setRecentCalls([]);
                                localStorage.setItem("dcms_recent_calls_v1", JSON.stringify([]));
                              }
                            }}
                            className="text-[9px] text-slate-400 hover:text-red-500 hover:underline border-none bg-transparent cursor-pointer font-bold"
                            title="Clear History Log"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {!isRecentCallsCollapsed && (
                        <div className="space-y-1.5 animate-fade-in max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                          {isFetchingRecentCalls ? (
                            // Glowing pulse skeletons
                            <div className="space-y-1.5 p-1">
                              {[1, 2].map((i) => (
                                <div key={i} className="flex gap-2 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 animate-pulse border border-transparent">
                                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                                  <div className="flex-1 space-y-1.5">
                                    <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
                                    <div className="h-2 bg-slate-200 dark:bg-slate-855 rounded w-3/5" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : recentCalls.length === 0 ? (
                            <span className="text-[10.5px] text-slate-450 italic p-3 block text-center bg-slate-100/10 dark:bg-slate-900/5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 select-none">
                              No recent bridge calls logged
                            </span>
                          ) : (
                            recentCalls.map((call) => {
                              const isVideo = call.type === "video";
                              return (
                                <div
                                  key={call.id}
                                  onClick={() => setSelectedCallDetail(call)}
                                  className="group flex items-center justify-between p-2 rounded-xl bg-white/40 dark:bg-slate-900/15 hover:bg-slate-100/70 dark:hover:bg-slate-900/40 transition-all border border-slate-200/40 dark:border-slate-800/20 hover:border-indigo-500/20 dark:hover:border-indigo-500/20 cursor-pointer"
                                  title="Click to view full call metrics & records"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {/* Type badge icon */}
                                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                                      isVideo 
                                        ? "bg-rose-500/10 text-rose-400" 
                                        : "bg-emerald-500/10 text-emerald-400"
                                    }`}>
                                      {isVideo ? (
                                        <Video className="w-3.5 h-3.5" />
                                      ) : (
                                        <Phone className="w-3.5 h-3.5" />
                                      )}
                                    </div>

                                    {/* Data contents */}
                                    <div className="text-left min-w-0 flex-1">
                                      <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 block truncate group-hover:text-indigo-400 duration-100 leading-tight">
                                        {call.title}
                                      </span>
                                      <span className="text-[9.5px] text-slate-400 truncate block mt-0.5 leading-none">
                                        👥 {call.participants.join(", ")}
                                      </span>
                                      <span className="text-[8.5px] font-mono font-medium text-slate-450 dark:text-slate-500 block mt-1 leading-none">
                                        ⏱ {call.duration} • {call.timestamp}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick dial re-caller option on hover */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewCallType(call.type);
                                      setNewCallMode(call.participants.length > 2 ? "multi" : "direct");
                                      const peerNames = call.participants.filter(name => name !== currentAdminName);
                                      const matchedIds = peerNames.map(name => {
                                        const found = teammates.find(t => t.name === name);
                                        return found ? found.id : null;
                                      }).filter((id): id is string => id !== null);
                                      setSelectedParticipantsForNewCall(matchedIds);
                                      setIsNewCallDialogOpen(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-650 hover:text-white cursor-pointer transition-all border-none scale-90"
                                    title="Start new bridge huddle with this team"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Archived Channels Section Dropdown */}
                    {archivedRoomsList.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/40">
                        <button
                          onClick={() => setIsArchivedSectionExpanded(!isArchivedSectionExpanded)}
                          className="w-full flex justify-between items-center px-1 py-1 text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <span>Archived Boards ({archivedRoomsList.length})</span>
                          <span>{isArchivedSectionExpanded ? "▼" : "▶"}</span>
                        </button>

                        {isArchivedSectionExpanded && (
                          <div className="space-y-0.5 pl-1 animate-fade-in">
                            {archivedRoomsList.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between rounded-xl px-2 py-1.5 text-[11px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/45 italic group"
                              >
                                <span className="truncate flex items-center gap-1 pr-1.5 select-all">
                                  <Archive className="w-3 h-3 opacity-60 shrink-0" />
                                  <span>{r.name}</span>
                                </span>

                                <button
                                  onClick={() => handleToggleArchiveChannel(r.id)}
                                  className="text-[9.5px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-650 rounded-lg font-bold border-none cursor-pointer text-slate-500 font-sans opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Restore to Active Board"
                                >
                                  Restore
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Logged in User profile footer and status selector */}
                  <div className="mt-auto p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-950/20 flex items-center justify-between gap-1.5 shrink-0 select-none text-left">
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <div className="relative shrink-0">
                        <span className="text-xl p-1 bg-indigo-500/10 rounded-lg block">👩‍💼</span>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-[#070C15] ${
                          currentUserStatus === "online"
                            ? "bg-emerald-500 animate-pulse"
                            : currentUserStatus === "away"
                              ? "bg-amber-400"
                              : "bg-slate-500"
                        }`} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[11px] font-black leading-none truncate text-slate-850 dark:text-slate-100">
                          {currentAdminName} (You)
                        </p>
                        <p className="text-[9px] text-[#818CF8] font-bold uppercase mt-1 leading-none tracking-widest truncate">
                          {currentUserStatus === "online" ? "Available" : currentUserStatus === "away" ? "Away" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className="p-1 px-1.5 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 rounded-lg text-slate-555 dark:text-slate-300 hover:text-[#818CF8] transition-colors border-none cursor-pointer flex items-center gap-0.5 outline-none font-sans"
                        title="Change my active status"
                      >
                        <span className="text-[10px] font-bold">Status</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {showStatusMenu && (
                        <div className="absolute bottom-full right-0 mb-1 w-32 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5 animate-fade-in text-left">
                          <button
                            onClick={() => {
                              setCurrentUserStatus("online");
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Available
                          </button>
                          <button
                            onClick={() => {
                              setCurrentUserStatus("away");
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Away
                          </button>
                          <button
                            onClick={() => {
                              setCurrentUserStatus("offline");
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            Offline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </Panel>
              )
            )}

            {isChannelsSidebarOpen && !sidebarCollapsed && <CustomResizeHandle />}

            {/* PANEL 3: CHAT WINDOW IN THE MIDDLE */}
            <Panel
              id="chat-panel"
              minSize={35}
              maxSize={75}
              className="flex flex-col h-full bg-slate-50/10 dark:bg-[#070c15]/5 relative min-w-[360px] lg:min-w-[600px] xl:min-w-[700px] overflow-hidden"
            >
              
              {/* Pinned Messages Header notification banner */}
              {pinnedMessagesInRoom.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-950/20 px-3 py-1.5 border-b border-amber-100 dark:border-amber-950/40 flex justify-between items-center text-xs text-slate-700 dark:text-amber-300 z-15 shrink-0 animate-fade-in select-none">
                  <div className="flex items-center gap-2 truncate min-width-0">
                    <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0 rotate-45" />
                    <span className="font-bold underline text-[10.5px]">Pinned Rule:</span>
                    <p className="truncate italic font-medium text-[10.5px]">
                      "{pinnedMessagesInRoom[pinnedMessagesInRoom.length - 1].text}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePinMessage(pinnedMessagesInRoom[pinnedMessagesInRoom.length - 1].id)}
                    className="p-1 px-2.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg font-black text-[9.5px] cursor-pointer text-amber-700 dark:text-amber-400"
                  >
                    Dismiss Pin
                  </button>
                </div>
              )}

              {/* Chat Title header details */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1222] shrink-0 z-10 select-none min-width-0">
                <div className="flex items-center gap-3 overflow-hidden text-left min-width-0">
                  {/* Space reservation / Toggle Sidebar Button */}
                  {(!isChannelsSidebarOpen || isChannelsSidebarCollapsed) ? (
                    <div className="w-7 h-7 shrink-0" />
                  ) : (
                    <button
                      onClick={() => {
                        setIsChannelsSidebarOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 cursor-pointer transition-all flex items-center justify-center shrink-0"
                      title="Hide Channels Sidebar"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  <div className="space-y-0.5 overflow-hidden text-left min-width-0">
                    <div className="flex items-center gap-1.5 min-width-0">
                      <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm truncate uppercase tracking-normal min-width-0">
                        {activeChannelObj?.name || "operations-stream"}
                        {activeChannelObj?.is_archived && (
                          <span className="ml-2 px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider bg-purple-100 dark:bg-[#2C1A3F] text-purple-600 dark:text-purple-400 rounded-md font-black border border-purple-200/50">
                            Archived / Read-only
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate max-w-sm">
                      {activeChannelObj?.description || "Join the support chat board to coordinate with triage staff"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 select-none">
                  {/* Real-time search in conversation input bar */}
                  <div className="relative hidden lg:block">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-[11px] w-44 bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-200"
                    />
                  </div>
                  
                  {/* Select Mode Toggle */}
                  <button
                    onClick={() => {
                      setIsSelectModeActive(!isSelectModeActive);
                      setSelectedMessageIds([]); // reset when togling
                    }}
                    className={`cursor-pointer p-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5 border ${
                      isSelectModeActive
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500"
                    }`}
                    title="Batch Message Selection Mode"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isSelectModeActive ? "Cancel Select" : "Batch Select"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewCallType("voice");
                      setNewCallMode("multi");
                      setSelectedParticipantsForNewCall([]);
                      setIsNewCallDialogOpen(true);
                    }}
                    className={`cursor-pointer p-1.5 rounded-lg text-xs transition-colors ${activeCall && activeCall.type === "voice" ? "bg-emerald-600 text-white animate-pulse" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-105 dark:hover:bg-slate-900"}`}
                    title="Start Live Voice Huddle / Audio Bridge"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setNewCallType("video");
                      setNewCallMode("multi");
                      setSelectedParticipantsForNewCall([]);
                      setIsNewCallDialogOpen(true);
                    }}
                    className={`cursor-pointer p-1.5 rounded-lg text-xs transition-colors ${activeCall && activeCall.type === "video" ? "bg-indigo-600 text-white animate-pulse" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-105 dark:hover:bg-slate-900"}`}
                    title="Start Live Video War Room"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsSelectModeActive(!isSelectModeActive);
                      setSelectedMessageIds([]);
                    }}
                    className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      isSelectModeActive
                        ? "bg-amber-100 dark:bg-amber-950 text-amber-650 dark:text-amber-400 font-extrabold"
                        : "text-slate-400 hover:text-indigo-505 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                    title="Toggle Message Multi-Selection Mode"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const next = !showMembersPanel;
                      setShowMembersPanel(next);
                      localStorage.setItem("dcms_chat_show_members", String(next));
                    }}
                    className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      showMembersPanel
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 font-extrabold"
                        : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                    title="Toggle Teammate Presence Board"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message list Container with highly interactive Drag-and-Drop overlay */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 h-full p-4 space-y-4 flex flex-col scrollbar-thin relative min-width-0 justify-start"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                
                {/* Drag over visual overlay border */}
                {isDraggingOverChat && (
                  <div className="absolute inset-2 border-2 border-dashed border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/90 backdrop-blur-sm rounded-2xl z-50 flex flex-col items-center justify-center text-center animate-fade-in pointer-events-none select-none">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full text-indigo-600 dark:text-indigo-400 mb-2">
                      <Paperclip className="w-8 h-8 animate-bounce" />
                    </div>
                    <h3 className="text-sm font-black text-indigo-905 dark:text-indigo-200">
                      Drop files to attach to chat
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Release your files here to instantly upload and share with the support team.
                    </p>
                  </div>
                )}

                {filteredChatMessages.length === 0 ? (
                  <div className="my-auto flex flex-col items-center justify-center p-8 text-center text-slate-400 select-none">
                    <span className="text-4xl text-slate-350">💬</span>
                    <p className="text-xs font-bold mt-2">No messages match your search criteria.</p>
                    <p className="text-[10px] text-slate-401 mt-1">
                      Be the target-setter and start the support thread in #{activeChannelObj?.name}!
                    </p>
                  </div>
                ) : (
                  filteredChatMessages.map((m) => {
                    const isSelf = m.sender_id === currentAdminId;
                    const isSelected = selectedMessageIds.includes(m.id);
                    
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 items-center w-full min-w-0 ${isSelf ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Batch Selection Checkbox */}
                        {isSelectModeActive && (
                          <div className={`shrink-0 flex items-center justify-center p-2 mt-4`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMessageIds(prev => [...prev, m.id]);
                                } else {
                                  setSelectedMessageIds(prev => prev.filter(id => id !== m.id));
                                }
                              }}
                              className="w-4 h-4 cursor-pointer text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] lg:max-w-[700px] min-w-[120px] flex flex-col space-y-1 ${isSelf ? "self-end items-end" : "self-start items-start"}`}
                        >
                          {/* Sender details */}
                          <div className={`text-[10px] text-slate-400 font-bold px-1.5 flex items-center gap-1.5 select-none leading-none ${isSelf ? "justify-end" : "justify-start"} w-full`}>
                            {m.sender_name}
                            <span className="text-[9px] font-medium text-slate-400 leading-none">{m.time}</span>
                            {m.is_edited && <span className="text-[9px] text-indigo-400 italic font-normal leading-none">(edited)</span>}
                            {m.is_pinned && <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 leading-none">📌 Pinned</span>}
                          </div>

                          {/* Text bubble bubble */}
                          <div className={`p-3 rounded-2xl border text-xs text-left relative group leading-relaxed font-sans min-w-0 break-words ${
                            isSelf
                              ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none"
                              : "bg-white dark:bg-[#111A2E] border-slate-200 dark:border-slate-800 text-black dark:text-white rounded-tl-none shadow-xs"
                          } ${isSelected ? "ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900" : ""}`}>
                            
                            {/* Reply quotation preview nested block */}
                          {m.reply_to && (
                            <div className={`p-2 rounded-xl mb-2 border text-[10px] leading-tight flex items-start gap-1 ${
                              isSelf
                                ? "bg-indigo-700/60 border-indigo-500/50 text-indigo-100"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-black/80 dark:text-white/80"
                            }`}>
                              <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                              <div className="truncate min-width-0">
                                <strong className="block text-[9.5px] font-black uppercase tracking-wide">
                                  {m.reply_to.sender_name}
                                </strong>
                                <span className="italic block mt-0.5 truncate text-[10.5px]">
                                  {m.reply_to.text}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Image and files sharing attachment visual */}
                          {m.attachments && m.attachments.map((att, idx) => (
                            <div key={idx} className="mb-2 bg-slate-900/10 dark:bg-slate-950/20 p-2 rounded-xl border border-white/10 flex items-center gap-2 max-w-[260px] overflow-hidden">
                              {att.type === 'image' ? (
                                <div className="relative h-12 w-12 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                                  <img src={att.url} alt={att.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <span className="text-lg bg-slate-200 dark:bg-slate-800 p-1.5 rounded-lg">📄</span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold truncate text-slate-750 dark:text-slate-100">
                                  {att.name}
                                </p>
                                <span className="text-[9px] opacity-70 block">
                                  Attached Resource
                                </span>
                              </div>
                            </div>
                          ))}

                           {/* Played/Recorded Voice Notes simulated details */}
                           {m.is_voice_note && (
                             <div className="mb-2 p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-900/45 border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3.5 w-68 shadow-sm">
                               {/* circular Play / Pause button */}
                               <button
                                 type="button"
                                 onClick={() => handlePlayVoice(m.id, m.voice_duration || 5, m.audio_url)}
                                 className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 border-none cursor-pointer hover:scale-105 duration-150 shadow-sm"
                               >
                                 {playingVoiceId === m.id ? (
                                   <Pause className="w-4 h-4 fill-current text-white" />
                                 ) : (
                                   <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                                 )}
                               </button>
 
                               <div className="flex-1 min-w-0 space-y-1 text-left">
                                 {/* Waveform preview player with dynamic active played indicator */}
                                 <div className="h-5 flex items-center gap-[2.5px] py-1 select-none">
                                   {[10, 18, 12, 22, 14, 8, 16, 24, 14, 18, 10, 15, 20, 12, 8, 16, 22, 14, 18, 10, 14, 20, 12, 16, 8].map((barHeight, bIdx) => {
                                     const percentPos = (bIdx / 25) * 100;
                                     const isPlayed = playingVoiceId === m.id && playingVoiceProg >= percentPos;
                                     return (
                                       <div
                                         key={bIdx}
                                         style={{ height: `${barHeight}px` }}
                                         className={`w-[2.5px] rounded-full transition-colors duration-150 cursor-pointer hover:bg-indigo-400 ${
                                           isPlayed
                                             ? "bg-indigo-600 dark:bg-indigo-400"
                                             : "bg-slate-300 dark:bg-slate-700"
                                         }`}
                                         onClick={() => {
                                           // Set seek percent position!
                                           if (playingVoiceId === m.id) {
                                             setPlayingVoiceProg(percentPos);
                                           }
                                         }}
                                       />
                                     );
                                   })}
                                 </div>
 
                                 <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
                                   <div className="flex items-center gap-1">
                                     <Mic className="w-3 h-3 text-indigo-500 animate-pulse" />
                                     <span>Voice memo</span>
                                   </div>
                                   <span className="text-indigo-600 dark:text-indigo-400">
                                     {playingVoiceId === m.id
                                       ? `${Math.round((playingVoiceProg / 100) * (m.voice_duration || 5))}s`
                                       : `${m.voice_duration || 5}s`}
                                   </span>
                                 </div>
                               </div>
                             </div>
                           )}

                          {/* Message body text */}
                           {/* Rich Call Summary details Card */}
                           {m.call_summary && (
                             <div className="mb-3 p-3.5 rounded-2xl bg-slate-905 border border-slate-800 shadow-xl max-w-sm flex flex-col gap-2.5 text-left text-xs animate-fade-in relative overflow-hidden text-white bg-slate-900">
                               <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full pointer-events-none" />
                               <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                 <div className="flex items-center gap-1.5 font-extrabold text-white text-[11px] tracking-wide uppercase">
                                   {m.call_summary.type === 'video' ? (
                                     <Video className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                   ) : (
                                     <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                   )}
                                   <span>{m.call_summary.type === 'video' ? '🎥 Video Meeting' : '📞 Team Call'} Summary</span>
                                 </div>
                                 <span className="text-[9.5px] bg-slate-850 text-slate-350 font-bold px-2 py-0.5 rounded-full">
                                   {m.call_summary.duration}
                                 </span>
                               </div>
                               
                               <div className="space-y-1">
                                 <p className="text-[9px] text-slate-400 font-bold uppercase font-sans tracking-wide">Participants:</p>
                                 <div className="flex flex-wrap gap-1">
                                   {m.call_summary.participants.map((person, idx) => (
                                     <span key={idx} className="bg-slate-850 text-slate-200 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border border-slate-800/60">
                                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-550" />
                                       {person}
                                     </span>
                                   ))}
                                 </div>
                               </div>

                               <button
                                 type="button"
                                 onClick={() => {
                                   setExpandedCallDetailsMessageIds(prev => 
                                     prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                                   );
                                 }}
                                 className="self-start text-[10.5px] text-indigo-400 hover:text-indigo-300 transition-colors font-bold underline bg-transparent border-none cursor-pointer flex items-center gap-1 mt-0.5"
                               >
                                 {expandedCallDetailsMessageIds.includes(m.id) ? 'Hide Call Details' : 'View Call Details'}
                               </button>

                               {expandedCallDetailsMessageIds.includes(m.id) && (
                                 <div className="mt-1.5 pt-2 border-t border-slate-800 text-[10.5px] space-y-1.5 text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-850 animate-fade-in text-left">
                                   <div className="flex justify-between items-center text-[10px]">
                                     <span className="text-slate-450 uppercase font-mono">Screen Share:</span>
                                     <span className="font-extrabold text-white">{m.call_summary.screenShareUsed ? 'Used' : 'Not Used'}</span>
                                   </div>
                                   <div className="flex justify-between items-center text-[10px]">
                                     <span className="text-slate-450 uppercase font-mono">Recording Mode:</span>
                                     <span className="font-extrabold text-white text-emerald-500">Not Enabled</span>
                                   </div>
                                   {m.call_summary.ticketNumber && (
                                     <div className="p-1.5 bg-slate-900 rounded-lg space-y-0.5 border border-slate-800 border-dashed">
                                       <div className="flex items-center gap-1 text-[9.5px]">
                                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                         <span className="text-slate-400 capitalize font-bold">Related Ticket:</span>
                                         <span className="text-indigo-400 font-extrabold">{m.call_summary.ticketNumber}</span>
                                       </div>
                                       <p className="text-[9.5px] italic text-slate-300 truncate">{m.call_summary.ticketTitle}</p>
                                     </div>
                                   )}
                                   <div className="text-[9.5px] leading-relaxed text-slate-400 border-l-2 border-indigo-500 pl-1.5 mt-1.5">
                                     <p className="font-bold tracking-wide uppercase text-indigo-400 text-[8px]">Audit Notes:</p>
                                     <p>{m.call_summary.recordingNotes}</p>
                                   </div>
                                 </div>
                               )}
                             </div>
                           )}

                          {editingMessageId === m.id ? (
                            <div className="space-y-1.5 min-w-[240px]">
                              <Textarea
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="text-xs bg-slate-50 dark:bg-slate-950 text-black dark:text-white p-2 border-slate-300 dark:border-slate-800 h-16 rounded-lg font-medium"
                              />
                              <div className="flex gap-1.5 justify-end">
                                <Button size="xs" variant="outline" className={`h-6 text-[10px] ${isSelf ? "text-white border-white/30 hover:bg-white/10" : "text-black dark:text-white"}`} onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                <Button size="xs" className={`h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 border-none ${isSelf ? "text-white" : "text-black dark:text-white"}`} onClick={() => handleSaveEditMessage(m.id)}>Save</Button>
                              </div>
                            </div>
                          ) : m.text && (!m.call_summary || (!m.text.includes("Team Call Completed") && !m.text.includes("Ad-hoc Triage Huddle Notes") && m.text !== "Team Call Summary")) ? (
                            <p className={`whitespace-pre-wrap break-words pr-4 select-text font-medium leading-relaxed font-sans text-xs ${isSelf ? "text-white" : "text-black dark:text-white"}`}>
                              {renderMessageTextWithMentionsHighlight(m.text)}
                            </p>
                          ) : null}

                          {/* Reactions displays list */}
                          {m.reactions && Object.keys(m.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5 pt-1.5 border-t border-slate-100/10">
                              {Object.entries(m.reactions).map(([emoji, rectors]) => {
                                const list = rectors as string[];
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(m.id, emoji)}
                                    title={`Reacted by: ${list.join(', ')}`}
                                    className={`px-2 py-0.5 rounded-full text-[10px] border font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                      list.includes(currentAdminName)
                                        ? "bg-indigo-100/30 border-indigo-400 text-indigo-400"
                                        : "bg-slate-50/50 dark:bg-slate-800/40 border-transparent text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    <span>{list.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Read Receipts progress representation */}
                          {isSelf && (
                            <div className="absolute right-1.5 bottom-1 opacity-70">
                              {m.message_status === "read" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-400" title="Read (✓✓ Blue)" />
                              ) : m.message_status === "delivered" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-300" title="Delivered (✓✓ Gray)" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" title="Sent (✓ Gray)" />
                              )}
                            </div>
                          )}

                          {/* Visual Float actions modal buttons */}
                          {!activeChannelObj?.is_archived && (
                            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 duration-150 z-30 ${
                              isSelf ? "right-full mr-2" : "left-full ml-1"
                            }`}>
                              
                              {/* Quick Smile Quick Reaction Button on hover */}
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === m.id ? null : m.id)}
                                className="w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 rounded-lg flex items-center justify-center cursor-pointer shadow-xs border-none"
                                title="Add Quick Reaction"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>

                              {/* Three-Dot ⋮ message option trigger */}
                              <div className="relative">
                                <button
                                  onClick={() => setActiveMessageActionId(activeMessageActionId === m.id ? null : m.id)}
                                  className={`w-6 h-6 border rounded-lg flex items-center justify-center cursor-pointer shadow-xs ${
                                    activeMessageActionId === m.id
                                      ? "bg-indigo-100 dark:bg-indigo-950 border-indigo-400 text-indigo-650 dark:text-indigo-400"
                                      : "bg-white dark:bg-slate-800 border-slate-205 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-505"
                                  }`}
                                  title="Message Actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {activeMessageActionId === m.id && (
                                  <>
                                  <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setActiveMessageActionId(null); }} />
                                  <div className={`absolute bottom-full mb-1 w-44 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-bold py-1 text-[11px] text-left text-slate-800 dark:text-slate-200 ${
                                    isSelf ? "right-0" : "left-0"
                                  }`}>
                                    <div className="px-3 py-1 text-[9px] uppercase font-mono tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/10 mb-1">
                                      Message Options
                                    </div>

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        setReplyTarget(m);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <Reply className="w-3.5 h-3.5 text-indigo-500" />
                                      Reply Message
                                    </button>

                                    {isSelf && (
                                      <button
                                        onClick={() => {
                                          setActiveMessageActionId(null);
                                          setEditingMessageId(m.id);
                                          setEditInput(m.text);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                        Edit Text
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        handleCopyToClipboard(m.text);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      Copy Text
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        handleTogglePinMessage(m.id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <Pin className="w-3.5 h-3.5 text-amber-550 rotate-45" />
                                      {m.is_pinned ? "Unpin Message" : "Pin Message"}
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        setForwardDialogMsg(m);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
                                      Forward ...
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        setShowEmojiPicker(m.id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <Smile className="w-3.5 h-3.5 text-amber-500" />
                                      Add Reaction
                                    </button>

                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        handleDeleteForMe(m.id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 border-none cursor-pointer bg-transparent"
                                      title="Hide message from my feed"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete for Me
                                    </button>

                                    {/* The logged-in administrator can delete any message for everyone */}
                                    {true && (
                                      <button
                                        onClick={() => {
                                          setActiveMessageActionId(null);
                                          setDeleteConfMsg(m);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 border-none cursor-pointer bg-transparent"
                                        title="Delete message for all participants"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete for Everyone
                                      </button>
                                    )}

                                  </div>
                                  </>
                                )}
                              </div>

                            </div>
                          )}

                          {/* Quick Reactions emoji picker floating box */}
                          {showEmojiPicker === m.id && (
                            <div className="absolute z-40 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-750 shadow-2xl rounded-xl p-1.5 flex items-center gap-1.5 bottom-full mb-1 left-0 select-none animate-fade-in text-[14px]">
                              {["👍", "❤️", "🎉", "👀", "🔥", "❗"].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(m.id, emoji)}
                                  className="hover:scale-130 duration-75 p-1 leading-none hover:bg-slate-100 dark:hover:bg-slate-850 rounded-md cursor-pointer border-none bg-transparent"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                        </div>
                      </div>
                      </div>
                    );
                  })
                )}

                {/* Multiple typing simulations */}
                {typingUsers.length > 0 && (
                  <div className="self-start flex flex-col space-y-1 items-start">
                    <span className="text-[10px] text-slate-400 font-bold select-none">
                      {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                    </span>
                    <div className="bg-slate-100/80 dark:bg-slate-805/60 px-4 py-2.5 border border-slate-100 dark:border-slate-800/80 rounded-full rounded-tl-none select-none">
                      <div className="flex gap-1 items-center justify-center h-2">
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-duration:1s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-300 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.35s]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Selected Messages Batch Action Bar */}
              {isSelectModeActive && selectedMessageIds.length > 0 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#0F172A] border border-slate-800 shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 z-50 animate-fade-in text-[10.5px] font-bold text-white">
                  <span className="text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded select-none">
                    {selectedMessageIds.length} Selected
                  </span>
                  
                  {/* Bulk Copy */}
                  <button
                    onClick={() => {
                      const selectedMsgs = messages.filter(msg => selectedMessageIds.includes(msg.id));
                      const textToCopy = selectedMsgs.map(m => `[${m.sender_name}] ${m.text}`).join("\n");
                      navigator.clipboard.writeText(textToCopy);
                      alert(`${selectedMessageIds.length} messages copied to clipboard!`);
                      setSelectedMessageIds([]);
                      setIsSelectModeActive(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border-none cursor-pointer"
                    title="Copy selected messages texts"
                  >
                    <FileText className="w-3 h-3 text-indigo-400" />
                    Copy
                  </button>

                  {/* Bulk Forward */}
                  <button
                    onClick={() => {
                      const selectedMsgs = messages.filter(msg => selectedMessageIds.includes(msg.id));
                      const consolidatedText = selectedMsgs.map(m => `[${m.sender_name}]: ${m.text}`).join("\n");
                      const pseudoMsg: ChatMessage = {
                        id: "forward_bulk_" + Date.now(),
                        room_id: activeRoomId,
                        sender_id: currentAdminId,
                        sender_name: currentAdminName,
                        text: consolidatedText,
                        created_at: new Date().toISOString(),
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        reactions: {},
                        message_status: "read"
                      };
                      setForwardDialogMsg(pseudoMsg);
                      setSelectedMessageIds([]);
                      setIsSelectModeActive(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border-none cursor-pointer"
                    title="Forward combined text"
                  >
                    <ArrowRight className="w-3 h-3 text-teal-400" />
                    Forward
                  </button>

                  <div className="w-px h-5 bg-slate-800" />

                  {/* Bulk Delete */}
                  <button
                    onClick={() => {
                      setBulkDeleteConfirmOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl transition-all duration-200 border border-rose-500/20 hover:border-rose-600 cursor-pointer shadow-sm hover:shadow-rose-950/20"
                    title="Delete all selected messages permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All
                  </button>
                  <div className="w-px h-5 bg-slate-800" />
                  <button
                    onClick={() => {
                      setSelectedMessageIds([]);
                      setIsSelectModeActive(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              )}

              {/* Selected quote replies context preview panel */}
              {replyTarget && (
                <div className="bg-indigo-50/65 dark:bg-[#162137]/80 px-4 py-2.5 border-t border-indigo-200/50 dark:border-indigo-950 flex justify-between items-center text-xs shrink-0 z-10 text-left animate-fade-in relative shadow-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-indigo-500 font-bold shrink-0">↳ Replying to:</span>
                    <div className="font-semibold text-black dark:text-gray-200 truncate min-width-0">
                      <strong className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-[9px] tracking-wide block leading-none mb-0.5">
                        {replyTarget.sender_name}
                      </strong>
                      <span className="text-[10px] italic opacity-85 block truncate">
                        {replyTarget.text}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyTarget(null)}
                    className="text-slate-405 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-black/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload block previews */}
              {chatFiles.length > 0 && (
                <div className="bg-slate-50/80 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 p-2.5 gap-2 flex flex-wrap shrink-0">
                  {chatFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-850 border border-slate-200 rounded-full text-[10.5px] font-bold text-slate-755 dark:text-slate-200">
                      <span className="truncate max-w-[140px]">{f.name}</span>
                      <button
                        onClick={() => setChatFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-705 cursor-pointer font-bold border-none bg-transparent"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Middle input text content area controls */}
              <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-[#0B1222] shrink-0">
                {activeChannelObj?.is_archived ? (
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-305 text-xs text-center rounded-xl border border-purple-200/40 font-bold select-none">
                    🔒 This conversation has been archived and is placed under Read-only mode for admins.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-2 relative">
                    
                    {/* MentionSuggestions dropdown floating picker list */}
                    {showMentionSuggestions && mentionSuggestionsList.length > 0 && (
                      <div className="absolute bottom-full mb-2 left-10 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-bold text-[11px] w-52 max-h-48 overflow-y-auto select-none">
                        <span className="px-3 py-1.5 text-[9px] uppercase font-mono tracking-wider text-slate-400 block border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20">
                          Teammate Directory Autocomplete
                        </span>
                        {mentionSuggestionsList.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => selectMentionUser(t.name)}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between cursor-pointer border-none text-slate-800 dark:text-slate-200"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{t.avatar}</span>
                              <span>{t.name}</span>
                            </span>
                            <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest">{t.role.split(" ")[0]}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Unified Whatsapp/Discord-style message input and controls layout */}
                    <div className="flex flex-col bg-slate-100/60 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all p-1">
                      
                      {/* Multiline auto-wrapping Textarea box */}
                      <textarea
                        value={commentInput}
                        onChange={(e) => {
                          setCommentInput(e.target.value);
                          handleInputChange(e as any);
                        }}
                        onKeyDown={(e) => {
                          // Submit on Enter, Shift+Enter to newline
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                          }
                        }}
                        rows={2}
                        placeholder={`Message to #${activeChannelObj?.name || 'chat'}...`}
                        className="w-full bg-transparent border-none text-xs text-black dark:text-white p-2.5 focus:outline-none resize-none font-medium placeholder-slate-400 [scrollbar-width:thin] min-h-[50px] max-h-[140px]"
                      />

                      {/* Action Bar footer containing attachment, emoji, mic, AI popover option and Send */}
                      <div className="flex items-center justify-between px-2 py-1.5 border-t border-slate-150 dark:border-slate-800/40 bg-slate-155/30 dark:bg-slate-950/25">
                        <div className="flex items-center gap-1">
                          <input
                            id="drag-panels-team-uploader"
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*,application/pdf,text/plain"
                            onChange={handleChatFileUpload}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById("drag-panels-team-uploader")?.click()}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-all shrink-0 border-none bg-transparent"
                            title="Attach files (📎)"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          {/* Smiley Emoji helper */}
                          <button
                            type="button"
                            onClick={() => {
                              const coreEmoji = ["😀", "👍", "🔥", "🚀", "🙌", "💀", "👀", "🎉"];
                              const picked = coreEmoji[Math.floor(Math.random() * coreEmoji.length)];
                              setCommentInput(prev => prev + picked);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-all shrink-0 border-none bg-transparent"
                            title="Insert instant reaction emoji (😀)"
                          >
                            <Smile className="w-4 h-4" />
                          </button>

                          {/* Collated Voice recording action button with animations */}
                          {isRecordingVoice ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-950/30 rounded-lg border border-red-200/40 h-8 shrink-0 select-none">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                              <span className="text-[10px] font-bold text-red-500 tracking-wider font-mono shrink-0">
                                00:{voiceSeconds < 10 ? `0${voiceSeconds}` : voiceSeconds}
                              </span>
                              {/* Custom voice recording simulated CSS animation bars */}
                              <div className="flex items-end gap-0.5 h-3 px-1 shrink-0">
                                <span className="w-[1.5px] h-2 bg-red-500 animate-wave rounded-full" />
                                <span className="w-[1.5px] h-3 bg-red-500 animate-wave rounded-full [animation-delay:0.1s]" />
                                <span className="w-[1.5px] h-1.5 bg-red-500 animate-wave rounded-full [animation-delay:0.2s]" />
                                <span className="w-[1.5px] h-4 bg-red-500 animate-wave rounded-full [animation-delay:0.3s]" />
                                <span className="w-[1.5px] h-2 bg-red-500 animate-wave rounded-full [animation-delay:0.4s]" />
                              </div>
                              <button
                                type="button"
                                onClick={stopAndSendVoiceNote}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9.5px] font-bold shrink-0 border-none cursor-pointer"
                              >
                                Send
                              </button>
                              <button
                                type="button"
                                onClick={cancelVoiceNote}
                                className="text-[9.5px] text-slate-405 hover:text-red-700 font-bold shrink-0 border-none cursor-pointer"
                              >
                                Stop
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={startRecordingVoiceNote}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-all shrink-0 border-none bg-transparent"
                              title="Simulate Voice Note recording (🎤)"
                            >
                              <Mic className="w-4 h-4 text-slate-500 hover:text-red-505 duration-100" />
                            </button>
                          )}

                          {/* Consolidate AI Sparkles polish options button: One dropdown only, cleaner */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowAiMenu(!showAiMenu)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border-none bg-transparent ${
                                showAiMenu 
                                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 font-bold shadow-xs" 
                                  : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                              title="✨ AI polish assistant"
                            >
                              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            </button>

                            {showAiMenu && (
                              <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-bold text-[11px] py-1 text-left">
                                <span className="px-3 py-1 text-[9px] uppercase font-mono tracking-wider text-slate-400 block border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/10">
                                  ✨ AI Polish Assistant
                                </span>
                                {[
                                  { label: "👔 Make Professional", val: "professional" },
                                  { label: "🤝 Make Friendly", val: "friendly" },
                                  { label: "✂️ Shorten draft", val: "shorten" },
                                  { label: "📝 Expand in Detail", val: "detailed" },
                                  { label: "✅ Fix Grammar", val: "grammar" },
                                  { label: "📊 Summarize Note", val: "summarize" }
                                ].map((item) => (
                                  <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => {
                                      setShowAiMenu(false);
                                      handleAIEnhanceMessage(item.val as any);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-none cursor-pointer text-slate-700 dark:text-slate-200 flex items-center justify-between bg-transparent"
                                  >
                                    <span>{item.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                          </div>

                          {/* Loading Status Indicator for AI polish */}
                          {loadingImprove && (
                            <span className="text-[10px] text-indigo-500 font-bold ml-1.5 animate-pulse">
                              {aiStep || "AI is thinking..."}
                            </span>
                          )}
                        </div>

                        {/* Send Action Arrow Button */}
                        <button
                          type="submit"
                          disabled={!commentInput.trim()}
                          className="bg-indigo-650 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-650 text-white w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer shadow-xs shrink-0 border-none transition-all"
                        >
                          <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>

                    </div>
                  </form>
                )}
              </div>

            </Panel>

            {showMembersPanel && (
              <>
                <CustomResizeHandle />

                {/* PANEL 4: USER DIRECTORY ACTIVE PRESENCES */}
                <Panel
                  id="users-panel"
                  minSize={15}
                  maxSize={35}
                  defaultSize={25}
                  className="flex flex-col bg-slate-50/50 dark:bg-[#070C15]/40 h-full max-h-full select-none"
                >
                  
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block px-0.5 leading-none">
                      Core Teammates ({teammates.filter(m => m.status === 'online').length} active)
                    </span>

                    {/* Multiselect Group Call Prompt */}
                    {selectedTeammatesForCall.length > 0 ? (
                      <div className="mt-3 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-1.5 animate-pulse">
                        <div className="space-y-0.5 text-left min-w-0">
                          <p className="text-[10px] font-bold text-white leading-none">
                            Group Huddle ({selectedTeammatesForCall.length})
                          </p>
                          <p className="text-[8.5px] text-indigo-300 leading-none mt-0.5">
                            Secure multi-peer bridge
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => startCall("voice", selectedTeammatesForCall.length > 1 ? "multi" : "direct", selectedTeammatesForCall)}
                            className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[9px] font-black flex items-center gap-1 cursor-pointer duration-100 border-none"
                            title="Start voice bridge with selected"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            Voice
                          </button>
                          <button
                            onClick={() => startCall("video", selectedTeammatesForCall.length > 1 ? "multi" : "direct", selectedTeammatesForCall)}
                            className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[9px] font-black flex items-center gap-1 cursor-pointer duration-100 border-none"
                            title="Start video war-room with selected"
                          >
                            <Video className="w-2.5 h-2.5" />
                            Video
                          </button>
                          <button
                            onClick={() => setSelectedTeammatesForCall([])}
                            className="p-1 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer border-none bg-transparent"
                            title="Clear selection"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Members Presence directory lists */}
                  <div 
                    className="flex-1 overflow-y-auto p-2 space-y-1.5 pr-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(129,140,248,0.5)_transparent] dark:[scrollbar-color:rgba(99,102,241,0.4)_transparent]"
                  >
                    {teammates.map((m) => {
                      const isSelected = selectedTeammatesForCall.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all border ${
                            isSelected 
                              ? "bg-indigo-500/10 border-indigo-500/25" 
                              : "bg-transparent border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            {/* Checkbox for group selection */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              id={`cb_member_${m.id}`}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedTeammatesForCall(prev => {
                                  if (checked) {
                                    return [...prev, m.id];
                                  } else {
                                    return prev.filter(id => id !== m.id);
                                  }
                                });
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-350 dark:border-slate-800 cursor-pointer text-indigo-600 focus:ring-indigo-500 shrink-0"
                            />

                            {/* Avatar */}
                            <span className="text-sm shrink-0 select-none">{m.avatar}</span>
                            
                            <div className="truncate min-w-0 text-left">
                              <span className="font-extrabold text-slate-850 dark:text-slate-100 block leading-tight truncate" title={m.name}>
                                {m.name}
                              </span>
                              <span className="text-[9px] text-[#818CF8] dark:text-[#A5B4FC] block mt-0.5 truncate uppercase font-semibold font-sans" title={m.role}>
                                {m.role}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {/* Fast Direct Call buttons (with WebRTC logic) */}
                            <button
                              onClick={() => startCall("voice", "direct", [m.id])}
                              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors cursor-pointer border-none bg-transparent shrink-0"
                              title={`Direct Audio Call to ${m.name}`}
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => startCall("video", "direct", [m.id])}
                              className="p-1 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-md transition-colors cursor-pointer border-none bg-transparent shrink-0"
                              title={`Direct Video Call to ${m.name}`}
                            >
                              <Video className="w-3 h-3" />
                            </button>

                            {/* Interactive Status Dot Switcher */}
                            <button
                              type="button"
                              onClick={() => {
                                setTeammates(prev => prev.map(t => {
                                  if (t.id === m.id) {
                                    const flow: Array<typeof m.status> = ["online", "in_call", "away", "offline"];
                                    const nextIdx = (flow.indexOf(t.status) + 1) % flow.length;
                                    return { ...t, status: flow[nextIdx] };
                                  }
                                  return t;
                                }));
                              }}
                              className={`h-3 w-3 rounded-full border border-white dark:border-[#070C15] shrink-0 cursor-pointer p-0 hover:scale-125 hover:brightness-110 active:scale-95 transition-all outline-none ${
                                m.status === "online"
                                  ? "bg-emerald-500 animate-pulse"
                                  : m.status === "in_call"
                                    ? "bg-rose-500"
                                    : m.status === "away"
                                      ? "bg-amber-400"
                                      : "bg-slate-500"
                              }`}
                              title={`Status: ${
                                m.status === "online" ? `🟢 ${statusAvailable}` : m.status === "in_call" ? `🔴 ${statusBusy}` : m.status === "away" ? `🟡 ${statusAway}` : `⚫ ${statusOffline}`
                              } (Click to toggle)`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visual mini disclaimer indicator */}
                  <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-[#111A2D]/10 shrink-0">
                    <div className="flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-400">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <p>Admins are authenticated via the central triage hub. Chat is logged.</p>
                    </div>
                  </div>

                </Panel>
              </>
            )}

          </Group>
        </div>
      )}

      {/* MOBILE SCREEN MODE (TAB SYSTEM INSTEAD OF PANELGROUP TO COLLAPSE WIDGETS COMFORTABLY) */}
      {isMobile && (
        <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 flex flex-col h-[65vh] relative text-left">
          
          {/* TAB 1: CHANNELS LIST */}
          {mobileActiveTab === "channels" && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 animate-fade-in bg-[#070C15]/40 select-none">
              
              <div className="relative mb-2 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search channels..."
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Collaboration Channels</span>
                  <button
                    onClick={() => setShowNewChatPanel(true)}
                    className="p-1 px-2.5 text-xs font-bold text-white bg-indigo-600 rounded-lg"
                  >
                    + Create
                  </button>
                </div>

                {sortedRooms.map((r) => {
                  const isActive = r.id === activeRoomId;
                  const hasUnreadCount = unreadCounts[r.id] || 0;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveRoomId(r.id);
                        setMobileActiveTab("chat");
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        isActive ? "bg-indigo-600 text-white" : "bg-white dark:bg-[#0B1222] text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Hash className="w-3.5 h-3.5 opacity-60" />
                        <span>{r.name}</span>
                      </span>
                      {hasUnreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-black">
                          {hasUnreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE CHET WINDOW */}
          {mobileActiveTab === "chat" && (
            <div className="flex-1 flex flex-col min-height-0">
              
              {/* Header active indicators */}
              <div className="bg-white dark:bg-[#0B1222] p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center select-none shrink-0">
                <div className="truncate text-left">
                  <span className="text-xs font-black inline-flex items-center gap-1 text-slate-900 dark:text-white uppercase">
                    <Hash className="w-3.5 h-3.5" /> {activeChannelObj?.name || "Support Room"}
                  </span>
                  <p className="text-[9.5px] text-slate-400 mt-0.5 truncate">
                    {activeChannelObj?.description}
                  </p>
                </div>
              </div>

              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col select-text">
                {filteredChatMessages.length === 0 ? (
                  <p className="text-xs italic text-slate-400 my-auto text-center font-bold">No messages matching.</p>
                ) : (
                  filteredChatMessages.map((m) => {
                    const isSelf = m.sender_id === currentAdminId;
                    return (
                      <div key={m.id} className={`max-w-[85%] flex flex-col space-y-0.5 ${isSelf ? "self-end items-end" : "self-start items-start"}`}>
                        <span className="text-[9.5px] text-slate-400 font-bold px-1 select-none">
                          {m.sender_name} • {m.time}
                        </span>
                        <div className={`p-2.5 rounded-2xl text-xs text-left relative leading-relaxed font-sans ${
                          isSelf ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white dark:bg-[#111A2E] text-slate-800 dark:text-slate-250 border border-slate-200 dark:border-slate-800 rounded-tl-none"
                        }`}>
                          <p className={`whitespace-pre-wrap break-words ${isSelf ? "text-white" : "text-black dark:text-white"}`}>{renderMessageTextWithMentionsHighlight(m.text)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom input details */}
              <div className="p-3.5 border-t border-slate-205 dark:border-slate-800 bg-white dark:bg-[#0B1222] shrink-0 select-none">
                <form onSubmit={handleSendMessage} className="flex gap-1.5">
                  <Input
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder="Type team chat message..."
                    className="flex-1 h-9 text-xs bg-slate-50 dark:bg-[#111A2E]"
                  />
                  <Button type="submit" className="h-9 w-9 p-0 bg-indigo-600 text-white border-none shrink-0 rounded-lg">
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: MEMBERS DIRECTORY LIST */}
          {mobileActiveTab === "users" && (
            <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-[#070C15]/40 animate-fade-in select-none">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-2">Ops Core Staff Presence</span>
              {teammates.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.avatar}</span>
                    <div className="text-left">
                      <strong className="text-xs text-slate-800 dark:text-slate-200 block leading-none">{m.name}</strong>
                      <span className="text-[9.5px] text-slate-450 mt-1 block">{m.role}</span>
                    </div>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${m.status === 'online' ? 'bg-emerald-500' : 'bg-slate-350'}`} />
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* NEW CHAT DIALOG PANEL MODAL */}
      {showNewChatPanel && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center text-left">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-850 p-6 rounded-2xl max-w-sm w-full mx-4 space-y-4 shadow-2xl animate-fade-in text-slate-800 dark:text-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Plus className="w-4 h-4 text-indigo-505" /> Start New Collaboration
              </h3>
              <button onClick={() => setShowNewChatPanel(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer p-1 rounded-full border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template presets */}
            <div className="space-y-1.5 select-none">
              <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Workspace Templates Presets</span>
              <div className="grid grid-cols-2 gap-2">
                {["Network Team", "HR Operations", "Level 2 Escalations", "Corporate Board"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleCreateRoom(preset)}
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 hover:border-indigo-400 dark:hover:border-indigo-805 text-slate-705 dark:text-slate-200 border border-slate-200 dark:border-slate-805 text-left rounded-xl transition-all cursor-pointer font-bold text-[10px]"
                  >
                    🚀 {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
              <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Or Custom Channel</span>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block">Channel Name</label>
                <Input
                  value={customRoomName}
                  onChange={e => setCustomRoomName(e.target.value)}
                  placeholder="e.g. system-onboarding"
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block">Description (Optional)</label>
                <Input
                  value={customRoomDesc}
                  onChange={e => setCustomRoomDesc(e.target.value)}
                  placeholder="What is this discussion about?"
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => setShowNewChatPanel(false)}>Cancel</Button>
              <Button size="sm" className="h-9 text-xs bg-indigo-600 text-white border-none shrink-0" onClick={() => handleCreateRoom()}>Create Channel</Button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT ROOM DELETE CONFIRMATION DIALOG */}
      {deleteConfRoom && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center select-none text-left">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-red-500" /> Delete chat channel?
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Are you sure you want to remove the channel <strong>#{deleteConfRoom.name}</strong>?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => handleConfirmDeleteRoom("me")}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-black dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-none"
              >
                Delete For Me
              </Button>
              <Button
                onClick={() => handleConfirmDeleteRoom("everyone")}
                className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none shadow-none"
              >
                Delete For Everyone (Admin Purge)
              </Button>
              <Button
                onClick={() => setDeleteConfRoom(null)}
                variant="outline"
                className="w-full h-9 font-bold text-xs rounded-xl text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE DELETE CONFIRMATION DIALOG */}
      {deleteConfMsg && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center select-none text-left">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Trash className="w-4 h-4 text-red-500" /> Delete message?
            </h3>
            <p className="text-[11px] text-slate-400 italic mt-0.5">"{deleteConfMsg.text}"</p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => handleConfirmDeleteMessage("me")}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-black dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-none"
              >
                Delete For Me
              </Button>
              {/* Logged in admin can delete any message for everyone */}
              {true && (
                <Button
                  onClick={() => handleConfirmDeleteMessage("everyone")}
                  className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none shadow-none"
                >
                  Delete For Everyone
                </Button>
              )}
              <Button
                onClick={() => setDeleteConfMsg(null)}
                variant="outline"
                className="w-full h-9 font-bold text-xs rounded-xl text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MESSAGE DELETE CONFIRMATION DIALOG */}
      {bulkDeleteConfirmOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center select-none text-left animate-fade-in">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Trash className="w-4 h-4 text-red-500 animate-pulse" /> Confirm Bulk Deletion
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-extrabold text-red-500">{selectedMessageIds.length}</span> selected messages for everyone? This action is permanent and cannot be undone.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleConfirmBulkDelete}
                className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Permanent Delete
              </Button>
              <Button
                onClick={() => setBulkDeleteConfirmOpen(false)}
                variant="outline"
                className="w-full h-9 font-bold text-xs rounded-xl cursor-pointer text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FORWARD MESSAGE TO ANOTHER CHANNEL MODAL */}
      {forwardDialogMsg && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center text-left">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-850 p-6 rounded-2xl max-w-sm w-full mx-4 space-y-4 shadow-2xl animate-fade-in select-none text-slate-800 dark:text-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-slate-905 dark:text-white">
                <ArrowRight className="w-4 h-4 text-indigo-505" /> Forward Message text
              </h3>
              <button onClick={() => setForwardDialogMsg(null)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-450 italic bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 max-h-[85px] overflow-y-auto">
              "{forwardDialogMsg.text}"
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 block mb-1">Select Target Chat Board</span>
              <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1">
                {rooms.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleForwardMessage(ch.id)}
                    className="w-full text-left p-2 bg-slate-50/50 dark:bg-slate-905 hover:bg-indigo-600 hover:text-white border border-slate-100 dark:border-slate-850 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                  >
                    <Hash className="w-3.5 h-3.5 opacity-60" />
                    <span>{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" className="h-9 text-xs text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer rounded-xl font-bold" onClick={() => setForwardDialogMsg(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* BUSY PARTICIPANT CALL INTERCEPT DIALOG */}
      {busyCallTarget && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center select-none text-left">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl p-2 bg-rose-500/10 rounded-xl leading-none select-none">{busyCallTarget.avatar}</span>
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5 leading-tight">
                  {busyCallTarget.name}
                </h3>
                <p className="text-[9px] text-[#818CF8] uppercase font-bold tracking-widest leading-none">
                  {busyCallTarget.role}
                </p>
              </div>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 dark:border-rose-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-rose-550 dark:text-rose-400 flex items-center gap-1.5 leading-tight">
                📵 User is currently in another call
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                The peer is currently engaged in a dynamic system huddle or war room stream. Please utilize offline queues.
              </p>
            </div>

            {busySuccessMessage && (
              <div className="p-2 py-2.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 rounded-xl text-[11px] font-bold text-center leading-normal animate-pulse">
                {busySuccessMessage}
              </div>
            )}

            {/* Leave Message TextComposer */}
            {isLeavingMessage ? (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-405 block">
                  Compose Sticky Note:
                </label>
                <textarea
                  value={stickyMessageText}
                  onChange={(e) => setStickyMessageText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 min-h-[70px] outline-none"
                  placeholder={`Send direct note to ${busyCallTarget.name}...`}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={submitStickyMessage}
                    className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border-none shadow-none"
                  >
                    Send Note
                  </Button>
                  <Button
                    onClick={() => setIsLeavingMessage(false)}
                    variant="outline"
                    className="h-9 px-3 font-bold text-xs rounded-xl"
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={() => setIsLeavingMessage(true)}
                  className="w-full h-9 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-705 dark:text-slate-200 font-bold text-xs rounded-xl border-none shadow-none flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  Leave Message
                </Button>
                <button
                  type="button"
                  onClick={toggleNotificationRequest}
                  className={`w-full h-9 font-bold text-xs rounded-xl border-none shadow-none flex items-center justify-center gap-1.5 cursor-pointer text-white transition-all ${
                    notifiedUsers.includes(busyCallTarget.id)
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 shrink-0 text-white" />
                  <span>
                    {notifiedUsers.includes(busyCallTarget.id) ? "Alert Scheduled!" : "Notify When Available"}
                  </span>
                </button>
                <Button
                  onClick={() => {
                    setBusyCallTarget(null);
                    setIsLeavingMessage(false);
                    setStickyMessageText("");
                  }}
                  variant="outline"
                  className="w-full h-9 font-bold text-xs rounded-xl"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
