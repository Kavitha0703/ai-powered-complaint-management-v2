const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const newTop = `import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext.tsx";
import { getAdminInvites, HARDCODED_ADMINS } from "./AdminManagement.tsx";
import { Button } from "../components/ui/button.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import { Input } from "../components/ui/input.tsx";
import DcmsCamera from "../components/DcmsCamera.tsx";
import {
  Heart, HelpCircle, LayoutDashboard, MessageCircle, PlayCircle, Plus, Search, Send, Settings, Smile, Phone, Video,
  X, AlertCircle, Camera, Check, ChevronDown, ChevronRight, Hash, LogOut, MoreHorizontal, MoreVertical,
  Paperclip, Users, Volume2, VolumeX, Mic, MicOff, Server, Terminal, Share, MousePointerSquare, FileText, Image
} from "lucide-react";
import { createGoogleMeet, googleSignIn } from "../lib/GoogleMeetHelper.ts";

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
    meet_link?: string;
    meet_status?: "Scheduled" | "Live" | "Ended" | "Cancelled";
    type: "voice" | "video";
    duration: string;
    participants: string[];
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

  const [activeRoomId, setActiveRoomId] = useState<string | null>("ch_general");
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

  const [teammates, setTeammates] = useState<Teammate[]>(() => {
    const invites = getAdminInvites().filter(i => i.status === "Active");
    const allUsers = [
      ...HARDCODED_ADMINS.map(a => ({ id: a.id, name: a.name || a.email.split('@')[0], role: a.role, avatar: "👤", status: a.is_online ? "online" : "offline" })),
      ...invites.map(i => ({ id: "usr_" + i.id, name: i.name || i.email.split('@')[0], role: i.role, avatar: "👤", status: "offline" }))
    ];
    const currentAdminIdFallback = dbUser?.id || "usr_kavitha";
    return allUsers.filter(u => u.id !== currentAdminIdFallback && !u.id.includes(currentAdminIdFallback) && !currentAdminIdFallback.includes(u.id)) as Teammate[];
  });

  const [isNewCallDialogOpen, setIsNewCallDialogOpen] = useState<boolean>(false);
  const [newCallType, setNewCallType] = useState<"voice" | "video">("voice");
  const [newCallMode, setNewCallMode] = useState<"direct" | "multi" | "group">("group");
  const [selectedParticipantsForNewCall, setSelectedParticipantsForNewCall] = useState<string[]>([]);
  
  const [expandedCallDetailsMessageIds, setExpandedCallDetailsMessageIds] = useState<string[]>([]);
  const [selectedTeammatesForCall, setSelectedTeammatesForCall] = useState<string[]>([]);
  const [mobileActiveTab, setMobileActiveTab] = useState<"chat" | "users">("chat");
  const [showNewChatPanel, setShowNewChatPanel] = useState<boolean>(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceSeconds, setVoiceSeconds] = useState<number>(0);
  
  const handleCreateGoogleMeet = async (title: string, participants: string[]) => {
      try {
          let meetLink = await createGoogleMeet(title);
          if (!meetLink) {
               const result = await googleSignIn();
               if (result) {
                   meetLink = await createGoogleMeet(title);
               }
          }
          if (meetLink) {
              const newMsg: ChatMessage = {
                  id: "msg_" + Date.now(),
                  room_id: activeRoomId || "ch_general",
                  sender_id: currentAdminId,
                  sender_name: currentAdminName,
                  text: \`Scheduled a Google Meet: \${title}\`,
                  created_at: new Date().toISOString(),
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  call_summary: {
                      meet_link: meetLink,
                      meet_status: "Scheduled",
                      type: "video",
                      duration: "00:00",
                      participants: participants
                  }
              };
              setMessages(prev => [...prev, newMsg]);
          }
      } catch (e) {
          console.error(e);
      }
  };
  
`;

content = newTop + content;
fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
