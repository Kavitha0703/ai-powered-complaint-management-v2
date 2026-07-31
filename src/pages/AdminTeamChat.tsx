import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext.tsx";




import DcmsCamera from "../components/DcmsCamera.tsx";
import {
  Heart, HelpCircle, LayoutDashboard, MessageCircle, PlayCircle, Plus, Search, Send, Settings, Smile, Phone, Video, Mail,
  X, AlertCircle, Camera, Check, ChevronDown, ChevronRight, Hash, LogOut, MoreHorizontal, MoreVertical,
  Paperclip, Users, Volume2, VolumeX, Mic, MicOff, Server, Terminal, Share, MousePointer2, FileText, Image, ShieldAlert, Trash2, Trash, ArrowRight, Edit2, Pin, Sparkles, MessageSquare, Bell, Reply
, RotateCcw, Menu, Archive, Edit, ChevronLeft, CheckSquare, CornerDownRight, Pause, Play, CheckCheck, Calendar as CalendarIcon} from "lucide-react";
import { Group, Panel } from "react-resizable-panels";
import { createGoogleMeet, googleSignIn } from "../lib/GoogleMeetHelper.ts";
import { sendEmailViaGmail, EmailTemplates } from "../lib/GmailService.ts";
import { getAllActiveAdmins } from "../lib/AdminManagementHelper.ts";
import { GmailEmailCenterPanel } from "../components/GmailEmailCenterPanel.tsx";
import { GoogleCalendarPanel } from "../components/GoogleCalendarPanel.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";
import { Input } from "../../components/ui/input.tsx";


export type HuddleParticipant = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isCameraOn: boolean;
};

interface Teammate {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "in_call" | "away" | "offline";
}

interface ChatRoom {
  is_archived?: boolean;
  is_pinned?: boolean;
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
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
  reactions?: Record<string, string[]>;
  attachments?: Array<{ name: string; url: string; type: string }>;
  is_edited?: boolean;
  is_pinned?: boolean;
  deleted_for?: string[];
  message_status?: "sent" | "delivered" | "read";
  is_voice_note?: boolean;
  voice_duration?: number;
  audio_url?: string;
  call_summary?: {
    title?: string;
    meet_link?: string;
    meet_status?: "Scheduled" | "Waiting" | "Live" | "Ended" | "Cancelled" | "Failed";
    type: "voice" | "video";
    duration: string;
    participants: string[];
    joinedParticipants?: string[];
    joinedParticipantEmails?: string[];
    organizerId?: string;
    organizerName?: string;
    organizerEmail?: string;
    createdAt?: string;
    startedAt?: string;
    endedAt?: string;
    screenShareUsed?: boolean;
    recordingNotes?: string;
    ticketNumber?: string;
    ticketTitle?: string;
  };
}

interface RecentCall {
  id: string;
  type: "voice" | "video";
  title: string;
  participants: string[];
  duration: string;
  timestamp: string;
}

export default function AdminTeamChat() {
  const { user, dbUser } = useAuth();
  
  const currentAdminId = dbUser?.id || "usr_kavitha";
  const currentAdminName = dbUser?.name || "Kavitha";
  
  const [meetings, setMeetings] = useState<RecentCall[]>([]);
  const speakText = (text: string, voiceName?: string) => {
    console.log("Speaking:", text);
  };
  const [audioLevel, setAudioLevel] = useState(1);
  const voiceTimerRef = useRef<any>(null);
  const playbackTimerRef = useRef<any>(null);
  const dragCounterRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const channelsPanelRef = useRef<any>(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>([]);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mentionFilter, setMentionFilter] = useState<string>("");
  const [isChannelsSidebarOpen, setIsChannelsSidebarOpen] = useState<boolean>(true);
  const [isChannelsSidebarCollapsed, setIsChannelsSidebarCollapsed] = useState<boolean>(false);
  const [panelKey, setPanelKey] = useState<number>(0);
  const [panelLayouts, setPanelLayouts] = useState<number[]>([20, 55, 25]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [dropdownRoomId, setDropdownRoomId] = useState<string | null>(null);
  const [isArchivedSectionExpanded, setIsArchivedSectionExpanded] = useState<boolean>(false);
  const [currentUserStatus, setCurrentUserStatus] = useState<string>("online");
  const [showStatusMenu, setShowStatusMenu] = useState<boolean>(false);
  const [isDraggingOverChat, setIsDraggingOverChat] = useState<boolean>(false);
  const [playingVoiceProg, setPlayingVoiceProg] = useState<number>(0);
  const polishMode = null;


  const [activeRoomId, setActiveRoomId] = useState<string | null>("ch_general");
  
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [customRoomName, setCustomRoomName] = useState<string>("");
  const [customRoomDesc, setCustomRoomDesc] = useState<string>("");
  const [deleteConfRoom, setDeleteConfRoom] = useState<string | null>(null);
  const [deleteConfMsg, setDeleteConfMsg] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState<boolean>(false);
  const [forwardDialogMsg, setForwardDialogMsg] = useState<ChatMessage | null>(null);
  const [busyCallTarget, setBusyCallTarget] = useState<Teammate | null>(null);
  const [busySuccessMessage, setBusySuccessMessage] = useState<string>("");
  const [isLeavingMessage, setIsLeavingMessage] = useState<boolean>(false);
  const [stickyMessageText, setStickyMessageText] = useState<string>("");
  const [notifiedUsers, setNotifiedUsers] = useState<string[]>([]);
  const [activeMessageActionId, setActiveMessageActionId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [editInput, setEditInput] = useState<string>("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showGmailCenter, setShowGmailCenter] = useState<boolean>(false);
  const [showAiMenu, setShowAiMenu] = useState<boolean>(false);
  const [loadingImprove, setLoadingImprove] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<number>(0);

  const handleDeleteForMe = (msgId: string) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setDeleteConfMsg(null);
  };
  const submitStickyMessage = () => {
      setBusySuccessMessage("Message left successfully.");
      setTimeout(() => setBusySuccessMessage(""), 2000);
      setStickyMessageText("");
      setIsLeavingMessage(false);
  };
  const toggleNotificationRequest = () => {
      if (!busyCallTarget) return;
      setNotifiedUsers(prev => prev.includes(busyCallTarget.id) ? prev.filter(id => id !== busyCallTarget.id) : [...prev, busyCallTarget.id]);
  };

  const statusAvailable = "Available";
  const statusBusy = "Busy";
  const statusAway = "Away";
  const statusOffline = "Offline";


  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [showMembersPanel, setShowMembersPanel] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSelectModeActive, setIsSelectModeActive] = useState<boolean>(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [chatCameraActive, setChatCameraActive] = useState<boolean>(false);
  const [chatFiles, setChatFiles] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState<string>("");
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState<boolean>(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isMeetingsCollapsed, setIsMeetingsCollapsed] = useState<boolean>(false);
  const [isFetchingMeetings, setIsFetchingMeetings] = useState<boolean>(true);
  const [selectedCallDetail, setSelectedCallDetail] = useState<RecentCall | null>(null);

  const loadActiveTeammatesFromDb = (): Teammate[] => {
    const currentAdminName = user?.name || dbUser?.name || "Kavitha";
    const currentAdminIdFallback = dbUser?.id || "usr_kavitha";
    const currentEmail = (user?.email || dbUser?.email || "").toLowerCase();

    const activeAdmins = getAllActiveAdmins();
    return activeAdmins
      .filter(a => a.id !== currentAdminIdFallback && a.email.toLowerCase() !== currentEmail && a.name !== currentAdminName)
      .map(a => ({
        id: a.id,
        name: a.name,
        role: a.role === 'super_admin' ? 'Super Admin' : a.role === 'support_staff' ? 'Support Staff' : 'Administrator',
        avatar: a.avatar || "👤",
        status: (a.is_online ? "online" : "offline") as "online" | "in_call" | "away" | "offline"
      }));
  };

  const [teammates, setTeammates] = useState<Teammate[]>(loadActiveTeammatesFromDb);

  useEffect(() => {
    const handleAdminInvitesUpdated = () => {
      setTeammates(loadActiveTeammatesFromDb());
    };
    window.addEventListener("dcms_admin_invites_updated", handleAdminInvitesUpdated);
    return () => window.removeEventListener("dcms_admin_invites_updated", handleAdminInvitesUpdated);
  }, [user, dbUser]);

  const [isNewCallDialogOpen, setIsNewCallDialogOpen] = useState<boolean>(false);
  const [isCalendarPanelOpen, setIsCalendarPanelOpen] = useState<boolean>(false);
  const [joinMeetModalMsgId, setJoinMeetModalMsgId] = useState<string | null>(null);
  const [joinUserEmailInput, setJoinUserEmailInput] = useState<string>("");
  const [createHostEmailInput, setCreateHostEmailInput] = useState<string>("");
  const [newCallType, setNewCallType] = useState<"voice" | "video">("voice");
  const [newCallMode, setNewCallMode] = useState<"direct" | "multi" | "group">("group");
  const [selectedParticipantsForNewCall, setSelectedParticipantsForNewCall] = useState<string[]>([]);
  
  const [expandedCallDetailsMessageIds, setExpandedCallDetailsMessageIds] = useState<string[]>([]);
  const [selectedTeammatesForCall, setSelectedTeammatesForCall] = useState<string[]>([]);
  const [mobileActiveTab, setMobileActiveTab] = useState<"chat" | "users">("chat");
  const [showNewChatPanel, setShowNewChatPanel] = useState<boolean>(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceSeconds, setVoiceSeconds] = useState<number>(0);

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
      return <span className="text-emerald-400 font-mono text-[11.5px] tracking-tighter" title={"Mic Audio Stream Inward"}>{sequence}</span>;
    } else {
      // Simulate nice live peak stream waves for team members
      const bars = ["▂", "▃", "▄", "▅", "▆", "▇", "█"];
      const sequence = Array.from({ length: 6 }).map(() => {
        const idx = Math.floor(Math.random() * 5) + 2; // index 2 to 6
        return bars[idx];
      }).join("");
      return <span className="text-indigo-400 font-mono text-[11.5px] tracking-tighter" title={"VoIP Audio Inward"}>{sequence}</span>;
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
        { id: "ch_general", name: "General", description: "General discussion", created_at: new Date().toISOString(), created_by: "usr_kavitha" }
      ];
      localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(loadedRooms));
    }
    setRooms(loadedRooms);
  };

  const loadWorkspaceMessages = () => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let loadedMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : [];
    
    // Strict deduplication by message ID
    const uniqueMsgMap = new Map<string, ChatMessage>();
    loadedMessages.forEach(m => {
      if (m && m.id) {
        uniqueMsgMap.set(m.id, m);
      }
    });
    loadedMessages = Array.from(uniqueMsgMap.values());

    const filtered = loadedMessages.filter(m => m.room_id === activeRoomId && (!m.deleted_for || !m.deleted_for.includes(currentAdminId)));
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const readUpdated = filtered.map(m => {
      if (m.sender_id !== currentAdminId && m.message_status !== "read") {
        return { ...m, message_status: "read" as const };
      }
      return m;
    });
    setMessages(readUpdated);

    // Sync and populate Meeting History state from all logged call messages
    const callMessages = loadedMessages.filter(m => m.call_summary);
    const callHistoryList: RecentCall[] = callMessages.map(m => {
      const summary = m.call_summary!;
      const title = summary.title || m.text.replace(/^Created a Google Meet: /, "").replace(/^Scheduled a Google Meet: /, "") || "Google Meet";
      const timestamp = summary.createdAt || m.created_at || m.time;
      const dateObj = new Date(timestamp);
      const formattedTime = isNaN(dateObj.getTime()) ? (m.time || "Recently") : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const durationText = summary.meet_status === "Ended" && summary.duration 
        ? summary.duration 
        : (summary.meet_status === "Live" ? "🟢 Live" : summary.meet_status === "Waiting" ? "🟡 Waiting" : summary.duration || "Google Meet");
      
      const participantsList = (summary.joinedParticipants && summary.joinedParticipants.length > 0)
        ? summary.joinedParticipants
        : (summary.participants && summary.participants.length > 0 ? summary.participants : [summary.organizerName || m.sender_name]);

      return {
        id: m.id,
        type: summary.type || "video",
        title: title,
        participants: participantsList,
        duration: durationText,
        timestamp: formattedTime
      };
    });

    const savedCalls = localStorage.getItem("dcms_recent_calls_v1");
    let explicitCalls: RecentCall[] = savedCalls ? JSON.parse(savedCalls) : [];
    
    if (!savedCalls && callHistoryList.length === 0) {
      explicitCalls = [
        {
          id: "call_demo_1",
          type: "video",
          title: "Sprint Sync & Workspace Architecture",
          participants: ["Kavitha (nasikakavitha@gmail.com)", "Testadmin"],
          duration: "24 mins",
          timestamp: "Yesterday, 4:30 PM"
        }
      ];
      localStorage.setItem("dcms_recent_calls_v1", JSON.stringify(explicitCalls));
    }

    const callsMap = new Map<string, RecentCall>();
    explicitCalls.forEach(c => callsMap.set(c.id, c));
    callHistoryList.forEach(c => callsMap.set(c.id, c));

    setMeetings(Array.from(callsMap.values()));
    setTimeout(() => scrollToBottom(), 80);
  };

  const saveRoomsToStorage = (updatedRooms: ChatRoom[]) => {
    localStorage.setItem("dcms_chat_rooms_v4", JSON.stringify(updatedRooms));
    setRooms(updatedRooms);
  };

  const saveMessagesToStorage = (updatedMessages: ChatMessage[]) => {
    // Deduplicate messages by ID before persisting to storage
    const uniqueMap = new Map<string, ChatMessage>();
    updatedMessages.forEach(m => {
      if (m && m.id) {
        uniqueMap.set(m.id, m);
      }
    });
    const deduplicated = Array.from(uniqueMap.values());
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(deduplicated));
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
    if (teammates.length > 0) {
      const mentionedTeammate = teammates.find(t => normalized.includes(`@${t.name.toLowerCase().split(' ')[0]}`));
      if (mentionedTeammate) {
        simulateTeammateResponse(mentionedTeammate.name, finalTxt);
      } else if (Math.random() > 0.6) {
        setTimeout(() => {
          const chooser = teammates[Math.floor(Math.random() * teammates.length)];
          if (chooser) {
            simulateTeammateResponse(chooser.name, finalTxt);
          }
        }, 4500);
      }
    }
  };

  // Smart Context-Aware Response Engine
  const getSimulatedResponse = (name: string, userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes("ticket") || msg.includes("548")) {
      return "I'm checking the issue now. The team flagged this in yesterday's system sync.";
    }
    if (msg.includes("database") || msg.includes("db") || msg.includes("lock")) {
      return "The connection pool utilization looks healthy. Monitoring database thread stabilization.";
    }
    if (msg.includes("meet") || msg.includes("call") || msg.includes("sync")) {
      return "Joining the Google Meet room now. Audio and video streams are online.";
    }
    return `Copy that @${currentAdminName}, monitoring operations and ready to assist!`;
  };

  const simulateTeammateResponse = (name: string, userMessage: string = "") => {
    setTimeout(() => {
      setTypingUsers(prev => Array.isArray(prev) ? [...prev, name] : [name]);
      setTimeout(() => {
        setTypingUsers(prev => Array.isArray(prev) ? prev.filter(u => u !== name) : []);
        
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
  
  // Active meeting detection helper
  const getActiveMeetingForRoom = (roomId: string): ChatMessage | null => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    const allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : messages;
    const active = allMessages.find(m =>
      m.room_id === roomId &&
      m.call_summary &&
      (m.call_summary.meet_status === "Waiting" || m.call_summary.meet_status === "Live" || m.call_summary.meet_status === "Scheduled")
    );
    return active || null;
  };

  const handleJoinGoogleMeet = (messageId: string) => {
    const defaultEmail = user?.email || dbUser?.email || "nasikakavitha@gmail.com";
    setJoinUserEmailInput(defaultEmail);
    setJoinMeetModalMsgId(messageId);
  };

  const handleConfirmJoinGoogleMeet = (messageId: string, emailInput: string) => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : messages;

    const target = allMessages.find(m => m.id === messageId);
    if (!target || !target.call_summary) return;

    const participantLabel = `${currentAdminName} (${emailInput})`;
    const joined = target.call_summary.joinedParticipants || [];
    const updatedJoined = Array.from(new Set([...joined, participantLabel]));

    const joinedEmails = target.call_summary.joinedParticipantEmails || [];
    const updatedJoinedEmails = Array.from(new Set([...joinedEmails, emailInput]));

    const updated = allMessages.map(m => {
      if (m.id === messageId && m.call_summary) {
        return {
          ...m,
          call_summary: {
            ...m.call_summary,
            meet_status: "Live" as const,
            startedAt: m.call_summary.startedAt || new Date().toISOString(),
            joinedParticipants: updatedJoined,
            joinedParticipantEmails: updatedJoinedEmails
          }
        };
      }
      return m;
    });

    saveMessagesToStorage(updated);
    setJoinMeetModalMsgId(null);

    if (target.call_summary.meet_link) {
      window.open(target.call_summary.meet_link, "_blank");
    }
  };

  const handleLeaveGoogleMeet = (messageId: string) => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : messages;

    const updated = allMessages.map(m => {
      if (m.id === messageId && m.call_summary) {
        const joined = (m.call_summary.joinedParticipants || []).filter(p => !p.startsWith(currentAdminName));
        const newStatus = joined.length === 0 ? ("Waiting" as const) : m.call_summary.meet_status;
        return {
          ...m,
          call_summary: {
            ...m.call_summary,
            meet_status: newStatus,
            joinedParticipants: joined
          }
        };
      }
      return m;
    });

    saveMessagesToStorage(updated);
  };

  const handleEndGoogleMeet = (messageId: string) => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : messages;

    const updated = allMessages.map(m => {
      if (m.id === messageId && m.call_summary) {
        const end = new Date();
        const start = new Date(m.call_summary.startedAt || m.call_summary.createdAt || m.created_at);
        const diffMs = Math.max(0, end.getTime() - start.getTime());
        const diffMins = Math.max(1, Math.round(diffMs / 60000));
        const durationStr = diffMins >= 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins} min`;

        return {
          ...m,
          call_summary: {
            ...m.call_summary,
            meet_status: "Ended" as const,
            endedAt: end.toISOString(),
            duration: durationStr
          }
        };
      }
      return m;
    });

    saveMessagesToStorage(updated);
  };

  const handleCreateGoogleMeet = async (title: string, selectedParticipants: string[], hostEmail?: string) => {
    const defaultEmail = user?.email || dbUser?.email || "nasikakavitha@gmail.com";
    const finalHostEmail = hostEmail || createHostEmailInput || defaultEmail;

    // Prevent duplicate meetings in the same channel
    const activeMeeting = getActiveMeetingForRoom(activeRoomId);
    if (activeMeeting) {
      alert(`A Google Meet ("${activeMeeting.call_summary?.title || 'Team Sync'}") is already in progress in this channel. Please join or end the existing meeting before creating a new one.`);
      setIsNewCallDialogOpen(false);
      return;
    }

    try {
      let meetLink = await createGoogleMeet(title);
      if (!meetLink) {
        const result = await googleSignIn();
        if (result) {
          meetLink = await createGoogleMeet(title);
        }
      }

      if (meetLink) {
        const now = new Date().toISOString();
        const hostParticipantLabel = `${currentAdminName} (${finalHostEmail})`;
        const newMsg: ChatMessage = {
          id: "msg_" + Date.now(),
          room_id: activeRoomId,
          sender_id: currentAdminId,
          sender_name: currentAdminName,
          text: "Created a Google Meet: " + title,
          created_at: now,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          call_summary: {
            title: title,
            type: "video" as "video",
            duration: "Waiting for participants...",
            participants: selectedParticipants,
            joinedParticipants: [hostParticipantLabel],
            joinedParticipantEmails: [finalHostEmail],
            meet_link: meetLink,
            meet_status: "Waiting" as const,
            organizerId: currentAdminId,
            organizerName: currentAdminName,
            organizerEmail: finalHostEmail,
            createdAt: now
          }
        };

        const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
        let allMessages: ChatMessage[] = savedMsg ? JSON.parse(savedMsg) : messages;
        saveMessagesToStorage([...allMessages, newMsg]);
        setIsNewCallDialogOpen(false);

        // Dispatch Gmail Invitation via Gmail API
        const emailContent = EmailTemplates.meetingInvite(
          title,
          meetLink,
          currentAdminName,
          finalHostEmail,
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today"
        );
        sendEmailViaGmail({
          to: finalHostEmail,
          subject: emailContent.subject,
          bodyHtml: emailContent.html,
          category: 'meeting_invite'
        }).catch(err => console.error("Email send warning:", err));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create Google Meet");
    }
  };

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
      <div className="group w-1.5 min-w-1.5 relative flex items-center justify-center bg-slate-100 hover:bg-indigo-500 dark:bg-[#111A2E] dark:hover:bg-indigo-600 transition-all duration-150 cursor-col-resize self-stretch select-none">
        <div className="absolute top-1/2 -translate-y-1/2 w-[3px] h-8 bg-slate-300 dark:bg-slate-700 rounded-full opacity-60 group-hover:opacity-100 group-active:bg-indigo-300 transition-all" />
      </div>
    );
  };

  // MentionSuggestions component
  const mentionSuggestionsList = teammates.filter(t =>
    t.name.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="w-full h-[calc(100vh-130px)] lg:h-[calc(100vh-150px)] min-h-[550px] flex flex-col justify-start overflow-hidden bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
      
      {/* GOOGLE CALENDAR PANEL */}
      <GoogleCalendarPanel isOpen={isCalendarPanelOpen} onClose={() => setIsCalendarPanelOpen(false)} />

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
                  <h3 className="text-sm font-bold text-white leading-none">{"Bridge Diagnostics Log"}</h3>
                  <p className="text-[10px] text-slate-405 font-mono">{"ID:"}{selectedCallDetail.id}</p>
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
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 font-bold">{"Session Name / Task"}</span>
                <p className="text-sm font-extrabold text-white tracking-tight mt-0.5">{selectedCallDetail.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3">
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-405 block">{"Session Duration"}</span>
                  <span className="text-xs font-mono font-bold text-indigo-300">{selectedCallDetail.duration}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-405 block">{"Connected At"}</span>
                  <span className="text-xs font-mono font-bold text-teal-300">{selectedCallDetail.timestamp}</span>
                </div>
              </div>

              {/* Participants */}
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 font-bold block mb-2">{"Connected Huddle Members ("}{selectedCallDetail.participants.length})</span>
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
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 font-bold block">{"Network Health Quality Metrics"}</span>
                <div className="space-y-1 bg-slate-900/20 rounded-xl p-2.5 text-[10px] font-mono border border-slate-800/40">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{"Connection Quality"}</span>
                    <span className="text-emerald-400 font-bold">{"Excellent (100% stable)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{"Session Host Nodes"}</span>
                    <span className="text-slate-300">{"AWS regional-ingress-3"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{"Audio Jitter Buffer"}</span>
                    <span className="text-teal-400 font-bold">{"12ms avg"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{"Encryption Cypher"}</span>
                    <span className="text-indigo-400 font-bold font-sans">{"AES-256 (DTLS-SRTP)"}</span>
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
                  const peerNames = selectedCallDetail.participants.filter(name => name !== currentAdminName);
                  handleCreateGoogleMeet(`Follow-up: ${selectedCallDetail.title}`, peerNames);
                }}
                className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 border-none shadow-lg active:scale-95 duration-100"
              >
                <Video className="w-3.5 h-3.5" />
                {"Create Google Meet"}</button>
              <button
                type="button"
                onClick={() => setSelectedCallDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer border-none"
              >
                {"Close Logs"}</button>
            </div>
          </div>
        </div>
      )}


      {/* GOOGLE MEET CREATION DIALOG */}
      {isNewCallDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-505/10 via-transparent to-transparent rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Video className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">{"Create Google Meet"}</h3>
                  <p className="text-[10px] text-slate-400">{"Schedule a Google Meet with your team"}</p>
                </div>
              </div>
              <button onClick={() => setIsNewCallDialogOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Google Workspace Integration Active Status */}
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-[11px] text-emerald-200/90 leading-relaxed flex gap-2.5 items-center">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  ✓
                </div>
                <div>
                  <strong className="text-emerald-300 font-bold block leading-tight">Google Workspace & Meet Connected</strong>
                  <span className="text-[10px] text-slate-400">Project quiet-alchemy-0lkqp • Google Meet & Calendar API active</span>
                </div>
              </div>

              {/* Check active meeting */}
              {(() => {
                const activeMeeting = getActiveMeetingForRoom(activeRoomId);
                if (!activeMeeting) return null;
                const isOrganizer = (activeMeeting.call_summary?.organizerId === currentAdminId || activeMeeting.sender_id === currentAdminId);
                return (
                  <div className="bg-indigo-950/60 border border-indigo-700/60 rounded-xl p-3 text-xs text-indigo-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Meeting Already Active in Channel</span>
                    </div>
                    <p className="text-[11px] text-indigo-200/80">
                      "{activeMeeting.call_summary?.title || 'Team Sync'}" is currently {activeMeeting.call_summary?.meet_status === 'Live' ? '🟢 LIVE' : '🟡 Waiting for participants'}.
                    </p>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCallDialogOpen(false);
                          handleJoinGoogleMeet(activeMeeting.id);
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer border-none"
                      >
                        Join Active Meeting
                      </button>
                      {isOrganizer && (
                        <button
                          type="button"
                          onClick={() => {
                            handleEndGoogleMeet(activeMeeting.id);
                          }}
                          className="px-3 py-1 bg-red-650 hover:bg-red-600 bg-red-600 text-white rounded-lg font-bold text-xs cursor-pointer border-none"
                        >
                          End Active Meeting
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{"Host Google Email ID"}</label>
                <input 
                  type="email" 
                  id="meet-host-email"
                  placeholder="e.g., nasikakavitha@gmail.com" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white" 
                  defaultValue={user?.email || dbUser?.email || "nasikakavitha@gmail.com"}
                />
                <p className="text-[10px] text-slate-400 mt-1">{"The Google Account email address starting and hosting this meeting."}</p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{"Meeting Title"}</label>
                <input 
                  type="text" 
                  id="meet-title"
                  placeholder="e.g., Weekly Sync" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                  defaultValue="Workplace Hub Sync"
                />
              </div>
              
              <div>
                 <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{"Participants"}</label>
                 <div className="flex flex-wrap gap-2">
                    {teammates.filter(t => t.id !== currentAdminId).map(t => (
                        <div key={t.id} className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                           <span className="text-xs">{t.name}</span>
                        </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                 onClick={() => {
                     const hostEmail = (document.getElementById('meet-host-email') as HTMLInputElement)?.value || user?.email || dbUser?.email || 'nasikakavitha@gmail.com';
                     const title = (document.getElementById('meet-title') as HTMLInputElement)?.value || 'Team Sync';
                     const participants = teammates.filter(t => t.id !== currentAdminId).map(t => t.name);
                     handleCreateGoogleMeet(title, participants, hostEmail);
                 }}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 text-sm transition-colors border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                 <Video className="w-4 h-4" />
                 {"Generate Google Meet Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Google Meet Email Confirmation Modal */}
      {joinMeetModalMsgId && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 relative overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">Join Google Meet</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Enter your Google Email ID to join the call</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJoinMeetModalMsgId(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const targetMsg = messages.find(m => m.id === joinMeetModalMsgId);
              if (!targetMsg || !targetMsg.call_summary) return null;
              const summary = targetMsg.call_summary;
              return (
                <div className="space-y-4 text-left">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">Meeting Room</span>
                    <p className="text-sm font-extrabold text-white">{summary.title || "Team Sync"}</p>
                    {summary.organizerEmail && (
                      <p className="text-[11px] text-slate-400">
                        Host: <span className="text-slate-200 font-semibold">{summary.organizerName}</span> ({summary.organizerEmail})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-300 mb-1 block">Your Google / Email ID *</label>
                    <input
                      type="email"
                      value={joinUserEmailInput}
                      onChange={(e) => setJoinUserEmailInput(e.target.value)}
                      placeholder="e.g., nasikakavitha@gmail.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Google Meet requires your email address to register attendance and connect to the meeting room.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setJoinMeetModalMsgId(null)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!joinUserEmailInput || !joinUserEmailInput.includes("@")) {
                          alert("Please enter a valid email address to join the Google Meet.");
                          return;
                        }
                        handleConfirmJoinGoogleMeet(joinMeetModalMsgId, joinUserEmailInput);
                      }}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <Video className="w-4 h-4" />
                      Join Google Meet
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reset view control rail */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070C15]/40 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] uppercase font-bold rounded-md">
            {"Custom Panels Enabled"}</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {"Drag the vertical lines to adjust widths exactly like VS Code or Discord. Sizes persist automatically."}</span>
        </div>
        <Button
          onClick={resetLayoutToDefaults}
          variant="outline"
          size="xs"
          className="h-7 text-[10.5px] font-bold text-slate-700 border-slate-200 dark:text-slate-200 dark:border-slate-800"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> {"Reset Layout"}</Button>
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
            {"Channels"}</button>
          <button
            onClick={() => setMobileActiveTab("chat")}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              mobileActiveTab === "chat" ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
            }`}
          >
            {"Active Chat"}</button>
          <button
            onClick={() => setMobileActiveTab("users")}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              mobileActiveTab === "users" ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
            }`}
          >
            {"Teammates"}</button>
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
              title={"Expand Channels Sidebar"}
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
                    title={"Expand Sidebar"}
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
                      title={"Collapse Panel (VS Code style)"}
                    >
                      <Menu className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-405 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        placeholder={"Search channels..."}
                        value={globalSearch || ""}
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
                          {"Active Discussion boards"}</span>
                        <button
                          onClick={() => setShowNewChatPanel(true)}
                          className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                          title={"Create New Channel (+ New Chat)"}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {sortedRooms.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic block p-2">{"No matching active rooms"}</span>
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
                                      {"Archive Discussion"}</button>

                                    <button
                                      onClick={() => {
                                        const newName = prompt(`Enter new name for #${r.name}:`, r.name);
                                        if (newName) handleRenameChannel(r.id, newName);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 border-none cursor-pointer flex items-center gap-1.5 text-slate-705 dark:text-slate-200"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-blue-500" />
                                      {"Rename Channel"}</button>
                                    
                                    <hr className="border-slate-100 dark:border-slate-800 my-1" />
                                    
                                    <button
                                      onClick={() => setDeleteConfRoom(r)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-905 border-none cursor-pointer text-red-500 flex items-center gap-1.5"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                      {"Delete Board Room"}</button>
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
                          onClick={() => setIsMeetingsCollapsed(!isMeetingsCollapsed)}
                          className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <span>{isMeetingsCollapsed ? "▶" : "▼"} {"Meeting History ("}{meetings.length})</span>
                        </button>
                        {meetings.length > 0 && !isMeetingsCollapsed && (
                          <button
                            type="button"
                            onClick={() => {
                              setMeetings([]);
                              localStorage.setItem("dcms_recent_calls_v1", JSON.stringify([]));
                            }}
                            className="text-[9px] text-slate-400 hover:text-red-500 hover:underline border-none bg-transparent cursor-pointer font-bold"
                            title={"Clear History Log"}
                          >
                            {"Clear"}</button>
                        )}
                      </div>

                      {!isMeetingsCollapsed && (
                        <div className="space-y-1.5 animate-fade-in max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                          {isFetchingMeetings ? (
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
                          ) : meetings.length === 0 ? (
                            <span className="text-[10.5px] text-slate-450 italic p-3 block text-center bg-slate-100/10 dark:bg-slate-900/5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 select-none">
                              {"No recent bridge calls logged"}</span>
                          ) : (
                            meetings.map((call) => {
                              const isVideo = call.type === "video";
                              return (
                                <div
                                  key={call.id}
                                  onClick={() => setSelectedCallDetail(call)}
                                  className="group flex items-center justify-between p-2 rounded-xl bg-white/40 dark:bg-slate-900/15 hover:bg-slate-100/70 dark:hover:bg-slate-900/40 transition-all border border-slate-200/40 dark:border-slate-800/20 hover:border-indigo-500/20 dark:hover:border-indigo-500/20 cursor-pointer"
                                  title={"Click to view full call metrics & records"}
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
                                    title={"Start new bridge huddle with this team"}
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
                          <span>{"Archived Boards ("}{archivedRoomsList.length})</span>
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
                                  title={"Restore to Active Board"}
                                >
                                  {"Restore"}</button>
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
                          {currentAdminName} {"(You)"}</p>
                        <p className="text-[9px] text-[#818CF8] font-bold uppercase mt-1 leading-none tracking-widest truncate">
                          {currentUserStatus === "online" ? "Available" : currentUserStatus === "away" ? "Away" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className="p-1 px-1.5 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 rounded-lg text-slate-555 dark:text-slate-300 hover:text-[#818CF8] transition-colors border-none cursor-pointer flex items-center gap-0.5 outline-none font-sans"
                        title={"Change my active status"}
                      >
                        <span className="text-[10px] font-bold">{"Status"}</span>
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
                            {"Available"}</button>
                          <button
                            onClick={() => {
                              setCurrentUserStatus("away");
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            {"Away"}</button>
                          <button
                            onClick={() => {
                              setCurrentUserStatus("offline");
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none bg-transparent cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            {"Offline"}</button>
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
                    <span className="font-bold underline text-[10.5px]">{"Pinned Rule:"}</span>
                    <p className="truncate italic font-medium text-[10.5px]">
                      "{pinnedMessagesInRoom[pinnedMessagesInRoom.length - 1].text}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePinMessage(pinnedMessagesInRoom[pinnedMessagesInRoom.length - 1].id)}
                    className="p-1 px-2.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg font-black text-[9.5px] cursor-pointer text-amber-700 dark:text-amber-400"
                  >
                    {"Dismiss Pin"}</button>
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
                      title={"Hide Channels Sidebar"}
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
                            {"Archived / Read-only"}</span>
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
                      placeholder={"Search messages..."}
                      value={searchQuery || ""}
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
                    title={"Batch Message Selection Mode"}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isSelectModeActive ? "Cancel Select" : "Batch Select"}</span>
                  </button>

                  {/* Gmail Email Center Trigger Button */}
                  <button
                    onClick={() => setShowGmailCenter(true)}
                    className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-500 text-white shadow-sm border-none"
                    title="Open Gmail Integration & Email Outbox Center"
                  >
                    <Mail className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline">Gmail Center</span>
                  </button>

                  {/* Status-aware Header Meet button */}
                  {(() => {
                    const activeMeeting = getActiveMeetingForRoom(activeRoomId);
                    if (!activeMeeting) {
                      return (
                        <button
                          onClick={() => setIsNewCallDialogOpen(true)}
                          className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm border-none"
                          title="Create Google Meet for this channel"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Create Meet</span>
                        </button>
                      );
                    }

                    const status = activeMeeting.call_summary?.meet_status;
                    if (status === "Waiting") {
                      return (
                        <button
                          onClick={() => handleJoinGoogleMeet(activeMeeting.id)}
                          className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse"
                          title="Google Meet is waiting for participants. Click to join."
                        >
                          <Video className="w-3.5 h-3.5 text-amber-400" />
                          <span>🟡 Waiting to Join</span>
                        </button>
                      );
                    }

                    if (status === "Live") {
                      const joinedCount = activeMeeting.call_summary?.joinedParticipants?.length || 1;
                      return (
                        <button
                          onClick={() => handleJoinGoogleMeet(activeMeeting.id)}
                          className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          title="Google Meet is currently live. Click to join."
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                          <span>🟢 Live ({joinedCount})</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => setIsNewCallDialogOpen(true)}
                        className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm border-none"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Create Meet</span>
                      </button>
                    );
                  })()}

                  <button
                    onClick={() => setIsCalendarPanelOpen(true)}
                    className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm"
                    title="View & Schedule Google Calendar Events"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Calendar</span>
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
                    title={"Toggle Message Multi-Selection Mode"}
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
                    title={"Toggle Teammate Presence Board"}
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
                      {"Drop files to attach to chat"}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {"Release your files here to instantly upload and share with the support team."}</p>
                  </div>
                )}

                {filteredChatMessages.length === 0 ? (
                  <div className="my-auto flex flex-col items-center justify-center p-8 text-center text-slate-400 select-none">
                    <span className="text-4xl text-slate-350">💬</span>
                    <p className="text-xs font-bold mt-2">{"No messages match your search criteria."}</p>
                    <p className="text-[10px] text-slate-401 mt-1">
                      {"Be the target-setter and start the support thread in #"}{activeChannelObj?.name}!
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
                            {m.is_edited && <span className="text-[9px] text-indigo-400 italic font-normal leading-none">{"(edited)"}</span>}
                            {m.is_pinned && <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 leading-none">{"📌 Pinned"}</span>}
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
                                  {"Attached Resource"}</span>
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
                                     <span>{"Voice memo"}</span>
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
                             <div className="mb-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-sm flex flex-col gap-3 text-left text-xs animate-fade-in relative overflow-hidden text-white">
                               {/* Card Header */}
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2.5">
                                   <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                     <Video className="w-4 h-4 text-indigo-400" />
                                   </div>
                                   <div>
                                     <h4 className="font-bold text-sm text-white leading-tight">
                                       {m.call_summary.title || m.text.replace("Created a Google Meet: ", "").replace("Scheduled a Google Meet: ", "") || "Google Meet"}
                                     </h4>
                                     <p className="text-[10px] text-slate-400 font-medium">
                                       Created by <span className="text-slate-200 font-semibold">{m.call_summary.organizerName || m.sender_name}</span>
                                     </p>
                                   </div>
                                 </div>
                               </div>

                               {/* Status indicator row */}
                               <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                                 {(() => {
                                   const status = m.call_summary.meet_status || "Waiting";
                                   if (status === "Waiting") {
                                     return (
                                       <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-300 border-amber-500/30 flex items-center gap-1.5">
                                         <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                         Waiting for participants...
                                       </span>
                                     );
                                   }
                                   if (status === "Live") {
                                     const joinedCount = m.call_summary.joinedParticipants?.length || 1;
                                     return (
                                       <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 flex items-center gap-1.5">
                                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                         🟢 LIVE ({joinedCount} joined)
                                       </span>
                                     );
                                   }
                                   if (status === "Ended") {
                                     return (
                                       <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-800 text-slate-400 border-slate-700">
                                         ⚫ Meeting Ended ({m.call_summary.duration || "Ended"})
                                       </span>
                                     );
                                   }
                                   return (
                                     <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-800 text-slate-400 border-slate-700">
                                       {status}
                                     </span>
                                   );
                                 })()}

                                 <span className="text-[10px] font-mono text-slate-400">
                                   {m.call_summary.meet_status === "Ended" && m.call_summary.endedAt
                                     ? `Duration: ${m.call_summary.duration}`
                                     : m.time}
                                 </span>
                               </div>

                               {/* Participant Badges */}
                               {((m.call_summary.joinedParticipants && m.call_summary.joinedParticipants.length > 0) || m.call_summary.participants.length > 0) && (
                                 <div className="flex flex-wrap gap-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                                   <span className="text-[9.5px] font-bold text-slate-400 block w-full mb-0.5 uppercase tracking-wider">
                                     {m.call_summary.meet_status === "Ended" ? "Meeting Attendance:" : "Participants:"}
                                   </span>
                                   {(m.call_summary.joinedParticipants && m.call_summary.joinedParticipants.length > 0 ? m.call_summary.joinedParticipants : m.call_summary.participants).map((person, idx) => {
                                     const isJoined = m.call_summary?.joinedParticipants?.includes(person);
                                     return (
                                       <span
                                         key={idx}
                                         className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 border ${
                                           isJoined
                                             ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                                             : "bg-slate-800 text-slate-300 border-slate-700/50"
                                         }`}
                                       >
                                         {isJoined && <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />}
                                         {person}
                                       </span>
                                     );
                                   })}
                                 </div>
                               )}

                               {/* Action Buttons */}
                               <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                                 {(m.call_summary.meet_status === "Waiting" || m.call_summary.meet_status === "Live") && (
                                   <>
                                     <button
                                       type="button"
                                       onClick={() => handleJoinGoogleMeet(m.id)}
                                       className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                     >
                                       <Video className="w-3.5 h-3.5" />
                                       Join Meeting
                                     </button>

                                     {m.call_summary.joinedParticipants?.includes(currentAdminName) && (
                                       <button
                                         type="button"
                                         onClick={() => handleLeaveGoogleMeet(m.id)}
                                         className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
                                       >
                                         Leave
                                       </button>
                                     )}

                                     {/* End Meeting button (ONLY visible to Organizer!) */}
                                     {(m.call_summary.organizerId === currentAdminId || m.sender_id === currentAdminId) && (
                                       <button
                                         type="button"
                                         onClick={() => handleEndGoogleMeet(m.id)}
                                         className="px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 hover:border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer"
                                         title="Only the meeting creator can end this meeting"
                                       >
                                         End Meeting
                                       </button>
                                     )}
                                   </>
                                 )}

                                 {m.call_summary.meet_status === "Ended" && (
                                   <div className="flex items-center justify-between w-full">
                                     <span className="text-[10.5px] text-slate-400 italic">Meeting concluded</span>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const summaryText = `Google Meet: ${m.call_summary?.title || 'Sync'}\nOrganized by: ${m.call_summary?.organizerName || m.sender_name}\nDuration: ${m.call_summary?.duration}\nAttendees: ${(m.call_summary?.joinedParticipants || m.call_summary?.participants || []).join(', ')}`;
                                         navigator.clipboard.writeText(summaryText);
                                         alert("Meeting summary copied to clipboard!");
                                       }}
                                       className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700 cursor-pointer"
                                     >
                                       Copy Summary
                                     </button>
                                   </div>
                                 )}
                               </div>
                             </div>
                           )}

                          {editingMessageId === m.id ? (
                            <div className="space-y-1.5 min-w-[240px]">
                              <Textarea
                                value={editInput || ""}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="text-xs bg-slate-50 dark:bg-slate-950 text-black dark:text-white p-2 border-slate-300 dark:border-slate-800 h-16 rounded-lg font-medium"
                              />
                              <div className="flex gap-1.5 justify-end">
                                <Button size="xs" variant="outline" className={`h-6 text-[10px] ${isSelf ? "text-white border-white/30 hover:bg-white/10" : "text-black dark:text-white"}`} onClick={() => setEditingMessageId(null)}>{"Cancel"}</Button>
                                <Button size="xs" className={`h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 border-none ${isSelf ? "text-white" : "text-black dark:text-white"}`} onClick={() => handleSaveEditMessage(m.id)}>{"Save"}</Button>
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
                                <CheckCheck className="w-3.5 h-3.5 text-sky-400" title={"Read (✓✓ Blue)"} />
                              ) : m.message_status === "delivered" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-300" title={"Delivered (✓✓ Gray)"} />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" title={"Sent (✓ Gray)"} />
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
                                title={"Add Quick Reaction"}
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
                                  title={"Message Actions"}
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
                                      {"Message Options"}</div>

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        setReplyTarget(m);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <Reply className="w-3.5 h-3.5 text-indigo-500" />
                                      {"Reply Message"}</button>

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
                                        {"Edit Text"}</button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        handleCopyToClipboard(m.text);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      {"Copy Text"}</button>

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
                                      {"Forward ..."}</button>

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        setShowEmojiPicker(m.id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2 border-none cursor-pointer bg-transparent text-slate-700 dark:text-slate-200"
                                    >
                                      <Smile className="w-3.5 h-3.5 text-amber-500" />
                                      {"Add Reaction"}</button>

                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                                    <button
                                      onClick={() => {
                                        setActiveMessageActionId(null);
                                        handleDeleteForMe(m.id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 border-none cursor-pointer bg-transparent"
                                      title={"Hide message from my feed"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      {"Delete for Me"}</button>

                                    {/* The logged-in administrator can delete any message for everyone */}
                                    {true && (
                                      <button
                                        onClick={() => {
                                          setActiveMessageActionId(null);
                                          setDeleteConfMsg(m);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 border-none cursor-pointer bg-transparent"
                                        title={"Delete message for all participants"}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {"Delete for Everyone"}</button>
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
                      {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} {"typing..."}</span>
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
                    {selectedMessageIds.length} {"Selected"}</span>
                  
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
                    title={"Copy selected messages texts"}
                  >
                    <FileText className="w-3 h-3 text-indigo-400" />
                    {"Copy"}</button>

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
                    title={"Forward combined text"}
                  >
                    <ArrowRight className="w-3 h-3 text-teal-400" />
                    {"Forward"}</button>

                  <div className="w-px h-5 bg-slate-800" />

                  {/* Bulk Delete */}
                  <button
                    onClick={() => {
                      setBulkDeleteConfirmOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl transition-all duration-200 border border-rose-500/20 hover:border-rose-600 cursor-pointer shadow-sm hover:shadow-rose-950/20"
                    title={"Delete all selected messages permanently"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {"Delete All"}</button>
                  <div className="w-px h-5 bg-slate-800" />
                  <button
                    onClick={() => {
                      setSelectedMessageIds([]);
                      setIsSelectModeActive(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    {"Cancel"}</button>
                </div>
              )}

              {/* Selected quote replies context preview panel */}
              {replyTarget && (
                <div className="bg-indigo-50/65 dark:bg-[#162137]/80 px-4 py-2.5 border-t border-indigo-200/50 dark:border-indigo-950 flex justify-between items-center text-xs shrink-0 z-10 text-left animate-fade-in relative shadow-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-indigo-500 font-bold shrink-0">{"↳ Replying to:"}</span>
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
                    {"🔒 This conversation has been archived and is placed under Read-only mode for admins."}</div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-2 relative">
                    
                    {/* MentionSuggestions dropdown floating picker list */}
                    {showMentionSuggestions && mentionSuggestionsList.length > 0 && (
                      <div className="absolute bottom-full mb-2 left-10 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-bold text-[11px] w-52 max-h-48 overflow-y-auto select-none">
                        <span className="px-3 py-1.5 text-[9px] uppercase font-mono tracking-wider text-slate-400 block border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20">
                          {"Teammate Directory Autocomplete"}</span>
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
                        value={commentInput || ""}
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
                        placeholder={`${"Message to #"}${activeChannelObj?.name || "chat"}...`}
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
                            title={"Attach files (📎)"}
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          {/* Smart AI Camera */}
                          <button
                            type="button"
                            onClick={() => setChatCameraActive(true)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-all shrink-0 border-none bg-transparent"
                            title={"Take live snapshot with AI Camera"}
                          >
                            <Camera className="w-4 h-4" />
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
                            title={"Insert instant reaction emoji (😀)"}
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
                                {"Send"}</button>
                              <button
                                type="button"
                                onClick={cancelVoiceNote}
                                className="text-[9.5px] text-slate-405 hover:text-red-700 font-bold shrink-0 border-none cursor-pointer"
                              >
                                {"Stop"}</button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={startRecordingVoiceNote}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-all shrink-0 border-none bg-transparent"
                              title={"Simulate Voice Note recording (🎤)"}
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
                              title={"✨ AI polish assistant"}
                            >
                              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            </button>

                            {showAiMenu && (
                              <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-bold text-[11px] py-1 text-left">
                                <span className="px-3 py-1 text-[9px] uppercase font-mono tracking-wider text-slate-400 block border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/10">
                                  {"✨ AI Polish Assistant"}</span>
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
                      {"Core Teammates ("}{teammates.filter(m => m.status === 'online').length} {"active)"}</span>

                    {/* Multiselect Group Call Prompt */}
                    {selectedTeammatesForCall.length > 0 ? (
                      <div className="mt-3 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-1.5 animate-pulse">
                        <div className="space-y-0.5 text-left min-w-0">
                          <p className="text-[10px] font-bold text-white leading-none">
                            {"Group Huddle ("}{selectedTeammatesForCall.length})
                          </p>
                          <p className="text-[8.5px] text-indigo-300 leading-none mt-0.5">
                            {"Secure multi-peer bridge"}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                                const title = "Team Sync";
                                const participants = teammates.filter(t => selectedTeammatesForCall.includes(t.id)).map(t => t.name);
                                handleCreateGoogleMeet(title, participants);
                            }}
                            className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[9px] font-black flex items-center gap-1 cursor-pointer duration-100 border-none"
                            title={"Create Google Meet with selected"}
                          >
                            <Video className="w-2.5 h-2.5" />
                            {"Meet"}</button>
                          <button
                            onClick={() => setSelectedTeammatesForCall([])}
                            className="p-1 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer border-none bg-transparent"
                            title={"Clear selection"}
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
                            {/* Fast Direct Call buttons */}
                            <button
                              onClick={() => {
                                 handleCreateGoogleMeet("Quick Sync", [m.name]);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors cursor-pointer border-none bg-transparent shrink-0"
                              title={`Create Google Meet with ${m.name}`}
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
                      <p>{"Admins are authenticated via the central triage hub. Chat is logged."}</p>
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
                  placeholder={"Search channels..."}
                  value={globalSearch || ""}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">{"Collaboration Channels"}</span>
                  <button
                    onClick={() => setShowNewChatPanel(true)}
                    className="p-1 px-2.5 text-xs font-bold text-white bg-indigo-600 rounded-lg"
                  >
                    {"+ Create"}</button>
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
                  <p className="text-xs italic text-slate-400 my-auto text-center font-bold">{"No messages matching."}</p>
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
                    value={commentInput || ""}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder={"Type team chat message..."}
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
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-2">{"Ops Core Staff Presence"}</span>
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
                <Plus className="w-4 h-4 text-indigo-505" /> {"Start New Collaboration"}</h3>
              <button onClick={() => setShowNewChatPanel(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer p-1 rounded-full border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template presets */}
            <div className="space-y-1.5 select-none">
              <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block">{"Workspace Templates Presets"}</span>
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
              <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block">{"Or Custom Channel"}</span>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block">{"Channel Name"}</label>
                <Input
                  value={customRoomName || ""}
                  onChange={e => setCustomRoomName(e.target.value)}
                  placeholder={"e.g. system-onboarding"}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block">{"Description (Optional)"}</label>
                <Input
                  value={customRoomDesc || ""}
                  onChange={e => setCustomRoomDesc(e.target.value)}
                  placeholder={"What is this discussion about?"}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => setShowNewChatPanel(false)}>{"Cancel"}</Button>
              <Button size="sm" className="h-9 text-xs bg-indigo-600 text-white border-none shrink-0" onClick={() => handleCreateRoom()}>{"Create Channel"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT ROOM DELETE CONFIRMATION DIALOG */}
      {deleteConfRoom && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center select-none text-left">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-red-500" /> {"Delete chat channel?"}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {"Are you sure you want to remove the channel"}<strong>#{deleteConfRoom.name}</strong>?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => handleConfirmDeleteRoom("me")}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-black dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-none"
              >
                {"Delete For Me"}</Button>
              <Button
                onClick={() => handleConfirmDeleteRoom("everyone")}
                className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none shadow-none"
              >
                {"Delete For Everyone (Admin Purge)"}</Button>
              <Button
                onClick={() => setDeleteConfRoom(null)}
                variant="outline"
                className="w-full h-9 font-bold text-xs rounded-xl text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {"Cancel"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE DELETE CONFIRMATION DIALOG */}
      {deleteConfMsg && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center select-none text-left">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Trash className="w-4 h-4 text-red-500" /> {"Delete message?"}</h3>
            <p className="text-[11px] text-slate-400 italic mt-0.5">"{deleteConfMsg.text}"</p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => handleConfirmDeleteMessage("me")}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-black dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-none"
              >
                {"Delete For Me"}</Button>
              {/* Logged in admin can delete any message for everyone */}
              {true && (
                <Button
                  onClick={() => handleConfirmDeleteMessage("everyone")}
                  className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none shadow-none"
                >
                  {"Delete For Everyone"}</Button>
              )}
              <Button
                onClick={() => setDeleteConfMsg(null)}
                variant="outline"
                className="w-full h-9 font-bold text-xs rounded-xl text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {"Cancel"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MESSAGE DELETE CONFIRMATION DIALOG */}
      {bulkDeleteConfirmOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center select-none text-left animate-fade-in">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Trash className="w-4 h-4 text-red-500 animate-pulse" /> {"Confirm Bulk Deletion"}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {"Are you sure you want to permanently delete"}<span className="font-extrabold text-red-500">{selectedMessageIds.length}</span> {"selected messages for everyone? This action is permanent and cannot be undone."}</p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleConfirmBulkDelete}
                className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> {"Confirm Permanent Delete"}</Button>
              <Button
                onClick={() => setBulkDeleteConfirmOpen(false)}
                variant="outline"
                className="w-full h-9 font-bold text-xs rounded-xl cursor-pointer text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {"Cancel"}</Button>
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
                <ArrowRight className="w-4 h-4 text-indigo-505" /> {"Forward Message text"}</h3>
              <button onClick={() => setForwardDialogMsg(null)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-450 italic bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 max-h-[85px] overflow-y-auto">
              "{forwardDialogMsg.text}"
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 block mb-1">{"Select Target Chat Board"}</span>
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
              <Button size="sm" variant="outline" className="h-9 text-xs text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer rounded-xl font-bold" onClick={() => setForwardDialogMsg(null)}>{"Cancel"}</Button>
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
                {"📵 User is currently in another call"}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {"The peer is currently engaged in a dynamic system huddle or war room stream. Please utilize offline queues."}</p>
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
                  {"Compose Sticky Note:"}</label>
                <textarea
                  value={stickyMessageText || ""}
                  onChange={(e) => setStickyMessageText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 min-h-[70px] outline-none"
                  placeholder={`${"Send direct note to "}${busyCallTarget.name}...`}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={submitStickyMessage}
                    className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border-none shadow-none"
                  >
                    {"Send Note"}</Button>
                  <Button
                    onClick={() => setIsLeavingMessage(false)}
                    variant="outline"
                    className="h-9 px-3 font-bold text-xs rounded-xl"
                  >
                    {"Back"}</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={() => setIsLeavingMessage(true)}
                  className="w-full h-9 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-705 dark:text-slate-200 font-bold text-xs rounded-xl border-none shadow-none flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {"Leave Message"}</Button>
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
                  {"Close"}</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {chatCameraActive && (
        <DcmsCamera 
          onClose={() => setChatCameraActive(false)}
          onCapturePhotos={(photos) => {
            photos.forEach((photo) => {
              setChatFiles((prev) => [
                ...prev,
                {
                  name: photo.name,
                  url: photo.dataUrl,
                  type: "image"
                }
              ]);
            });
            setChatCameraActive(false);
          }}
        />
      )}

      {/* GMAIL EMAIL CENTER MODAL */}
      {showGmailCenter && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-4xl h-[85vh] max-h-[720px]">
            <GmailEmailCenterPanel onClose={() => setShowGmailCenter(false)} />
          </div>
        </div>
      )}

    </div>
  );
}
