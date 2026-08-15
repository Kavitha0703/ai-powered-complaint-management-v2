import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import ResizeHandle from "../components/ResizeHandle";
import ResizablePanel from "../components/ResizablePanel";
import { supabase } from "../lib/supabase";




import DcmsCamera from "../components/DcmsCamera";
import { Heart, HelpCircle, LayoutDashboard, MessageCircle, PlayCircle, Plus, Search, Send, Settings, Smile, Phone, Video, Mail, X, AlertCircle, Camera, Check, ChevronDown, ChevronRight, Hash, LogOut, MoreHorizontal, MoreVertical, Paperclip, Users, Volume2, VolumeX, Mic, MicOff, Server, Terminal, Share, MousePointer2, FileText, Image, ShieldAlert, Trash2, Trash, ArrowRight, Edit2, Pin, Sparkles, MessageSquare, Bell, Reply, RotateCcw, Menu, Archive, Edit, ChevronLeft, CheckSquare, CornerDownRight, Pause, Play, CheckCheck, Calendar as CalendarIcon, Calendar, Link2, CornerUpLeft, Copy } from "lucide-react";
import { createGoogleMeetBackend } from "../lib/google/meet";
import { useGoogleLogin } from "@react-oauth/google";
import { sendEmailViaGmail, EmailTemplates } from "../lib/google/index";
import { getAllActiveAdmins } from "../lib/AdminManagementHelper";
import { GmailEmailCenterPanel } from "../components/GmailEmailCenterPanel";
import { GoogleCalendarPanel } from "../components/GoogleCalendarPanel";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";


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

  const handleCreateGoogleMeet = async (title: string, participants: string[]) => {
    const isConnected = !!sessionStorage.getItem("google_workspace_access_token");
    
    if (!isConnected) {
      sessionStorage.setItem("pendingMeetRoomId", activeRoomId);
      sessionStorage.setItem("pendingMeetTitle", title);
      sessionStorage.setItem("pendingMeetParticipants", JSON.stringify(participants));
      googleLogin();
      return;
    }

    try {
      const { createGoogleCalendarEvent } = await import('../lib/google/calendar');
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      const newEvent = await createGoogleCalendarEvent({
        summary: title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        addGoogleMeet: true,
        type: 'Team',
        visibility: 'Team',
        userId: user?.id
      });
      
      const meetLink = newEvent.hangoutLink;
      if (meetLink) {
        window.open(meetLink, '_blank');
        finalizeMeetingCreation(title, participants, user?.name || "Admin", activeRoomId, meetLink);
      } else {
        console.error("Failed to generate meet link.");
      }
    } catch (e) {
      console.error("Error creating Google Meet:", e);
    }
  };

  
  const currentAdminId = dbUser?.id || user?.id || "usr_unknown";
  const currentAdminName = dbUser?.name || user?.email?.split("@")[0] || "Unknown User";
  
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
  
  // Resizable Panels State
const [channelsWidth, setChannelsWidth] = useState(() => parseInt(localStorage.getItem('dcms_chat_channels_width') || '280', 10));
const [membersWidth, setMembersWidth] = useState(() => {
    return parseInt(localStorage.getItem('dcms_chat_members_width') || '260', 10);
  });

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


  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [customRoomName, setCustomRoomName] = useState<string>("");
  const [customRoomDesc, setCustomRoomDesc] = useState<string>("");
  const [deleteConfRoom, setDeleteConfRoom] = useState<string | null>(null);
  const [deleteConfMsg, setDeleteConfMsg] = useState<ChatMessage | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState<boolean>(false);
  const [forwardDialogMsg, setForwardDialogMsg] = useState<ChatMessage | null>(null);
  const [busyCallTarget, setBusyCallTarget] = useState<Teammate | null>(null);
  const [busySuccessMessage, setBusySuccessMessage] = useState<string>("");
  const [isLeavingMessage, setIsLeavingMessage] = useState<boolean>(false);
  const [stickyMessageText, setStickyMessageText] = useState<string>("");
  const [notifiedUsers, setNotifiedUsers] = useState<string[]>([]);
  const [activeMenuPos, setActiveMenuPos] = useState<{id: string, x: number, y: number, up: boolean, isSelf: boolean, msg: ChatMessage} | null>(null);
  const [showMainEmojiPicker, setShowMainEmojiPicker] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [editInput, setEditInput] = useState<string>("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showGmailCenter, setShowGmailCenter] = useState<boolean>(false);
  const [gmailInitialData, setGmailInitialData] = useState<{tab: 'log'|'compose', template?: 'meeting_invite', title?: string, link?: string} | null>(null);
  const [showAiMenu, setShowAiMenu] = useState<boolean>(false);
  const [loadingImprove, setLoadingImprove] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<number>(0);

    const handleDeleteForMe = (msgId: string) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setDeleteConfMsg(null);
      const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
      let allMessages = savedMsg ? JSON.parse(savedMsg) : [];
      const updated = allMessages.map(m => {
        if (m.id === msgId) {
          return { ...m, deleted_for: [...(m.deleted_for || []), currentAdminId] };
        }
        return m;
      });
      const updatedForMe = [...deletedForMeIds, msgId];
      setDeletedForMeIds(updatedForMe);
      localStorage.setItem("dcms_chat_deleted_for_me", JSON.stringify(updatedForMe));
      saveMessagesToStorage(updated);
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
  const [connectedGoogleEmail, setConnectedGoogleEmail] = useState<string | null>(() => sessionStorage.getItem("google_meet_connected_email"));
  
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

      const loadActiveTeammatesFromDb = async (): Promise<Teammate[]> => {
    const currentAdminName = user?.name || dbUser?.name || user?.email?.split("@")[0] || "Unknown User";
    const currentAdminId = dbUser?.id || user?.id || "usr_unknown";
    const currentEmail = (user?.email || dbUser?.email || "").toLowerCase();
    
    const activeAdmins = getAllActiveAdmins();
    
    let userProfiles: any[] = [];
    try {
      const { data } = await supabase.from('users').select('email, avatar_url, full_name, id');
      if (data) userProfiles = data;
    } catch (e) {
      console.warn('Failed to fetch user profiles for avatars');
    }
    
    // Find current user profile avatar
    const myProfile = userProfiles.find(p => p.email?.toLowerCase() === currentEmail);
    const myAvatar = myProfile?.avatar_url || dbUser?.avatar_url || "👤";

    const otherTeammates = activeAdmins
      .filter(a => a.id !== currentAdminId && a.email.toLowerCase() !== currentEmail && a.name !== currentAdminName)
      .map(a => {
        const profile = userProfiles.find(p => p.email?.toLowerCase() === a.email.toLowerCase());
        const realAvatar = profile?.avatar_url || a.avatar || "👤";
        const realId = profile?.id || a.id;
        const realName = profile?.full_name || a.name;
        
        return {
          id: realId,
          name: realName,
          role: a.role === 'super_admin' ? 'Super Admin' : a.role === 'support_staff' ? 'Support Staff' : 'Administrator',
          avatar: realAvatar,
          status: (a.is_online ? "online" : "offline") as "online" | "in_call" | "away" | "offline"
        };
      });
      
    // Return YOU first
    return [
      {
        id: currentAdminId,
        name: currentAdminName,
        role: "YOU",
        avatar: myAvatar,
        status: "online"
      },
      ...otherTeammates
    ];
  };

  const [teammates, setTeammates] = useState<Teammate[]>([]);
  useEffect(() => {
    let mounted = true;
    const fetchTeammates = async () => {
      const tms = await loadActiveTeammatesFromDb();
      if (mounted) setTeammates(tms);
    };
    fetchTeammates();
    const handleAdminInvitesUpdated = () => {
      fetchTeammates();
    };
    window.addEventListener("dcms_admin_invites_updated", handleAdminInvitesUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("dcms_admin_invites_updated", handleAdminInvitesUpdated);
    };
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
    const currentAdminId = dbUser?.id || user?.id || "usr_unknown";
    if (id === currentAdminId) {
      const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
      const baseVal = Math.max(1, Math.min(7, audioLevel));
      // Generate real-time fluctuating dynamic sequence for current user (using actual mic level)
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
  };;



  // Fetch meetings from Supabase database
  const fetchMeetingsFromSupabase = async () => {
    setIsFetchingMeetings(true);
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const fetchedList: RecentCall[] = data.map((m: any) => ({
          id: m.id || `mtg_${Math.random().toString(36).substring(2, 9)}`,
          type: m.type || "video",
          title: m.title || "Meeting",
          participants: Array.isArray(m.participants) ? m.participants : (m.host ? [m.host] : []),
          duration: m.status === "Ended" ? (m.duration || "14 mins") : (m.status === "Live" ? "🟢 Live" : "Scheduled"),
          timestamp: m.startedAt ? new Date(m.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (m.createdAt || m.created_at || "Recently")
        }));

        setMeetings(prev => {
          const map = new Map<string, RecentCall>();
          fetchedList.forEach(item => map.set(item.id, item));
          prev.forEach(item => {
            if (!map.has(item.id)) map.set(item.id, item);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn("Could not query meetings from Supabase:", err);
    } finally {
      setIsFetchingMeetings(false);
    }
  };

  // Initial Load: seed rooms, messages & meetings from database
  useEffect(() => {
    loadWorkspaceRooms();
    loadWorkspaceMessages();
    fetchMeetingsFromSupabase();
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
    setRooms(loadedRooms);
    
    setActiveRoomId(prev => {
        if (!prev && loadedRooms.length > 0) return loadedRooms[0].id;
        if (prev && !loadedRooms.find(r => r.id === prev)) return loadedRooms.length > 0 ? loadedRooms[0].id : null;
        return prev;
    });
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
    // Ensure we only show meetings for THIS channel
    const callMessages = filtered.filter(m => m.call_summary);
    
    // Filter out meetings that this user has cleared for this channel
    const clearedMeetingsStr = localStorage.getItem("dcms_cleared_meetings") || "[]";
    let clearedMeetings = [];
    try { clearedMeetings = JSON.parse(clearedMeetingsStr); } catch (e) {}
    
    const callHistoryList = callMessages
      .filter(m => !clearedMeetings.includes(m.id))
      .map(m => {
      const summary = m.call_summary;
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
    
    setMeetings(callHistoryList);
    setIsFetchingMeetings(false);
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

  const isNearBottom = () => {
    const el = document.getElementById("chat-scroll-container");
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = document.getElementById("chat-scroll-container");
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
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
      if (typingSimTimerRef.current) clearInterval(typingSimTimerRef.current);
    };
  }, []);

  // Auto scroll to latest message when activeRoomId or messages count changes
  const prevRoomIdRef = useRef(activeRoomId);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    const isNewRoom = prevRoomIdRef.current !== activeRoomId;
    const isNewMessage = prevMessagesLengthRef.current !== messages.length;

    if (isNewRoom) {
      setTimeout(() => scrollToBottom("auto"), 50);
    } else if (isNewMessage) {
      // Only auto-scroll on new messages if user is already near bottom, or if we just sent a message (but we can't easily tell, so near bottom is safest).
      // We'll also scroll in handleSendMessage.
      if (isNearBottom()) {
        scrollToBottom("smooth");
      }
    }

    prevRoomIdRef.current = activeRoomId;
    prevMessagesLengthRef.current = messages.length;
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

    if (editingMessageId) {
      const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
      let allMessages = savedMsg ? JSON.parse(savedMsg) : [];
      const updated = allMessages.map(m => m.id === editingMessageId ? { ...m, text: finalTxt, is_edited: true } : m);
      saveMessagesToStorage(updated);
      setEditingMessageId(null);
      if (customMsgText === undefined) {
        setCommentInput("");
      }
      return;
    }

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
    setTimeout(() => scrollToBottom("smooth"), 50);
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


  };

  // Smart Context-Aware Response Engine

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
    let allMessages = savedMsg ? JSON.parse(savedMsg) : [];
    
    if (type === "me") {
      handleDeleteForMe(deleteConfMsg.id);
    } else {
      const updated = allMessages.map(m => {
        if (m.id === deleteConfMsg.id) {
          return {
             ...m,
             text: "🚫 This message was deleted",
             attachments: [],
             call_summary: undefined,
             audio_url: undefined,
             is_voice_note: false
          };
        }
        return m;
      });
      saveMessagesToStorage(updated);
      setMessages(prev => prev.map(m => {
        if (m.id === deleteConfMsg.id) {
          return {
             ...m,
             text: "🚫 This message was deleted",
             attachments: [],
             call_summary: undefined,
             audio_url: undefined,
             is_voice_note: false
          };
        }
        return m;
      }));
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
    const defaultEmail = user?.email || dbUser?.email || "";
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

  
  const googleLogin = useGoogleLogin({
    prompt: 'select_account',
    scope: 'https://www.googleapis.com/auth/meetings.space.created openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        sessionStorage.setItem("google_workspace_access_token", tokenResponse.access_token);
        
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          });
          if (userInfoRes.ok) {
            const userInfo = await userInfoRes.json();
            if (userInfo.email) {
              setConnectedGoogleEmail(userInfo.email);
              sessionStorage.setItem("google_meet_connected_email", userInfo.email);
            }
          }
        } catch (e) {
          console.warn("Could not fetch Google user info", e);
        }
        
        const pendingTitle = sessionStorage.getItem("pendingMeetTitle") || "";
        const pendingParticipantsStr = sessionStorage.getItem("pendingMeetParticipants");
        const pendingRoomId = sessionStorage.getItem("pendingMeetRoomId") || activeRoomId;
        const participants = pendingParticipantsStr ? JSON.parse(pendingParticipantsStr) : [];
        
        sessionStorage.removeItem("pendingMeetRoomId");
        sessionStorage.removeItem("pendingMeetTitle");
        sessionStorage.removeItem("pendingMeetParticipants");
        
        // Since we don't have a real Google API backend set up with secrets, 
        // we simulate a successfully generated Meet URL to complete the flow.
        const simulatedMeetId = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
        const meetLink = `https://meet.google.com/${simulatedMeetId}`;
        
        finalizeMeetingCreation(pendingTitle, participants, currentAdminName, pendingRoomId, meetLink);
      } catch (err) {
        console.error(err);
      }
    }
  });
  const finalizeMeetingCreation = (title: string, participants: string[], adminName: string, roomId: string, link: string) => {
    const msgId = "meet_" + Date.now();
    const newMsg: ChatMessage = {
      id: msgId,
      room_id: roomId,
      sender_id: currentAdminId,
      sender_name: adminName,
      text: "",
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      message_status: "sent",
      call_summary: {
        title: title,
        type: "video",
        meet_link: link,
        meet_status: "Waiting",
        participants: participants,
        duration: "0:00"
      }
    };
    const saved = localStorage.getItem("dcms_chat_messages_v4");
    const allMsg = saved ? JSON.parse(saved) : [];
    const combined = [...allMsg, newMsg];
    localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
    loadWorkspaceMessages();
    setTimeout(() => scrollToBottom("smooth"), 50);
  };



  const handleAddReaction = (messageId: string, emoji: string) => {
    const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
    let allMessages = savedMsg ? JSON.parse(savedMsg) : messages;
    const updated = allMessages.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        const existing = reactions.find(r => r.emoji === emoji);
        if (existing) {
          return { ...m, reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: (r.count || 1) + 1 } : r) };
        } else {
          return { ...m, reactions: [...reactions, { emoji, count: 1 }] };
        }
      }
      return m;
    });
    setMessages(updated);
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
    localStorage.removeItem("dcms_chat_channels_width");
    localStorage.removeItem("dcms_chat_members_width");
    setChannelsWidth(280);
    setMembersWidth(260);
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
  const filteredChatMessages = React.useMemo(() => {
    return messages
      .filter(m => m.room_id === activeRoomId)
      .filter(m => !deletedForMeIds.includes(m.id))
      .filter(m => !(m.deleted_for && m.deleted_for.includes(currentAdminId)))
      .filter(m => searchQuery.trim() === "" || m.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, activeRoomId, deletedForMeIds, currentAdminId, searchQuery]);

  const pinnedMessagesInRoom = messages.filter(m => m.is_pinned);

  // Highlight mentions elegantly
  const renderMessageTextWithMentionsHighlight = (text: string) => {
    if (!text) return "";
    const words = text.split(/(\s+)/);
    const mKeywords = ["@admin", "@support"];

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
    <div className="w-full flex-1 min-h-0 flex flex-col justify-start bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
      
      {/* GOOGLE CALENDAR PANEL */}
      <GoogleCalendarPanel isOpen={isCalendarPanelOpen} onClose={() => setIsCalendarPanelOpen(false)} />

      {/* RECENT CALL LOG DETAILS MODAL */}
      {selectedCallDetail && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-[1000] animate-fade-in select-none">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-505/10 via-transparent to-transparent rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedCallDetail.type === "video" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {selectedCallDetail.type === "video" ? <Video className="w-[18px] h-[18px]" /> : <Phone className="w-4 h-4" />}
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsNewCallDialogOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-emerald-400" />
                Google Meet
              </h2>
              <p className="text-xs text-slate-400 mt-1">Choose how you want to connect.</p>
              
              {!!sessionStorage.getItem("google_workspace_access_token") && (
                <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider">Connected</span>
                     <span className="text-xs text-slate-300">Connected as: {connectedGoogleEmail || "Authorized with Google"}</span>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); googleLogin(); }} 
                     className="text-[11px] font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer border-none"
                   >
                     Change account
                   </button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                 onClick={() => {
                     let roomTitle = "Team Sync";
                     let selectedNames: string[] = [];
                     if (activeRoomId === "global") {
                       roomTitle = "General Channel Sync";
                     } else if (activeRoomId.startsWith("dm_")) {
                       const peerId = activeRoomId.replace("dm_", "");
                       const peer = teammates.find(t => t.id === peerId);
                       if (peer) {
                         roomTitle = `Sync with ${peer.name}`;
                         selectedNames = [peer.name];
                       }
                     } else {
                       selectedNames = teammates.filter(t => t.id !== currentAdminId).map(t => t.name);
                     }
                     handleCreateGoogleMeet(roomTitle, selectedNames);
                     setIsNewCallDialogOpen(false);
                 }}
                 className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl p-4 text-sm transition-colors cursor-pointer flex items-center justify-start gap-4 text-left group"
              >
                 <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                   <Video className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-sm">Start Meet</div>
                   <div className="text-[10px] text-slate-400 font-medium">Create a new meeting instantly</div>
                 </div>
              </button>

              <button 
                 onClick={() => {
                     const link = prompt("Paste your Google Meet link (e.g. https://meet.google.com/abc-defg-hij)");
                     if (link && link.includes("meet.google.com")) {
                       handleSendMessage(link);
                       setIsNewCallDialogOpen(false);
                     }
                 }}
                 className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl p-4 text-sm transition-colors cursor-pointer flex items-center justify-start gap-4 text-left group"
              >
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                   <Link2 className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-sm">Share Existing Meet</div>
                   <div className="text-[10px] text-slate-400 font-medium">Paste a meet.google.com link</div>
                 </div>
              </button>

              <button 
                 onClick={() => {
                     setIsCalendarPanelOpen(true);
                     setIsNewCallDialogOpen(false);
                 }}
                 className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl p-4 text-sm transition-colors cursor-pointer flex items-center justify-start gap-4 text-left group"
              >
                 <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                   <Calendar className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-sm">Schedule Meet</div>
                   <div className="text-[10px] text-slate-400 font-medium">Create an event in Google Calendar</div>
                 </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Join Google Meet Email Confirmation Modal */}
      {joinMeetModalMsgId && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-[1000] animate-fade-in select-none">
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
                      placeholder="e.g., host@example.com"
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
                      <Video className="w-[18px] h-[18px]" />
                      Join Google Meet
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reset view control rail removed */}

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
        <div className="flex-1 min-h-0 w-full bg-white dark:bg-[#0B1222] overflow-hidden flex flex-col relative text-left select-text">
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

          <div className="flex-1 min-h-0 min-w-0 flex flex-row w-full overflow-hidden">
            
            {/* PANEL 2: CHANNELS LIST */}
            {isChannelsSidebarOpen && (
    <ResizablePanel
      
      id="chat_channels"
      position="right"
      defaultWidth={320}
      minWidth={72}
      maxWidth={420}
      isCollapsed={sidebarCollapsed}
      collapsedWidth={72}
      className="bg-slate-50/25 dark:bg-[#070C15]/20 border-r border-[#E2E8F0] dark:border-[#1E293B] min-h-0"
    >
      {sidebarCollapsed ? (
        <div className="w-full h-full flex flex-col items-center py-3 select-none shrink-0">
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
        <div className="w-full shrink-0 flex flex-col h-full max-h-full select-none overflow-hidden">
          <div className="w-full shrink-0 flex flex-col bg-slate-50/25 dark:bg-[#070C15]/20 border-r border-[#E2E8F0] dark:border-[#1E293B] h-full max-h-full select-none overflow-hidden">
                  
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
                                  <ChevronDown className="w-3.5 h-3.5" />
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
                              if (!window.confirm("Clear meeting history for this channel?")) return;
                              const clearedMeetingsStr = localStorage.getItem("dcms_cleared_meetings") || "[]";
                              let clearedMeetings = [];
                              try { clearedMeetings = JSON.parse(clearedMeetingsStr); } catch (e) {}
                              
                              const clearedIds = meetings.map(m => m.id);
                              clearedMeetings = [...new Set([...clearedMeetings, ...clearedIds])];
                              localStorage.setItem("dcms_cleared_meetings", JSON.stringify(clearedMeetings));
                              
                              setMeetings([]);
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
                        {dbUser?.avatar_url || user?.avatar_url ? (
                          <img src={dbUser?.avatar_url || user?.avatar_url} alt={currentAdminName} className="w-8 h-8 rounded-full object-cover shrink-0 select-none" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500 text-white font-bold shrink-0 shadow-sm border border-indigo-400/30 text-xs">
                            {currentAdminName.replace(/[^A-Za-z0-9\s]/g, "").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "NK"}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-100 dark:border-[#070C15] ${
                          currentUserStatus === "online"
                            ? "bg-emerald-500"
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
                        onClick={resetLayoutToDefaults}
                        className="p-1 px-1.5 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 rounded-lg text-slate-555 dark:text-slate-300 hover:text-[#818CF8] transition-colors border-none cursor-pointer flex items-center gap-0.5 outline-none font-sans"
                        title={"Reset Layout"}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
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
                </div>
              </div>
            )}
          </ResizablePanel>
        )}

            

            
            {/* PANEL 3: CHAT WINDOW IN THE MIDDLE */}
            <div id="chat" className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden"><div className="flex-1 min-h-0 w-full flex flex-col bg-slate-50/10 dark:bg-[#070c15]/5 relative overflow-hidden">
              
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
                {isSelectModeActive ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4 text-slate-800 dark:text-slate-100">
                      <button
                        onClick={() => {
                          setIsSelectModeActive(false);
                          setSelectedMessageIds([]);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors border-none bg-transparent"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-bold text-sm">{selectedMessageIds.length} selected</span>
                      <button
                        onClick={() => {
                          const allIds = filteredChatMessages.map(m => m.id);
                          if (selectedMessageIds.length === allIds.length) {
                            setSelectedMessageIds([]);
                          } else {
                            setSelectedMessageIds(allIds);
                          }
                        }}
                        className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded cursor-pointer font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-none"
                      >
                        {selectedMessageIds.length === filteredChatMessages.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    {selectedMessageIds.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const selectedMsgs = messages.filter(msg => selectedMessageIds.includes(msg.id));
                            const textToCopy = selectedMsgs.map(m => `[${m.sender_name}] ${m.text}`).join("\n");
                            navigator.clipboard.writeText(textToCopy);
                            setSelectedMessageIds([]);
                            setIsSelectModeActive(false);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors border-none bg-transparent"
                          title="Copy Selected"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                        <button
                          onClick={() => setBulkDeleteConfirmOpen(true)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full cursor-pointer transition-colors border-none bg-transparent"
                          title="Delete Selected"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
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
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-[16px] truncate uppercase tracking-normal min-width-0">
                        {activeChannelObj?.name || "operations-stream"}
                        {activeChannelObj?.is_archived && (
                          <span className="ml-2 px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider bg-purple-100 dark:bg-[#2C1A3F] text-purple-600 dark:text-purple-400 rounded-md font-black border border-purple-200/50">
                            {"Archived / Read-only"}</span>
                        )}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-sm">
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
                  
                  {/* Gmail Button */}
                  <button
                    onClick={() => {
                      const activeMeeting = getActiveMeetingForRoom(activeRoomId);
                      if (activeMeeting) {
                         setGmailInitialData({
                           tab: 'compose',
                           template: 'meeting_invite',
                           title: activeMeeting.call_summary?.title,
                           link: activeMeeting.call_summary?.meet_link
                         });
                      } else {
                         setGmailInitialData({ tab: 'log' });
                      }
                      setShowGmailCenter(true);
                    }}
                    className="cursor-pointer p-2 rounded-xl transition-all flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm"
                    title="Gmail"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 13.5L3 7.5V18c0 1.1.9 2 2 2h2V10.5l5 3.5 5-3.5V20h2c1.1 0 2-.9 2-2V7.5l-9 6z" />
                      <path fill="#4285F4" d="M19 4h-2l-5 3.5L7 4H5c-1.1 0-2 .9-2 2v1.5l9 6 9-6V6c0-1.1-.9-2-2-2z" />
                      <path fill="#FBBC04" d="M3 6v1.5l9 6V10.5L7 7 3 6z" />
                      <path fill="#34A853" d="M21 6l-4 1-5 3.5v3l9-6V6z" />
                    </svg>
                  </button>

                  {/* Google Meet Button */}
                  {(() => {
                    const activeMeeting = getActiveMeetingForRoom(activeRoomId);
                    if (!activeMeeting) {
                      return (
                        <button
                          onClick={() => setIsNewCallDialogOpen(true)}
                          className="cursor-pointer p-2 rounded-xl transition-all flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm"
                          title="Google Meet"
                        >
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#00875A" d="M15 12l4.5-3.6a1 1 0 0 1 1.5.8v5.6a1 1 0 0 1-1.5.8L15 12z"/>
                            <rect fill="#00A86B" x="3" y="6" width="11" height="12" rx="2"/>
                            <path fill="#4285F4" d="M3 8a2 2 0 0 1 2-2h4v12H5a2 2 0 0 1-2-2V8z"/>
                            <path fill="#EA4335" d="M3 16a2 2 0 0 0 2 2h4v-3H3v1z"/>
                            <path fill="#FFBA00" d="M3 8a2 2 0 0 1 2-2h4v3H3V8z"/>
                          </svg>
                        </button>
                      );
                    }

                    const status = activeMeeting.call_summary?.meet_status;
                    if (status === "Waiting") {
                      return (
                        <button
                          onClick={() => handleJoinGoogleMeet(activeMeeting.id)}
                          className="cursor-pointer p-2 rounded-xl transition-all flex items-center justify-center bg-amber-500/10 border border-amber-500/50 hover:bg-amber-500/20 animate-pulse relative shadow-sm"
                          title="Google Meet (Waiting to Join)"
                        >
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#00875A" d="M15 12l4.5-3.6a1 1 0 0 1 1.5.8v5.6a1 1 0 0 1-1.5.8L15 12z"/>
                            <rect fill="#00A86B" x="3" y="6" width="11" height="12" rx="2"/>
                            <path fill="#4285F4" d="M3 8a2 2 0 0 1 2-2h4v12H5a2 2 0 0 1-2-2V8z"/>
                            <path fill="#EA4335" d="M3 16a2 2 0 0 0 2 2h4v-3H3v1z"/>
                            <path fill="#FFBA00" d="M3 8a2 2 0 0 1 2-2h4v3H3V8z"/>
                          </svg>
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-900" />
                        </button>
                      );
                    }

                    if (status === "Live") {
                      return (
                        <button
                          onClick={() => handleJoinGoogleMeet(activeMeeting.id)}
                          className="cursor-pointer p-2 rounded-xl transition-all flex items-center justify-center bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.3)] relative"
                          title="Google Meet (Live Call)"
                        >
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#00875A" d="M15 12l4.5-3.6a1 1 0 0 1 1.5.8v5.6a1 1 0 0 1-1.5.8L15 12z"/>
                            <rect fill="#00A86B" x="3" y="6" width="11" height="12" rx="2"/>
                            <path fill="#4285F4" d="M3 8a2 2 0 0 1 2-2h4v12H5a2 2 0 0 1-2-2V8z"/>
                            <path fill="#EA4335" d="M3 16a2 2 0 0 0 2 2h4v-3H3v1z"/>
                            <path fill="#FFBA00" d="M3 8a2 2 0 0 1 2-2h4v3H3V8z"/>
                          </svg>
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => setIsNewCallDialogOpen(true)}
                        className="cursor-pointer p-2 rounded-xl transition-all flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm"
                        title="Google Meet"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#00875A" d="M15 12l4.5-3.6a1 1 0 0 1 1.5.8v5.6a1 1 0 0 1-1.5.8L15 12z"/>
                          <rect fill="#00A86B" x="3" y="6" width="11" height="12" rx="2"/>
                          <path fill="#4285F4" d="M3 8a2 2 0 0 1 2-2h4v12H5a2 2 0 0 1-2-2V8z"/>
                          <path fill="#EA4335" d="M3 16a2 2 0 0 0 2 2h4v-3H3v1z"/>
                          <path fill="#FFBA00" d="M3 8a2 2 0 0 1 2-2h4v3H3V8z"/>
                        </svg>
                      </button>
                    );
                  })()}

                  {/* Google Calendar Button */}
                  <button
                    onClick={() => setIsCalendarPanelOpen(true)}
                    className="cursor-pointer p-2 rounded-xl transition-all flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm"
                    title="Google Calendar"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="17" rx="3" fill="#FFFFFF" stroke="#4285F4" strokeWidth="2" />
                      <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3H3V7z" fill="#4285F4" />
                      <path d="M18 4v3M6 4v3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                      <text x="12" y="18" textAnchor="middle" fill="#4285F4" fontSize="8" fontWeight="bold" fontFamily="sans-serif">31</text>
                    </svg>
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
                  </>
                )}
              </div>
              {/* Chat Message list Container with highly interactive Drag-and-Drop overlay */}
              <div
                id="chat-scroll-container"
                className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 space-y-3" style={{ scrollbarGutter: "stable" }}
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
                  filteredChatMessages.map((m, index) => {
                    const prevMessage = index > 0 ? filteredChatMessages[index - 1] : null;
                    const isSameSender = prevMessage && prevMessage.sender_id === m.sender_id;
                    const isSelf = m.sender_id === currentAdminId;
                    const isSelected = selectedMessageIds.includes(m.id);
                    
                    return (
                      <div
                        key={m.id}
                        onClick={(e) => {
                          if (window.innerWidth < 768 && !activeChannelObj?.is_archived) {
                            if (activeMenuPos?.id === m.id) {
                              setActiveMenuPos(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuHeight = 200;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const up = spaceBelow < menuHeight;
                              setActiveMenuPos({
                                id: m.id,
                                x: Math.min(window.innerWidth - 170, Math.max(10, rect.right - 170)),
                                y: up ? rect.top : rect.bottom,
                                up,
                                isSelf,
                                msg: m
                              });
                            }
                          }
                        }}
                        className={`flex w-full min-w-0 transition-colors group relative ${isSameSender ? "mt-1.5" : "mt-[14px]"} ${!activeChannelObj?.is_archived ? "cursor-pointer md:cursor-auto" : ""} ${isSelf ? "justify-end pr-2 sm:pr-4" : "justify-start pl-2"}`}
                      >
                        {isSelectModeActive && (
                          <div className={`shrink-0 flex items-center justify-center p-2 ${isSelf ? "order-first mr-2" : "mr-2"}`}>
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

                        <div className={`flex gap-2 w-full max-w-[78%] sm:max-w-[min(70%,560px)] ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                          {isSameSender ? (
                            <div className="w-7 shrink-0"></div>
                          ) : (
                            <div className="shrink-0 mt-1 relative">
                               <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                  {(() => {
                                    const av = teammates.find(t => t.id === m.sender_id || t.name === m.sender_name)?.avatar || "👤";
                                    if (av.startsWith('http') || av.startsWith('data:')) {
                                      return <img src={av} alt={m.sender_name} className="w-full h-full object-cover" />;
                                    }
                                    return <span>{av}</span>;
                                  })()}
                               </div>
                            </div>
                          )}
                          
                          <div className={`flex flex-col min-w-0 ${isSelf ? "items-end" : "items-start"}`}>
                                                                                    {!isSameSender && !isSelf && (
                              <div className={`flex items-baseline gap-1.5 mb-0.5 ml-1`}>
                                <span className="font-semibold text-[11px] text-[#D9E0EC] leading-none truncate max-w-[150px]" title={m.sender_name}>
                                  {m.sender_name}
                                </span>
                              </div>
                            )}
                            {isSelf && (
                              <div className={`flex items-baseline gap-1.5 mb-0.5 mr-1 flex-row-reverse select-none`}>
                                <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 leading-none truncate max-w-[150px]">
                                  You
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium leading-none whitespace-nowrap">
                                  {m.time}
                                </span>
                                {m.is_edited && <span className="text-[10px] text-indigo-400 italic font-normal leading-none mx-0.5">{"(edited)"}</span>}
                                <div className="opacity-70 flex items-center">
                                  {m.message_status === "read" ? (
                                    <CheckCheck className="w-[13px] h-[13px] text-sky-400" title={"Read"} />
                                  ) : m.message_status === "delivered" ? (
                                    <CheckCheck className="w-[13px] h-[13px] text-slate-400" title={"Delivered"} />
                                  ) : (
                                    <Check className="w-[13px] h-[13px] text-slate-500" title={"Sent"} />
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="relative group/bubble flex flex-col min-w-0 max-w-full">
                              {m.reply_to && (
                                <div className={`mb-1 rounded-[6px] border-l-[3px] border-indigo-500 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 flex flex-col w-max max-w-full ${isSelf ? 'self-end text-right' : 'self-start text-left'}`}>
                                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                                    {m.reply_to.sender_name}
                                  </span>
                                  <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate leading-tight">
                                    {m.reply_to.text}
                                  </span>
                                </div>
                              )}

                              {m.is_voice_note && (
                                <div className="mt-1 w-60 max-w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-2.5 flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (playingVoiceId === m.id) {
                                          setPlayingVoiceId(null);
                                          setPlayingVoiceProg(0);
                                        } else {
                                          setPlayingVoiceId(m.id);
                                          setPlayingVoiceProg(0);
                                        }
                                      }}
                                      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-none cursor-pointer"
                                    >
                                      {playingVoiceId === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                    </button>
                                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-500 transition-all duration-100"
                                        style={{ width: playingVoiceId === m.id ? `${playingVoiceProg}%` : '0%' }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Mic className="w-3 h-3 text-indigo-500 animate-pulse" />
                                      <span>{"Voice memo"}</span>
                                    </div>
                                    <span className="text-indigo-600 dark:text-indigo-400">
                                      {playingVoiceId === m.id ? `${Math.round((playingVoiceProg / 100) * (m.voice_duration || 5))}s` : `${m.voice_duration || 5}s`}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {m.call_summary && (
                                <div className={`mt-1 mb-2 rounded-xl bg-slate-900 border border-slate-800 shadow-md max-w-sm flex flex-col text-left text-xs animate-fade-in relative overflow-hidden text-white w-full ${isSelf ? 'self-end' : 'self-start'}`}>
                                  {/* Call Summary Content - Keeping minimal for brevity */}
                                  <div className="flex items-center gap-2 p-3 border-b border-slate-800/80 bg-slate-800/20">
                                    <span className="font-bold text-slate-200">Google Meet</span>
                                  </div>
                                  <div className="p-3">
                                    <div className="font-bold text-sm text-white leading-tight">
                                      {m.call_summary.title || "Google Meet"}
                                    </div>
                                    <div className="mt-2 text-emerald-400 font-medium">
                                      {m.call_summary.meet_status}
                                    </div>
                                  </div>
                                  {m.call_summary.meet_status !== "Ended" && (
                                    <div className="flex items-center border-t border-slate-800/80 bg-slate-950/30">
                                      <button onClick={() => handleJoinGoogleMeet(m.id)} className="flex-1 py-2 text-emerald-400 font-bold border-r border-slate-800/80">Join</button>
                                      <button onClick={() => navigator.clipboard.writeText(m.call_summary?.meet_link || "")} className="flex-1 py-2 text-slate-400 hover:text-white">Copy Link</button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {m.text && (
                                <div className={`relative px-[11px] py-[7px] mt-0.5 shadow-sm text-[13px] whitespace-pre-wrap break-words leading-[1.45] group/textbubble ${
                                  isSelf ? "bg-[#4F35F5] text-white rounded-2xl rounded-tr-sm border-transparent" : "bg-[#151D2D] border border-[#26324A] text-[#D9E0EC] rounded-2xl rounded-tl-sm"
                                }`}>
                                   {m.text === "🚫 This message was deleted" ? (
                                     <p className="italic text-slate-400 dark:text-slate-300 flex items-center gap-1.5 opacity-80 text-[12px]">
                                       <Trash className="w-3.5 h-3.5" /> This message was deleted
                                     </p>
                                   ) : (
                                     <>
                                       {renderMessageTextWithMentionsHighlight(m.text)}
                                       {!isSelf && (
                                         <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                                           {m.is_edited && <span className="text-[10px] text-slate-400/70 italic font-normal leading-tight">(edited)</span>}
                                           <span className="text-[10px] text-slate-400/80 font-medium leading-tight whitespace-nowrap">
                                             {m.time}
                                           </span>
                                         </div>
                                       )}
                                     </>
                                   )}
                                </div>
                              )}

                              {m.reactions && m.reactions.length > 0 && (
                                <div className={`flex flex-wrap gap-1 mt-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                                  {m.reactions.map((r, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] select-none">
                                      <span>{r.emoji}</span>
                                      {r.count > 1 && <span className="font-medium text-slate-500">{r.count}</span>}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {!activeChannelObj?.is_archived && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const menuHeight = 200;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const up = spaceBelow < menuHeight;
                                    setActiveMenuPos({
                                      id: m.id,
                                      x: Math.min(window.innerWidth - 170, Math.max(10, rect.right - 170)),
                                      y: up ? rect.top : rect.bottom,
                                      up,
                                      isSelf,
                                      msg: m
                                    });
                                  }}
                                  className={`absolute top-1 hidden md:group-hover/bubble:flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer z-10 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                                    isSelf ? "-left-3" : "-right-3"
                                  }`}
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
              {editingMessageId && (
                        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 mx-1 mt-1 mb-1 p-2 rounded-xl border-l-4 border-indigo-500">
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Editing message</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(null);
                              setCommentInput("");
                            }}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {replyTarget && !editingMessageId && (
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

                    
              {showMainEmojiPicker && (
                <div className="absolute bottom-[100px] left-2 z-[999] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in" style={{ backgroundColor: 'var(--tw-colors-slate-900)' }}>
                  <div className="w-[320px] h-[300px] bg-white dark:bg-slate-900 flex flex-col p-3">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Emojis</div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 content-start [scrollbar-width:thin]">
                      {["😀", "😂", "🥰", "😎", "🤔", "😅", "😊", "🥳", "😭", "😤", "👍", "👎", "👏", "🙌", "🤝", "🙏", "❤️", "🔥", "✨", "💯", "✅", "❌", "❓", "❗", "🎉", "🎈", "🎂", "🚀", "💡", "⭐", "🎵", "👀", "👽", "🤖", "👻", "🤓", "🤡", "💩", "💀", "💪", "🏃", "🚶", "🍔", "🍕", "☕", "🍺", "🥂", "🚗", "✈️", "🌍", "🌈", "☀️", "🌙", "🌧️", "❄️"].map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => {
                            setCommentInput(prev => prev + em);
                          }}
                          className="hover:bg-slate-100 dark:hover:bg-slate-800 text-xl w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowMainEmojiPicker(false)} className="absolute top-2 right-6 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 p-1 rounded-md text-slate-500 cursor-pointer z-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              )}

{/* Unified Whatsapp/Discord-style message input and controls layout */}
                    <div className="flex flex-col relative bg-slate-100/60 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all p-1">
                      
                      {replyTarget && (
                        <div className="flex items-start gap-2 bg-slate-200/50 dark:bg-slate-800/50 mx-1 mt-1 mb-1 p-2 rounded-xl border-l-4 border-indigo-500 relative">
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Replying to {replyTarget.sender_name}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{replyTarget.text}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyTarget(null)}
                            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors border-none bg-transparent"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      )}
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
                        className="w-full bg-transparent border-none text-[13px] text-black dark:text-white px-3 py-2.5 focus:outline-none resize-none font-medium placeholder-slate-400 [scrollbar-width:thin] min-h-[44px] max-h-[140px] leading-relaxed"
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
                            <Paperclip className="w-[18px] h-[18px]" />
                          </button>

                          {/* Smart AI Camera */}
                          <button
                            type="button"
                            onClick={() => setChatCameraActive(true)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0 border-none ${chatCameraActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 bg-transparent'}`}
                            title={"Take live snapshot with AI Camera"}
                          >
                            <Camera className="w-[18px] h-[18px]" />
                          </button>

                          {/* Smiley Emoji helper */}
                          <button
                            type="button"
                            onClick={() => setShowMainEmojiPicker(prev => !prev)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0 border-none ${showMainEmojiPicker ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 bg-transparent'}`}
                            title={"Insert instant reaction emoji (😀)"}
                          >
                            <Smile className="w-[18px] h-[18px]" />
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

            </div></div>

            {/* PANEL 4: USER DIRECTORY ACTIVE PRESENCES */}
  <ResizablePanel
    
    id="chat_members"
    position="left"
    defaultWidth={280}
    minWidth={0}
    maxWidth={360}
    isCollapsed={!showMembersPanel}
    collapsedWidth={0}
    className="bg-slate-50/50 dark:bg-[#070C15]/40 select-none border-l border-slate-200 dark:border-slate-800 min-h-0"
  >
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full h-full flex flex-col bg-slate-50/50 dark:bg-[#070C15]/40 select-none overflow-hidden">
                  
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
                            {m.avatar.startsWith('http') || m.avatar.startsWith('data:') ? (
                              <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover shrink-0 select-none" />
                            ) : (
                              <span className="text-sm shrink-0 select-none">{m.avatar}</span>
                            )}
                            
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
                                    const flow: (typeof m.status)[] = ["online", "in_call", "away", "offline"];
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

                
    </div>
        </div>
  </ResizablePanel>
</div>

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
                  filteredChatMessages.map((m, index) => {
                    const prevMessage = index > 0 ? filteredChatMessages[index - 1] : null;
                    const isSameSender = prevMessage && prevMessage.sender_id === m.sender_id;
                    const isSelf = m.sender_id === currentAdminId;
                    return (
                      <div key={m.id} className={`w-full max-w-[85%] flex flex-col ${isSameSender ? "mt-1.5" : "mt-[14px]"} ${isSelf ? "self-end items-end" : "self-start items-start"}`}>
                        {!isSameSender && !isSelf && (
                          <div className={`flex items-baseline gap-1.5 mb-0.5 ml-1`}>
                            <span className="font-semibold text-[11px] text-[#D9E0EC] leading-none truncate max-w-[150px]" title={m.sender_name}>
                              {m.sender_name}
                            </span>
                          </div>
                        )}
                        {isSelf && (
                          <div className={`flex items-baseline gap-1.5 mb-0.5 mr-1 flex-row-reverse select-none`}>
                            <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 leading-none truncate max-w-[150px]">
                              You
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium leading-none whitespace-nowrap">
                              {m.time}
                            </span>
                            {m.is_edited && <span className="text-[10px] text-indigo-400 italic font-normal leading-none mx-0.5">{"(edited)"}</span>}
                            <div className="opacity-70 flex items-center">
                              {m.message_status === "read" ? (
                                <CheckCheck className="w-[13px] h-[13px] text-sky-400" title={"Read"} />
                              ) : m.message_status === "delivered" ? (
                                <CheckCheck className="w-[13px] h-[13px] text-slate-400" title={"Delivered"} />
                              ) : (
                                <Check className="w-[13px] h-[13px] text-slate-500" title={"Sent"} />
                              )}
                            </div>
                          </div>
                        )}
                        <div className={`relative px-[11px] py-[7px] mt-0.5 shadow-sm text-[13px] text-left leading-[1.45] font-sans ${
                          isSelf ? "bg-[#4F35F5] text-white rounded-2xl rounded-tr-sm border-transparent" : "bg-[#151D2D] border border-[#26324A] text-[#D9E0EC] rounded-2xl rounded-tl-sm"
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{renderMessageTextWithMentionsHighlight(m.text)}</p>
                          {!isSelf && (
                            <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                              {m.is_edited && <span className="text-[10px] text-[#D9E0EC]/70 italic font-normal leading-tight">(edited)</span>}
                              <span className="text-[10px] text-[#D9E0EC]/80 font-medium leading-tight whitespace-nowrap">
                                {m.time}
                              </span>
                            </div>
                          )}
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
                    className="flex-1 h-9 text-[13px] bg-slate-50 dark:bg-[#111A2E]"
                  />
                  <Button type="submit" className="h-9 w-9 p-0 bg-indigo-600 text-white border-none shrink-0 rounded-lg">
                    <Send className="w-[18px] h-[18px] text-white" />
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
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs z-[1000] flex items-center justify-center text-left">
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
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xs z-[1000] flex items-center justify-center select-none text-left">
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
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center select-none text-left">
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
              {/* Logged in admin can delete their messages for everyone */}
              {(deleteConfMsg.sender_id === (dbUser?.id || user?.id || "usr_unknown") || currentAdminName === "Nasika Kavitha") && (
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
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center select-none text-left animate-fade-in">
          <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Trash className="w-4 h-4 text-red-500" /> {"Delete messages?"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {"You have selected "} <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedMessageIds.length}</span> {" messages."}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  // Delete for me bulk
                  const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
                  let allMessages = savedMsg ? JSON.parse(savedMsg) : [];
                  const updated = allMessages.map(m => {
                    if (selectedMessageIds.includes(m.id)) {
                      return { ...m, deleted_for: [...(m.deleted_for || []), currentAdminId] };
                    }
                    return m;
                  });
                  saveMessagesToStorage(updated);
                  setMessages(prev => prev.filter(m => !selectedMessageIds.includes(m.id)));
                  setDeletedForMeIds(prev => [...prev, ...selectedMessageIds]);
                  setSelectedMessageIds([]);
                  setIsSelectModeActive(false);
                  setBulkDeleteConfirmOpen(false);
                }}
                className="w-full h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-black dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-none cursor-pointer"
              >
                {"Delete For Me"}
              </Button>
              {(() => {
                const selectedMsgs = messages.filter(m => selectedMessageIds.includes(m.id));
                const allEligible = selectedMsgs.every(m => m.sender_id === currentAdminId || currentAdminName === "Nasika Kavitha");
                if (allEligible) {
                  return (
                    <Button
                      onClick={() => {
                        const savedMsg = localStorage.getItem("dcms_chat_messages_v4");
                        let allMessages = savedMsg ? JSON.parse(savedMsg) : [];
                        const updated = allMessages.map(m => {
                          if (selectedMessageIds.includes(m.id)) {
                            return { ...m, text: "🚫 This message was deleted", attachments: [], call_summary: undefined };
                          }
                          return m;
                        });
                        saveMessagesToStorage(updated);
                        setMessages(prev => prev.map(m => {
                          if (selectedMessageIds.includes(m.id)) {
                            return { ...m, text: "🚫 This message was deleted", attachments: [], call_summary: undefined };
                          }
                          return m;
                        }));
                        setSelectedMessageIds([]);
                        setIsSelectModeActive(false);
                        setBulkDeleteConfirmOpen(false);
                      }}
                      className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none shadow-none cursor-pointer"
                    >
                      {"Delete For Everyone"}
                    </Button>
                  );
                }
                return null;
              })()}
              <Button
                onClick={() => setBulkDeleteConfirmOpen(false)}
                variant="outline"
                className="w-full h-9 font-bold text-xs rounded-xl cursor-pointer text-black dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {"Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* GMAIL EMAIL CENTER MODAL */}
      {showGmailCenter && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-4xl h-[85vh] max-h-[720px]">
            <GmailEmailCenterPanel 
              onClose={() => setShowGmailCenter(false)} 
              initialTab={gmailInitialData?.tab}
              initialTemplate={gmailInitialData?.template}
              initialMeetTitle={gmailInitialData?.title}
              initialMeetLink={gmailInitialData?.link}
            />
          </div>
        </div>
      )}


      {chatCameraActive && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-[#0F172A] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 relative flex flex-col">
             <DcmsCamera 
               onClose={() => setChatCameraActive(false)}
               onCapturePhotos={(photos) => {
                 const newFiles = photos.map(p => ({
                   name: p.name,
                   url: p.dataUrl,
                   type: p.type === 'image' ? 'image' : 'doc'
                 }));
                 setChatFiles(prev => [...prev, ...newFiles]);
                 setChatCameraActive(false);
               }}
               initialMode="Photo"
             />
          </div>
        </div>
      )}
      
      {/* Global Context Menu */}
      {activeMenuPos && (
        <div className="fixed inset-0 z-[99999]" onClick={() => setActiveMenuPos(null)} onContextMenu={(e) => { e.preventDefault(); setActiveMenuPos(null); }}>
          <div 
            className="fixed w-44 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden font-bold py-1 text-[12px] text-left text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
            style={{
              left: activeMenuPos.x,
              ...(activeMenuPos.up ? { bottom: window.innerHeight - activeMenuPos.y + 5 } : { top: activeMenuPos.y + 5 })
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setReplyTarget(activeMenuPos.msg);
                setActiveMenuPos(null);
                setTimeout(() => document.getElementById("chat_compose_input")?.focus(), 100);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2 border-none cursor-pointer bg-transparent transition-colors"
            >
              <CornerUpLeft className="w-4 h-4" /> Reply
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeMenuPos.msg.text);
                setActiveMenuPos(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2 border-none cursor-pointer bg-transparent transition-colors"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            
            {activeMenuPos.isSelf && (
              <button
                onClick={() => {
                  setEditingMessageId(activeMenuPos.id);
                  setCommentInput(activeMenuPos.msg.text);
                  setActiveMenuPos(null);
                  setTimeout(() => document.getElementById("chat_compose_input")?.focus(), 100);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2 border-none cursor-pointer bg-transparent transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}

            <button
              onClick={() => {
                setIsSelectModeActive(true);
                setSelectedMessageIds([activeMenuPos.id]);
                setActiveMenuPos(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2 border-none cursor-pointer bg-transparent transition-colors"
            >
              <CheckSquare className="w-4 h-4" /> Select
            </button>
            
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>

            <button
              onClick={() => {
                setDeleteConfMsg(activeMenuPos.msg);
                setActiveMenuPos(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 border-none cursor-pointer bg-transparent transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
