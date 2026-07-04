import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.ts";
import { useAuth } from "../lib/AuthContext.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select.tsx";
import { Input } from "../../components/ui/input.tsx";
import { MediaGallery } from "./MediaGallery.tsx";
import { SupportAttachment } from "../types";
import DcmsCamera from "./DcmsCamera.tsx";
import { 
  Sparkles, ClipboardList, CheckCircle, Trash2, ArrowLeft, Save, 
  MessageSquare, UserPlus, Smile, Reply, Edit2, CornerDownRight, 
  Paperclip, Send, Check, CheckCheck, X, Camera, Image as ImageIcon,
  User, Clock, Shield, HelpCircle, FileText,
  Users, Star, Activity
} from "lucide-react";

interface RemediationWorkspaceProps {
  ticket: any;
  onBack: () => void;
  onStatusUpdated: (ticketId: any, status: string) => void;
  parseTicketDescription: (desc: string) => any;
  getSeverityColor: (severity: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

interface TeamComment {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  time: string;
  reply_to?: {
    sender_name: string;
    text: string;
  } | null;
  reactions?: Record<string, string[]>; // emoji -> array of sender names
  attachments?: Array<{ name: string; url: string; type: string }>;
  is_edited?: boolean;
  is_deleted_for_everyone?: boolean;
  hidden_for?: string[];
  thread_id?: string;
}

interface DiscussionThread {
  id: string;
  ticket_id: string;
  title: string;
  is_archived: boolean;
  created_at: string;
}

interface TicketAssignment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  role: string;
  assigned_by: string;
  created_at: string;
}

interface TicketActivity {
  id: string;
  ticket_id: string;
  text: string;
  created_at: string;
  time: string;
}

const AVAILABLE_ADMINS = [
  { id: "Kavitha", name: "Kavitha", avatar: "👩‍💼", defaultRole: "Lead Investigator" },
  { id: "Arun", name: "Arun", avatar: "👨‍💻", defaultRole: "Support Engineer" },
  { id: "Priya", name: "Priya", avatar: "👩‍💻", defaultRole: "Support Engineer" },
  { id: "Rahul", name: "Rahul", avatar: "👨‍💼", defaultRole: "Observer" }
];

export function RemediationWorkspace({
  ticket,
  onBack,
  onStatusUpdated,
  parseTicketDescription,
  getSeverityColor,
  getStatusBadge
}: RemediationWorkspaceProps) {
    
  const { dbUser } = useAuth();
  
  // Current admin details
  const currentAdminName = dbUser?.name || "Kavitha";
  const currentAdminId = dbUser?.id || "usr_kavitha";

  // General States
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [status, setStatus] = useState<string>(ticket.status || 'Pending');
  const [assignedTo, setAssignedTo] = useState<string>('');
  
  // Multiple admin assignments & timeline states
  const [assignments, setAssignments] = useState<TicketAssignment[]>([]);
  const [leadAssignee, setLeadAssignee] = useState<string>('');
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [showAddMemberPanel, setShowAddMemberPanel] = useState<boolean>(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [activeSpeaker, setActiveSpeaker] = useState<{id: string, name: string}>({ id: dbUser?.id || "usr_kavitha", name: dbUser?.name || "Kavitha" });
  const [deleteDialogTarget, setDeleteDialogTarget] = useState<TeamComment | null>(null);

  // Permissions Helpers
  const isLeadAssignee = leadAssignee === activeSpeaker.id;
  const isSystemOwner = activeSpeaker.id === "usr_kavitha"; // Triage Supervisor/System Owner
  const canManageMembers = isLeadAssignee || isSystemOwner;

  // Private Team Discussion states
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [comments, setComments] = useState<TeamComment[]>([]);
  const [replyTarget, setReplyTarget] = useState<TeamComment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState<string>('');
  const [chatFiles, setChatFiles] = useState<Array<{ name: string; url: string; type: string }>>([]);
  
  // Simulated Typing indicator state
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // commentId
  
  // UI states
  const [loadingImprove, setLoadingImprove] = useState<boolean>(false);
  const [improvingStatus, setImprovingStatus] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [proofAttachments, setProofAttachments] = useState<SupportAttachment[]>([]);
  const [liveCameraActive, setLiveCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Sync ticket specifics on load
  useEffect(() => {
    stopLiveCamera();
    setStatus(ticket.status || 'Pending');
    setReplyTarget(null);
    setEditingCommentId(null);
    setCommentInput('');
    setChatFiles([]);
    setActiveSpeaker({ id: dbUser?.id || "usr_kavitha", name: dbUser?.name || "Kavitha" });

    // Load saved resolution note if exists
    const notesStr = localStorage.getItem("dcms_ticket_resolution_notes_v1");
    if (notesStr) {
      const notesMap = JSON.parse(notesStr);
      setResolutionNote(notesMap[ticket.id] || '');
    } else {
      setResolutionNote('');
    }

    // Load assignment state
    const savedAssignments = localStorage.getItem("dcms_ticket_assignments_v1");
    const assignmentsMap = savedAssignments ? JSON.parse(savedAssignments) : {};
    setAssignedTo(assignmentsMap[ticket.id] || '');

    // Load Resolution Proof attachments
    const proofSaved = localStorage.getItem(`dcms_ticket_after_attachments_${ticket.id}`);
    if (proofSaved) {
      try {
        setProofAttachments(JSON.parse(proofSaved));
      } catch (e) {
        setProofAttachments([]);
      }
    } else {
      setProofAttachments([]);
    }

    // Synchronize chat discussion data
    loadComments();

    // Multiple assignments loader
    const loadAssignments = () => {
      const asSaved = localStorage.getItem("dcms_ticket_assignments_v2");
      const asMap = asSaved ? JSON.parse(asSaved) : {};
      let ticketAs = asMap[ticket.id];

      if (!ticketAs || ticketAs.length === 0) {
        const oldSaved = localStorage.getItem("dcms_ticket_assignments_v1");
        const oldMap = oldSaved ? JSON.parse(oldSaved) : {};
        const oldAssignee = oldMap[ticket.id] || "Kavitha";
        
        ticketAs = [{
          id: "as_" + Date.now(),
          ticket_id: ticket.id,
          user_id: oldAssignee === "Unassigned" ? "Kavitha" : (oldAssignee === "Network Team" ? "Arun" : oldAssignee === "Software Team" ? "Priya" : oldAssignee),
          user_name: oldAssignee === "Arun" ? "Arun" : oldAssignee === "Priya" ? "Priya" : oldAssignee === "Rahul" ? "Rahul" : "Kavitha",
          role: "Lead Investigator",
          assigned_by: "System",
          created_at: new Date().toISOString()
        }];
        asMap[ticket.id] = ticketAs;
        localStorage.setItem("dcms_ticket_assignments_v2", JSON.stringify(asMap));
      }
      setAssignments(ticketAs);

      // Load lead assignee
      const leadSaved = localStorage.getItem("dcms_ticket_lead_assignee_v1");
      const leadMap = leadSaved ? JSON.parse(leadSaved) : {};
      let leadId = leadMap[ticket.id];
      if (!leadId) {
        leadId = ticketAs[0]?.user_id || "Kavitha";
        leadMap[ticket.id] = leadId;
        localStorage.setItem("dcms_ticket_lead_assignee_v1", JSON.stringify(leadMap));
      }
      setLeadAssignee(leadId);
    };

    const loadActivities = () => {
      const actSaved = localStorage.getItem("dcms_ticket_activities_v1");
      const actMap = actSaved ? JSON.parse(actSaved) : {};
      let ticketAct = actMap[ticket.id] || [];

      if (ticketAct.length === 0) {
        const createdDate = new Date(ticket.created_at || Date.now());
        const time1 = new Date(createdDate.getTime() + 5 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        ticketAct = [
          {
            id: "act_1",
            ticket_id: ticket.id,
            text: `🟢 Incident registered by employee ${ticket.employee_name || 'System'}`,
            created_at: new Date(createdDate.getTime()).toISOString(),
            time: new Date(createdDate.getTime()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: "act_2",
            ticket_id: ticket.id,
            text: `👥 Kavitha assigned herself as Lead Investigator`,
            created_at: new Date(createdDate.getTime() + 5 * 60000).toISOString(),
            time: time1
          }
        ];
        
        if (ticket.status === "In Progress" || ticket.status === "Resolved") {
          const time2 = new Date(createdDate.getTime() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          ticketAct.push({
            id: "act_3",
            ticket_id: ticket.id,
            text: `🔧 Issue marked In Progress by Kavitha`,
            created_at: new Date(createdDate.getTime() + 15 * 60000).toISOString(),
            time: time2
          });
        }
        if (ticket.status === "Resolved") {
          const time3 = new Date(createdDate.getTime() + 60 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          ticketAct.push({
            id: "act_4",
            ticket_id: ticket.id,
            text: `🏁 Issue marked Resolved by Kavitha`,
            created_at: new Date(createdDate.getTime() + 60 * 60000).toISOString(),
            time: time3
          });
        }
        
        actMap[ticket.id] = ticketAct;
        localStorage.setItem("dcms_ticket_activities_v1", JSON.stringify(actMap));
      }
      ticketAct.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setActivities(ticketAct);
    };

    loadAssignments();
    loadActivities();
  }, [ticket.id]);

  const loadThreadsAndComments = () => {
    const savedThreadsStr = localStorage.getItem("dcms_ticket_chat_threads_v1");
    let allThreads: DiscussionThread[] = savedThreadsStr ? JSON.parse(savedThreadsStr) : [];
    let ticketThreads = allThreads.filter((t: any) => t.ticket_id === ticket.id);
    
    if (ticketThreads.length === 0) {
      const defaultThread: DiscussionThread = {
        id: "thread_default_" + ticket.id + "_" + Date.now(),
        ticket_id: ticket.id,
        title: "Triage Investigation",
        is_archived: false,
        created_at: new Date().toISOString()
      };
      allThreads.push(defaultThread);
      localStorage.setItem("dcms_ticket_chat_threads_v1", JSON.stringify(allThreads));
      ticketThreads = [defaultThread];
    }
    
    setThreads(ticketThreads);
    
    let activeId = activeThreadId;
    if (!activeId || !ticketThreads.some((t: any) => t.id === activeId)) {
      const nonArchived = ticketThreads.find((t: any) => !t.is_archived);
      activeId = nonArchived ? nonArchived.id : ticketThreads[ticketThreads.length - 1].id;
      setActiveThreadId(activeId);
    }
    
    const saved = localStorage.getItem("dcms_ticket_comments_v2_team");
    const allComments = saved ? JSON.parse(saved) : [];
    let ticketComments = allComments.filter((c: any) => c.ticket_id === ticket.id);
    
    const defaultThreadObj = ticketThreads[0];
    ticketComments = ticketComments.map((c: any) => {
      if (!c.thread_id) {
        return { ...c, thread_id: defaultThreadObj.id };
      }
      return c;
    });
    
    ticketComments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setComments(ticketComments);
    setTimeout(() => scrollToBottom(), 50);
  };

  const loadComments = () => {
    loadThreadsAndComments();
  };

  const saveAllComments = (newCommentsList: TeamComment[]) => {
    const saved = localStorage.getItem("dcms_ticket_comments_v2_team");
    const allComments = saved ? JSON.parse(saved) : [];
    const otherTicketsComments = allComments.filter((c: any) => c.ticket_id !== ticket.id);
    const combined = [...otherTicketsComments, ...newCommentsList];
    localStorage.setItem("dcms_ticket_comments_v2_team", JSON.stringify(combined));
    setComments(newCommentsList);
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleStartNewThread = () => {
    if (!canManageMembers) {
      alert("🔒 Permission Denied: Only the Lead Assignee or System Owner can start a new discussion thread.");
      return;
    }

    const title = prompt("Enter a descriptive title for the new thread:", `Post-Fix Verification #${threads.length + 1}`);
    if (!title) return;
    
    const newThread: DiscussionThread = {
      id: "thread_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      ticket_id: ticket.id,
      title: title,
      is_archived: false,
      created_at: new Date().toISOString()
    };
    
    const savedThreadsStr = localStorage.getItem("dcms_ticket_chat_threads_v1") || "[]";
    const allThreads = JSON.parse(savedThreadsStr);
    allThreads.push(newThread);
    localStorage.setItem("dcms_ticket_chat_threads_v1", JSON.stringify(allThreads));
    
    const systemMsg: TeamComment = {
      id: "thread_sys_" + Date.now(),
      ticket_id: ticket.id,
      thread_id: newThread.id,
      sender_id: "system",
      sender_name: "System Dispatcher",
      text: `🔄 Start New Discussion Thread: "${title}" created by ${activeSpeaker.name}.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const savedCommentsStr = localStorage.getItem("dcms_ticket_comments_v2_team") || "[]";
    const allComments = JSON.parse(savedCommentsStr);
    allComments.push(systemMsg);
    localStorage.setItem("dcms_ticket_comments_v2_team", JSON.stringify(allComments));
    
    addTimelineActivity(`🔄 Started discussion thread: ${title}`);
    
    setActiveThreadId(newThread.id);
    // Reload state directly
    setTimeout(() => loadThreadsAndComments(), 50);
  };

  const handleArchiveThread = () => {
    if (!canManageMembers) {
      alert("🔒 Permission Denied: Only the Lead Assignee or System Owner can archive this discussion.");
      return;
    }

    if (!activeThreadId) return;
    const currentThread = threads.find(t => t.id === activeThreadId);
    if (!currentThread) return;
    
    if (currentThread.is_archived) {
      alert("This thread is already archived.");
      return;
    }
    
    if (!confirm(`Are you sure you want to archive the current discussion thread "${currentThread.title}"? This restricts modifications but retains view history.`)) {
      return;
    }
    
    const savedThreadsStr = localStorage.getItem("dcms_ticket_chat_threads_v1") || "[]";
    const allThreads = JSON.parse(savedThreadsStr).map((t: any) => {
      if (t.id === activeThreadId) {
        return { ...t, is_archived: true };
      }
      return t;
    });
    localStorage.setItem("dcms_ticket_chat_threads_v1", JSON.stringify(allThreads));
    
    const systemMsg: TeamComment = {
      id: "thread_sys_arch_" + Date.now(),
      ticket_id: ticket.id,
      thread_id: activeThreadId,
      sender_id: "system",
      sender_name: "System Dispatcher",
      text: `📦 Thread Archived: Discussion thread "${currentThread.title}" was archived by ${activeSpeaker.name}.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const savedCommentsStr = localStorage.getItem("dcms_ticket_comments_v2_team") || "[]";
    const allComments = JSON.parse(savedCommentsStr);
    allComments.push(systemMsg);
    localStorage.setItem("dcms_ticket_comments_v2_team", JSON.stringify(allComments));
    
    addTimelineActivity(`📦 Archived discussion thread: ${currentThread.title}`);
    
    loadThreadsAndComments();
  };

  const handleClearChatForMe = () => {
    if (!activeThreadId) return;
    if (!confirm("Clear this thread's messages for your view only? Other assigned team members will still see them.")) {
      return;
    }
    
    const updated = comments.map(c => {
      if (c.thread_id === activeThreadId) {
        const hidden = c.hidden_for || [];
        if (!hidden.includes(activeSpeaker.id)) {
          return { ...c, hidden_for: [...hidden, activeSpeaker.id] };
        }
      }
      return c;
    });
    
    saveAllComments(updated);
    
    const confirmMsg: TeamComment = {
      id: "clear_notif_" + Date.now(),
      ticket_id: ticket.id,
      thread_id: activeThreadId,
      sender_id: "system",
      sender_name: "System Dispatcher",
      text: `🧹 You cleared your local chat history for this thread.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hidden_for: []
    };
    
    const saved = localStorage.getItem("dcms_ticket_comments_v2_team");
    const all = saved ? JSON.parse(saved) : [];
    all.push(confirmMsg);
    localStorage.setItem("dcms_ticket_comments_v2_team", JSON.stringify(all));
    
    loadThreadsAndComments();
  };

  const saveProofAttachments = (items: SupportAttachment[]) => {
    setProofAttachments(items);
    localStorage.setItem(`dcms_ticket_after_attachments_${ticket.id}`, JSON.stringify(items));
  };

  const scrollToBottom = () => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Sync changes in storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dcms_ticket_comments_v2_team" || e.key === "dcms_ticket_assignments_v1") {
        loadComments();
        if (e.key === "dcms_ticket_assignments_v1") {
          const savedAssignments = localStorage.getItem("dcms_ticket_assignments_v1");
          const assignmentsMap = savedAssignments ? JSON.parse(savedAssignments) : {};
          setAssignedTo(assignmentsMap[ticket.id] || '');
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [ticket.id]);

  useEffect(() => {
    loadThreadsAndComments();
  }, [ticket.id, activeThreadId]);

  // Add timeline activity
  const addTimelineActivity = (text: string) => {
    const actSaved = localStorage.getItem("dcms_ticket_activities_v1");
    const actMap = actSaved ? JSON.parse(actSaved) : {};
    const existing = actMap[ticket.id] || [];

    const newAct = {
      id: "act_" + Date.now(),
      ticket_id: ticket.id,
      text: text,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...existing, newAct];
    actMap[ticket.id] = updated;
    localStorage.setItem("dcms_ticket_activities_v1", JSON.stringify(actMap));
    setActivities(updated);
  };

  // Add a new assigned admin member
  const handleAddAssignment = (userId: string) => {
    if (!canManageMembers) {
      alert("🔒 Permission Denied: Only the Lead Assignee or System Owner can assign discussion members.");
      return;
    }
    const admin = AVAILABLE_ADMINS.find(a => a.id === userId);
    if (!admin) return;

    if (assignments.some(a => a.user_id === userId)) {
      alert(`${admin.name} is already assigned to this ticket!`);
      return;
    }

    const newAssignment: TicketAssignment = {
      id: "as_" + Date.now(),
      ticket_id: ticket.id,
      user_id: admin.id,
      user_name: admin.name,
      role: admin.defaultRole,
      assigned_by: activeSpeaker.name,
      created_at: new Date().toISOString()
    };

    const asSaved = localStorage.getItem("dcms_ticket_assignments_v2") || "{}";
    const asMap = JSON.parse(asSaved);
    const updatedList = [...assignments, newAssignment];
    asMap[ticket.id] = updatedList;
    localStorage.setItem("dcms_ticket_assignments_v2", JSON.stringify(asMap));
    setAssignments(updatedList);

    // Sync old assignments list for header dashboard compatibility
    const oldSaved = localStorage.getItem("dcms_ticket_assignments_v1") || "{}";
    const oldMap = JSON.parse(oldSaved);
    oldMap[ticket.id] = admin.name;
    localStorage.setItem("dcms_ticket_assignments_v1", JSON.stringify(oldMap));
    setAssignedTo(admin.name);

    // Timeline Log
    addTimelineActivity(`👥 ${activeSpeaker.name} assigned ${admin.name} as ${admin.defaultRole}`);

    // System Notification Chat insert
    const notificationMsg: TeamComment = {
      id: "sys_join_" + Date.now(),
      ticket_id: ticket.id,
      sender_id: "system",
      sender_name: "Dispatcher Bot",
      text: `🔔 System Log: ${admin.name} joins discussion (Role: ${admin.defaultRole}). Assigned by ${activeSpeaker.name}.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    saveAllComments([...comments, notificationMsg]);

    // Send direct personal user notifications
    const notifSaved = localStorage.getItem("dcms_ticket_notifications_v1") || "[]";
    const notifList = JSON.parse(notifSaved);
    notifList.push({
      id: "notif_assigned_" + Date.now(),
      user_id: admin.id,
      type: "status_update",
      title: "New Assignment Alert",
      message: `🔔 You have been assigned to Ticket #${ticket.id.toString().substring(0, 8).toUpperCase()}`,
      ticket_id: ticket.id,
      created_at: new Date().toISOString(),
      unread: true
    });
    localStorage.setItem("dcms_ticket_notifications_v1", JSON.stringify(notifList));

    if (admin.id === "Arun" || admin.id === "Priya") {
      setTimeout(() => {
        addTimelineActivity(`👨‍💻 ${admin.name} joined discussion`);
        simulateTeammateAction(admin.name, "assignment");
      }, 1000);
    }

    window.dispatchEvent(new Event("storage"));
  };

  // Remove administrative assignment
  const handleRemoveAssignment = (userId: string) => {
    if (!canManageMembers) {
      alert("🔒 Permission Denied: Only the Lead Assignee or System Owner can remove discussion members.");
      return;
    }
    const admin = AVAILABLE_ADMINS.find(a => a.id === userId);
    if (!admin) return;

    const asSaved = localStorage.getItem("dcms_ticket_assignments_v2") || "{}";
    const asMap = JSON.parse(asSaved);
    const updatedList = assignments.filter(a => a.user_id !== userId);
    asMap[ticket.id] = updatedList;
    localStorage.setItem("dcms_ticket_assignments_v2", JSON.stringify(asMap));
    setAssignments(updatedList);

    if (leadAssignee === userId) {
      const nextId = updatedList[0]?.user_id || "Kavitha";
      const leadSaved = localStorage.getItem("dcms_ticket_lead_assignee_v1") || "{}";
      const leadMap = JSON.parse(leadSaved);
      leadMap[ticket.id] = nextId;
      localStorage.setItem("dcms_ticket_lead_assignee_v1", JSON.stringify(leadMap));
      setLeadAssignee(nextId);
    }

    const oldSaved = localStorage.getItem("dcms_ticket_assignments_v1") || "{}";
    const oldMap = JSON.parse(oldSaved);
    if (oldMap[ticket.id] === admin.name) {
      oldMap[ticket.id] = updatedList[0]?.user_name || "Unassigned";
      localStorage.setItem("dcms_ticket_assignments_v1", JSON.stringify(oldMap));
      setAssignedTo(oldMap[ticket.id]);
    }

    addTimelineActivity(`🗑 ${activeSpeaker.name} unassigned ${admin.name}`);

    // System Notification Chat insert
    const notificationMsg: TeamComment = {
      id: "sys_leave_" + Date.now(),
      ticket_id: ticket.id,
      sender_id: "system",
      sender_name: "Dispatcher Bot",
      text: `🔔 System Log: ${admin.name} has been removed from assignment by ${activeSpeaker.name}.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    saveAllComments([...comments, notificationMsg]);

    // Send direct personal user notifications
    const notifSaved = localStorage.getItem("dcms_ticket_notifications_v1") || "[]";
    const notifList = JSON.parse(notifSaved);
    notifList.push({
      id: "notif_unassigned_" + Date.now(),
      user_id: admin.id,
      type: "status_update",
      title: "Removed Assignment Alert",
      message: `🔔 You have been removed from Ticket #${ticket.id.toString().substring(0, 8).toUpperCase()}`,
      ticket_id: ticket.id,
      created_at: new Date().toISOString(),
      unread: true
    });
    localStorage.setItem("dcms_ticket_notifications_v1", JSON.stringify(notifList));

    window.dispatchEvent(new Event("storage"));
  };

  // Change individual triage role
  const handleUpdateRole = (userId: string, newRole: string) => {
    if (!canManageMembers) {
      alert("🔒 Permission Denied: Only the Lead Assignee or System Owner can change member roles.");
      return;
    }
    const admin = AVAILABLE_ADMINS.find(a => a.id === userId);
    if (!admin) return;

    const asSaved = localStorage.getItem("dcms_ticket_assignments_v2") || "{}";
    const asMap = JSON.parse(asSaved);
    const updatedList = assignments.map(a => a.user_id === userId ? { ...a, role: newRole } : a);
    asMap[ticket.id] = updatedList;
    localStorage.setItem("dcms_ticket_assignments_v2", JSON.stringify(asMap));
    setAssignments(updatedList);

    addTimelineActivity(`✏️ ${activeSpeaker.name} changed ${admin.name}'s role to "${newRole}"`);

    window.dispatchEvent(new Event("storage"));
  };

  // Toggle as designated Lead Assignee
  const handleSetLead = (userId: string) => {
    if (!canManageMembers) {
      alert("🔒 Permission Denied: Only the Lead Assignee or System Owner can change the designated Lead Assignee.");
      return;
    }
    const admin = AVAILABLE_ADMINS.find(a => a.id === userId);
    if (!admin) return;

    const leadSaved = localStorage.getItem("dcms_ticket_lead_assignee_v1") || "{}";
    const leadMap = JSON.parse(leadSaved);
    leadMap[ticket.id] = userId;
    localStorage.setItem("dcms_ticket_lead_assignee_v1", JSON.stringify(leadMap));
    setLeadAssignee(userId);

    const asSaved = localStorage.getItem("dcms_ticket_assignments_v2") || "{}";
    const asMap = JSON.parse(asSaved);
    const updatedList = assignments.map(a => {
      if (a.user_id === userId) {
        return { ...a, role: "Lead Investigator" };
      } else if (a.role === "Lead Investigator") {
        return { ...a, role: "Support Engineer" };
      }
      return a;
    });
    asMap[ticket.id] = updatedList;
    localStorage.setItem("dcms_ticket_assignments_v2", JSON.stringify(asMap));
    setAssignments(updatedList);

    addTimelineActivity(`🎯 ${activeSpeaker.name} designated ${admin.name} as Lead Assignee`);

    window.dispatchEvent(new Event("storage"));
  };

  // Backward compatibility wrapper
  const handleAssignChange = (newAssignee: string) => {
    setAssignedTo(newAssignee);
    const matching = AVAILABLE_ADMINS.find(a => a.name === newAssignee);
    if (matching) {
      handleAddAssignment(matching.id);
    }
  };

  // Smart Teammate Response Simulation for Mentions & Assignments
  const simulateTeammateAction = (name: string, type: "mention" | "assignment") => {
    setTimeout(() => {
      setTypingUser(name);
      
      setTimeout(() => {
        setTypingUser(null);
        let repl = "";
        if (type === "assignment") {
          repl = name === "Arun" 
            ? "Got it. Taking a look at the server logs and domain permissions right now." 
            : "Received. I will trace the software stack and apply any necessary package updates.";
        } else {
          repl = name === "Arun"
            ? "Yes, looking at this ticket. I suspect a directory sync issue. Investigating."
            : "Understood. The error stack trace indicates standard CORS blocking. I'll test it.";
        }

        const teammateComment: TeamComment = {
          id: "sim_" + Date.now(),
          ticket_id: ticket.id,
          sender_id: `usr_${name.toLowerCase()}`,
          sender_name: name,
          text: repl,
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updated = [...comments, teammateComment];
        saveAllComments(updated);
      }, 2500);
    }, 1500);
  };

  // Polish / Improve Response with AI (Instant, mode-based triggers)
  const handleAIImprove = async (mode: "professional" | "friendly" | "shorten" | "technical") => {
    const textToImprove = resolutionNote.trim() || commentInput.trim();
    if (!textToImprove) {
      alert("Please enter some draft text in the Resolution Note or chat inputs first to polish!");
      return;
    }

    let statusLabel = "🧠 Improving professionalism...";
    if (mode === "friendly") statusLabel = "😊 Making response more friendly...";
    else if (mode === "shorten") statusLabel = "✂️ Shortening response...";
    else if (mode === "technical") statusLabel = "🔧 Adding technical clarity...";

    setImprovingStatus(statusLabel);
    setLoadingImprove(true);

    let improvedText = "";
    
    try {
      const res = await fetch("/api/gemini/improve-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToImprove,
          mode: mode,
          ticketDescription: ticket.description
        })
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.improvedText) {
        improvedText = data.improvedText;
      }
    } catch (e) {
      console.error("Failed to polish response:", e);
      // Fallback text if the fetch completely fails
      if (mode === "professional") improvedText = "Investigation concludes: " + textToImprove;
      else if (mode === "shorten") improvedText = textToImprove.slice(0, 40) + "...";
      else improvedText = "Polished: " + textToImprove;
    } 

    if (improvedText) {
      if (resolutionNote.trim()) {
        setResolutionNote(improvedText);
      } else {
        setCommentInput(improvedText);
      }
      setSaveSuccess(`Updated with ${mode} polishing!`);
      setTimeout(() => setSaveSuccess(null), 3000);
    }

    setLoadingImprove(false);
    setImprovingStatus(null);
  };

  // Send a Private Team Message/Comment
  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const currentThread = threads.find(t => t.id === activeThreadId);
    if (currentThread?.is_archived) {
      alert("🔒 This discussion thread has been archived. No further messages or replies can be submitted.");
      return;
    }

    if (!commentInput.trim() && chatFiles.length === 0) return;

    const newComment: TeamComment = {
      id: "comm_" + Date.now(),
      ticket_id: ticket.id,
      thread_id: activeThreadId,
      sender_id: activeSpeaker.id,
      sender_name: activeSpeaker.name,
      text: commentInput,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reply_to: replyTarget ? { sender_name: replyTarget.sender_name, text: replyTarget.text } : null,
      attachments: chatFiles.length > 0 ? chatFiles : undefined,
      reactions: {}
    };

    const updated = [...comments, newComment];
    saveAllComments(updated);

    const normalizedInput = commentInput.toLowerCase();
    if (normalizedInput.includes("@arun") && activeSpeaker.name !== "Arun") {
      simulateTeammateAction("Arun", "mention");
    } else if (normalizedInput.includes("@priya") && activeSpeaker.name !== "Priya") {
      simulateTeammateAction("Priya", "mention");
    }

    setCommentInput('');
    setReplyTarget(null);
    setChatFiles([]);
  };

  // Handle uploaded files for team chat
  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
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

  // Live Camera controls
  const startLiveCamera = async (mode: "user" | "environment" = cameraFacingMode) => {
    setLiveCameraActive(true);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };
      const ms = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraFacingMode(mode);
      cameraStreamRef.current = ms;
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
      }
      
      const list = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = list.filter(d => d.kind === 'videoinput');
      setCameraDevices(videoInputs);
      if (videoInputs.length > 0) {
        const found = videoInputs.find(d => d.deviceId === selectedCameraId) || videoInputs[0];
        setSelectedCameraId(found.deviceId);
      }
    } catch (err) {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        cameraStreamRef.current = ms;
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
        }
        
        const list = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = list.filter(d => d.kind === 'videoinput');
        setCameraDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoInputs[0].deviceId);
        }
      } catch (fallbackErr) {
        console.error("Camera access failed:", fallbackErr);
        alert("Unable to access digital camera capture drivers.");
        setLiveCameraActive(false);
      }
    }
  };

  const switchLiveCamera = async (newId: string) => {
    setSelectedCameraId(newId);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const newMs = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: { exact: newId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      cameraStreamRef.current = newMs;
      if (videoRef.current) {
        videoRef.current.srcObject = newMs;
      }
    } catch (err) {
      alert("Error switching to selected camera interface.");
    }
  };

  const toggleLiveCameraDirection = () => {
    if (cameraDevices.length > 1) {
      const currentIndex = cameraDevices.findIndex(d => d.deviceId === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameraDevices.length;
      switchLiveCamera(cameraDevices[nextIndex].deviceId);
    } else {
      const newMode = cameraFacingMode === "user" ? "environment" : "user";
      startLiveCamera(newMode);
    }
  };

  const captureLiveSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraFacingMode === 'user') {
          ctx.scale(-1, 1); // mirror reflection for front camera
          ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

        const fileId = "att_proof_cam_" + Date.now();
        const newAttachment: SupportAttachment = {
          id: fileId,
          name: `CameraSnapshot_${new Date().toLocaleTimeString().replace(/\s/g, "")}.jpg`,
          size: Math.round(dataUrl.length * 0.75),
          type: 'image',
          dataUrl
        };

        saveProofAttachments([...proofAttachments, newAttachment]);
        stopLiveCamera();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stopLiveCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    cameraStreamRef.current = null;
    setLiveCameraActive(false);
  };

  // Handle proof image uploads
  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loadedAttachments = [...proofAttachments];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        loadedAttachments.push({
          id: "att_proof_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          name: file.name,
          size: file.size,
          type: "image",
          dataUrl: base64
        });
        processedCount++;
        if (processedCount === files.length) {
          saveProofAttachments(loadedAttachments);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle emoji reactions
  const handleToggleReaction = (commentId: string, emoji: string) => {
    const currentThread = threads.find(t => t.id === activeThreadId);
    if (currentThread?.is_archived) {
      alert("🔒 This discussion thread has been archived. Edits, reactions, or deletions are disabled.");
      return;
    }

    const updated = comments.map(c => {
      if (c.id === commentId) {
        const rx = c.reactions ? { ...c.reactions } : {};
        const list = rx[emoji] ? [...rx[emoji]] : [];
        const index = list.indexOf(activeSpeaker.name);

        if (index > -1) {
          list.splice(index, 1);
        } else {
          list.push(activeSpeaker.name);
        }

        if (list.length === 0) {
          delete rx[emoji];
        } else {
          rx[emoji] = list;
        }

        return { ...c, reactions: rx };
      }
      return c;
    });
    saveAllComments(updated);
    setShowEmojiPicker(null);
  };

  const handleEditComment = (commentId: string) => {
    const currentThread = threads.find(t => t.id === activeThreadId);
    if (currentThread?.is_archived) {
      alert("🔒 This discussion thread has been archived. Edits, reactions, or deletions are disabled.");
      return;
    }

    const updated = comments.map(c => {
      if (c.id === commentId) {
        return { ...c, text: editInput, is_edited: true };
      }
      return c;
    });
    saveAllComments(updated);
    setEditingCommentId(null);
  };

  const handleDeleteComment = (commentId: string) => {
    const currentThread = threads.find(t => t.id === activeThreadId);
    if (currentThread?.is_archived) {
      alert("🔒 This discussion thread has been archived. Edits, reactions, or deletions are disabled.");
      return;
    }

    setDeleteDialogTarget(comments.find(c => c.id === commentId) || null);
  };

  const handleConfirmDelete = (mode: "everyone" | "me") => {
    if (!deleteDialogTarget) return;

    const currentThread = threads.find(t => t.id === activeThreadId);
    if (currentThread?.is_archived) {
      alert("🔒 This discussion thread has been archived. Edits, reactions, or deletions are disabled.");
      return;
    }

    if (mode === "everyone") {
      const isSender = deleteDialogTarget.sender_id === activeSpeaker.id;
      if (!isSender && !isLeadAssignee && !isSystemOwner) {
        alert("🔒 Permission Denied: Only the original sender, the Lead Assignee, or the System Owner can delete a message for everyone.");
        return;
      }

      const updated = comments.map(c => {
        if (c.id === deleteDialogTarget.id) {
          return { ...c, text: "🚫 This message was deleted.", is_deleted_for_everyone: true, attachments: [] };
        }
        return c;
      });
      saveAllComments(updated);
    } else {
      const updated = comments.map(c => {
        if (c.id === deleteDialogTarget.id) {
          return { ...c, hidden_for: [...(c.hidden_for || []), activeSpeaker.id] };
        }
        return c;
      });
      saveAllComments(updated);
    }
    setDeleteDialogTarget(null);
  };

  const handleSaveResolution = async () => {
    try {
      await supabase
        .from("tickets")
        .update({ status: status })
        .eq("id", ticket.id);

      // Save resolution Note strictly to dcms_ticket_resolution_notes_v1 map
      const notesStr = localStorage.getItem("dcms_ticket_resolution_notes_v1");
      const notesMap = notesStr ? JSON.parse(notesStr) : {};
      notesMap[ticket.id] = resolutionNote;
      localStorage.setItem("dcms_ticket_resolution_notes_v1", JSON.stringify(notesMap));

      if (resolutionNote.trim()) {
        const systemMsg: TeamComment = {
          id: "res_note_" + Date.now(),
          ticket_id: ticket.id,
          sender_id: activeSpeaker.id,
          sender_name: activeSpeaker.name,
          text: `🎯 GENERAL RESOLUTION NOTE SYNC:\n"${resolutionNote}"`,
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        saveAllComments([...comments, systemMsg]);
      }

      onStatusUpdated(ticket.id, status);
      setSaveSuccess("Ticket guidelines and corrections saved!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Save operation encountered a database interruption.");
    }
  };

  const handleMarkResolved = async () => {
    try {
      setStatus('Resolved');
      await supabase
        .from("tickets")
        .update({ status: 'Resolved' })
        .eq("id", ticket.id);

      // Save resolution Note strictly to dcms_ticket_resolution_notes_v1 map
      const notesStr = localStorage.getItem("dcms_ticket_resolution_notes_v1");
      const notesMap = notesStr ? JSON.parse(notesStr) : {};
      notesMap[ticket.id] = resolutionNote;
      localStorage.setItem("dcms_ticket_resolution_notes_v1", JSON.stringify(notesMap));

      const systemMsg: TeamComment = {
        id: "sys_closed_" + Date.now(),
        ticket_id: ticket.id,
        sender_id: "system",
        sender_name: "System Dispatcher",
        text: `🏁 Ticket Resolved: Incident officially closed by Supervisor ${activeSpeaker.name}.`,
        created_at: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      saveAllComments([...comments, systemMsg]);
      onStatusUpdated(ticket.id, 'Resolved');
      setSaveSuccess("Incident marked as Resolved!");
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTicket = async () => {
    if (!isSystemOwner) {
      alert("🔒 Permission Denied: Only the System Owner can permanently delete ticket records.");
      return;
    }
    if (confirm("Are you sure you want to permanently delete this ticket request files? This action is non-reversible.")) {
      try {
        await supabase
          .from("tickets")
          .delete()
          .eq("id", ticket.id);
        onBack();
      } catch (e) {
        console.error("Failed to delete ticket:", e);
      }
    }
  };

  const parsed = parseTicketDescription(ticket.description);
  const displayName = parsed.anonymous ? 'Anonymous Employee' : (ticket.users?.name || ticket.users?.email || 'Unknown');

  // WhatsApp own message read receipts helper
  const renderReadReceipt = (c: TeamComment) => {
    if (c.sender_id !== activeSpeaker.id) return null;
    const diffMs = Date.now() - new Date(c.created_at).getTime();
    if (diffMs > 4000) {
      return (
        <span className="text-[9px] text-[#A5B4FC] font-bold flex items-center justify-end gap-0.5 mt-0.5" title={"Read by Team"}>
          <CheckCheck className="w-3.5 h-3.5 text-indigo-400" /> {"Read"}</span>
      );
    }
    return (
      <span className="text-[9px] text-slate-400 font-medium flex items-center justify-end gap-0.5 mt-0.5" title={"Delivered to Channel"}>
        <Check className="w-3.5 h-3.5" /> {"Delivered"}</span>
    );
  };

  return (
    <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#0B1222] border border-slate-201 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col space-y-6 text-left relative overflow-hidden font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 font-bold font-sans text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {"Back to List"}</Button>
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">{"TICKET OPERATIONS CHAMBER"}</span>
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mt-2 leading-tight">
            {parsed.title}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {"Category Queue:"}<strong className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{parsed.department}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
          <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full ${getSeverityColor(ticket.severity)} text-white`}>
            {ticket.severity}
          </span>
        </div>
      </div>

      {/* CORE DOUBLE-COLUMN TICKET ROOM GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Complaint Details */}
        <div className="flex flex-col">
          
          {/* Diagnostic Case Details Card */}
          <div className="bg-slate-50/50 dark:bg-[#111A2E]/30 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-3.5 text-xs h-full">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <h4 className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">{"Incident Specifications"}</h4>
              <span className="font-mono text-[10px] font-bold text-slate-500">{"ID:"}{ticket.id.toString().substring(0, 8).toUpperCase()}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wide">{"Owner Client"}</span>
                <span className="font-bold text-slate-800 dark:text-slate-250 block truncate">{displayName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wide">{"Submitted At"}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-250 block">{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wide mb-1">{"Employee Complaint Narrative"}</span>
              <div className="bg-white dark:bg-[#070c15] p-3 rounded-lg border border-slate-100 dark:border-slate-850/80 italic text-slate-705 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {"&ldquo;"}{parsed.description}{"&rdquo;"}</div>
            </div>
          </div>

          {/* Multiple Assignment Triage Panel */}
          <div className="mt-4 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col space-y-4 shadow-sm relative">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 -m-4 mb-0 p-3 rounded-t-xl shrink-0">
              <h4 className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                {"Assigned Team Members"}<span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{assignments.length}</span>
              </h4>
              <Button 
                onClick={() => setShowAddMemberPanel(!showAddMemberPanel)}
                size="sm" 
                variant="outline"
                className="h-7 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
              >
                {"+ Add Member"}</Button>
            </div>

            {/* Add Member Dropdown Panel */}
            {showAddMemberPanel && (
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <Input 
                  placeholder={"Seach team directory..."} 
                  value={adminSearchQuery}
                  onChange={e => setAdminSearchQuery(e.target.value)}
                  className="h-8 text-xs mb-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                  {AVAILABLE_ADMINS.filter(a => a.name.toLowerCase().includes(adminSearchQuery.toLowerCase())).map(admin => {
                    const isAssigned = assignments.some(a => a.user_id === admin.id);
                    return (
                      <div key={admin.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{admin.avatar}</span>
                          <div>
                            <span className="text-[11px] font-bold block">{admin.name}</span>
                            <span className="text-[9px] text-slate-400 block leading-none">{admin.defaultRole}</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAddAssignment(admin.id)}
                          disabled={isAssigned}
                          size="xs" 
                          className={`h-6 text-[9.5px] font-bold px-2.5 ${isAssigned ? "bg-slate-100 text-slate-400 dark:bg-slate-800" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                        >
                          {isAssigned ? "Assigned" : "Assign"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Assignments List */}
            <div className="flex flex-col space-y-2">
              {assignments.map(assign => (
                <div key={assign.id} className="flex flex-col border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50/50 dark:bg-slate-900/20 group hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
                  <div className="flex justify-between items-start">
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{assign.user_name}</span>
                        {leadAssignee === assign.user_id && (
                          <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> {"Lead"}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-slate-400" />
                        <select 
                          value={assign.role}
                          onChange={(e) => handleUpdateRole(assign.user_id, e.target.value)}
                          className="bg-transparent border-0 text-[10.5px] font-medium text-indigo-600 dark:text-indigo-400 focus:ring-0 p-0 cursor-pointer outline-none appearance-none hover:underline"
                        >
                          <option value="Lead Investigator">{"Lead Investigator"}</option>
                          <option value="Support Engineer">{"Support Engineer"}</option>
                          <option value="Observer">{"Observer"}</option>
                          <option value="Reviewer">{"Reviewer"}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {leadAssignee !== assign.user_id && (
                        <button 
                          onClick={() => handleSetLead(assign.user_id)}
                          className="text-[10px] font-bold text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5"
                          title={"Make Lead"}
                        >
                          {"Set Lead"}</button>
                      )}
                      
                      {assignments.length > 1 && (
                        <button 
                          onClick={() => handleRemoveAssignment(assign.user_id)}
                          className="text-slate-400 hover:text-red-500 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                          title={"Unassign"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="mt-4 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col shadow-sm max-h-[300px] flex-1">
            <h4 className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-3">
              <Activity className="w-4 h-4 text-emerald-500" /> {"Activity Log"}</h4>
            
            <div className="flex-1 overflow-y-auto space-y-0 relative pl-2 before:absolute before:inset-0 before:ml-[13px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent pr-2">
              {activities.map((act, i) => (
                <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-[10px]">
                    ●
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-[#111A2E]/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm text-[10.5px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 break-words whitespace-pre-wrap leading-tight">{act.text}</span>
                    <span className="text-slate-400 font-medium block">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Private Support Team Chat with WhatsApp Features */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-full min-h-[460px] bg-slate-50/20 dark:bg-[#070C15]/40 overflow-hidden relative">
          
          <div className="bg-slate-50 dark:bg-[#111A2E]/50 border-b border-slate-200/60 dark:border-slate-800 p-3 flex justify-between items-center z-10 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-220">{"👥 Support Team Internal Chat"}</span>
              <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-mono font-bold">
                {comments.filter(c => c.sender_id !== 'system' && c.thread_id === activeThreadId).length} {"Messages"}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#8B5CF6] animate-pulse"></div>
              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">{"Channel Locked (Admins Only)"}</span>
            </div>
          </div>

          {/* Thread Bar containing: Thread Selector dropdown | Archive Button | Start New Thread | Clear Chat */}
          <div className="bg-slate-100/60 dark:bg-[#0d1527] border-b border-slate-200/60 dark:border-slate-800/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-10 shrink-0 select-none">
            {/* Thread selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">{"Stream:"}</span>
              <select
                value={activeThreadId}
                onChange={(e) => setActiveThreadId(e.target.value)}
                className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold py-1 px-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[150px]"
              >
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.is_archived ? "📦 (Archived)" : "🟢"}
                  </option>
                ))}
              </select>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              {/* Star/New Thread */}
              <button
                type="button"
                onClick={handleStartNewThread}
                className="px-2 py-1 text-[10px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title={"Start a fresh active discussion thread"}
              >
                <span>🔄</span> {"New Thread"}</button>

              {/* Archive */}
              <button
                type="button"
                onClick={handleArchiveThread}
                disabled={threads.find(t => t.id === activeThreadId)?.is_archived}
                className="px-2 py-1 text-[10px] font-extrabold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title={"Archive current thread to prevent editing/replies"}
              >
                <span>📦</span> {"Archive"}</button>

              {/* Clear For Me */}
              <button
                type="button"
                onClick={handleClearChatForMe}
                className="px-2 py-1 text-[10px] font-extrabold bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                title={"Clear current stream for your view only"}
              >
                <span>🧹</span> {"Clear For Me"}</button>
            </div>
          </div>

          {/* Archived Bannerlock */}
          {threads.find(t => t.id === activeThreadId)?.is_archived && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold font-sans flex items-center justify-center gap-2">
              <span>{"🔒 This discussion thread has been archived. Read-only view."}</span>
            </div>
          )}

          {/* Private Message Feed */}
          <div className="h-[380px] max-h-[380px] overflow-y-auto p-4 space-y-3 flex flex-col scrollbar-thin">
            {comments.filter(c => c.thread_id === activeThreadId).map((c) => {
              if (c.hidden_for?.includes(activeSpeaker.id)) return null;

              const isSystem = c.sender_id === "system";
              const isSelf = c.sender_id === activeSpeaker.id;

              if (isSystem) {
                return (
                  <div key={c.id} className="w-full text-center py-1 select-none">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-full text-[10px] font-sans font-semibold text-slate-500 dark:text-slate-400">
                      {c.text}
                    </span>
                  </div>
                );
              }

              return (
                <div 
                  key={c.id} 
                  className={`max-w-[85%] flex flex-col space-y-1 ${isSelf ? "self-end items-end" : "self-start items-start"}`}
                >
                  {/* Sender Name */}
                  <span className="text-[10px] text-slate-450 font-bold px-1.5 flex items-center gap-1.5">
                    {c.sender_name} 
                    <span className="text-[9px] font-medium text-slate-400">{c.time}</span>
                    {c.is_edited && <span className="text-[9px] text-[#A5B4FC] italic font-normal">{"(edited)"}</span>}
                  </span>

                  {/* Bubble content */}
                  <div className={`p-3 rounded-2xl border text-xs text-left relative group leading-relaxed font-sans ${
                    isSelf 
                      ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none" 
                      : "bg-white dark:bg-[#111A2E] border-slate-100 dark:border-slate-800 text-black dark:text-white rounded-tl-none"
                  }`}>
                    
                    {/* Quotation nesting */}
                    {c.reply_to && (
                      <div className={`p-2 rounded-lg mb-2 border text-[10px] leading-tight flex items-start gap-1 ${
                        isSelf 
                          ? "bg-indigo-700/60 border-indigo-500 text-indigo-100" 
                          : "bg-slate-50 dark:bg-slate-905 border-slate-100 dark:border-slate-800 text-black/80 dark:text-white/80"
                      }`}>
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                        <div>
                          <strong className="block text-[9.5px] font-black">{c.reply_to.sender_name}</strong>
                          <span className="line-clamp-1 italic">{c.reply_to.text}</span>
                        </div>
                      </div>
                    )}

                    {/* Chat Files */}
                    {c.attachments && c.attachments.map((att, idx) => (
                      <div key={idx} className="mb-2 bg-slate-900/10 dark:bg-slate-950/20 p-2 rounded-xl border border-white/10 flex items-center gap-2 max-w-[240px]">
                        {att.type === 'image' ? (
                          <div className="relative group/att h-12 w-12 rounded-lg bg-slate-850 overflow-hidden shrink-0">
                            <img src={att.url} alt={att.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-lg">📄</span>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-semibold truncate text-slate-700 dark:text-slate-200">{att.name}</p>
                        </div>
                      </div>
                    ))}

                    {/* Text block */}
                    {editingCommentId === c.id ? (
                      <div className="space-y-1.5 min-w-[200px]">
                        <Textarea 
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          className="text-xs bg-slate-100 dark:bg-slate-950 text-black dark:text-white p-2 border-slate-300 dark:border-slate-800 h-16 rounded-lg"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <Button size="xs" variant="outline" className="h-6 text-[10px]" onClick={() => setEditingCommentId(null)}>{"Cancel"}</Button>
                          <Button size="xs" className="h-6 text-[10px] bg-indigo-650 text-white" onClick={() => handleEditComment(c.id)}>{"Apply"}</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap selection:bg-[#4338CA]">{c.text}</p>
                    )}

                    {/* Inline Reactions list */}
                    {c.reactions && Object.keys(c.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5 pt-1.5 border-t border-slate-100/10">
                        {Object.entries(c.reactions).map(([emoji, rectorsVal]) => {
                          const rectors = (rectorsVal || []) as string[];
                          const reactedSelf = rectors.includes(activeSpeaker.name);
                          return (
                            <button 
                              key={emoji}
                              onClick={() => handleToggleReaction(c.id, emoji)}
                              className={`px-1.5 py-0.5 rounded-full border text-[9.5px] font-bold flex items-center gap-1.5 transition-transform hover:scale-105 ${
                                reactedSelf 
                                  ? "bg-indigo-700/50 border-indigo-500/40 text-[#EEF2FF]" 
                                  : "bg-slate-10/40 border-transparent text-slate-500 dark:text-slate-400"
                              }`}
                              title={`Reacted by: ${rectors.join(", ")}`}
                            >
                              <span>{emoji}</span>
                              <span>{rectors.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Speech Hover elements (React, Reply, Edit, Delete) */}
                    <div className={`absolute top-1/2 -track-translate-y flex items-center gap-1 opacity-0 group-hover:opacity-100 duration-100 ${
                      isSelf ? "right-full mr-2" : "left-full ml-2"
                    } -translate-y-1/2 z-10`}>
                      
                      {/* Plus Reaction button */}
                      <button 
                        onClick={() => setShowEmojiPicker(showEmojiPicker === c.id ? null : c.id)}
                        className="w-7 h-7 bg-white dark:bg-slate-800 dark:border-slate-705 border border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-450 hover:text-slate-800 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                        title={"React to note"}
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={() => setReplyTarget(c)}
                        className="w-7 h-7 bg-white dark:bg-slate-800 dark:border-slate-705 border border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-450 hover:text-slate-800 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                        title={"Reply / Quote"}
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      {isSelf && (
                        <>
                          <button 
                            onClick={() => { setEditingCommentId(c.id); setEditInput(c.text); }}
                            className="w-7 h-7 bg-white dark:bg-slate-800 dark:border-slate-705 border border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-450 hover:text-indigo-450 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                            title={"Edit"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteComment(c.id)}
                            className="w-7 h-7 bg-white dark:bg-slate-800 dark:border-slate-705 border border-slate-150 hover:bg-red-50 hover:text-red-505 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                            title={"Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Emoji Reaction Popover */}
                    {showEmojiPicker === c.id && (
                      <div className="absolute z-30 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 shadow-xl rounded-full p-1.5 flex items-center gap-1.5 bottom-full mb-1 left-0">
                        {["👍", "✅", "🎉", "❤️", "😮", "❓"].map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => handleToggleReaction(c.id, emoji)}
                            className="hover:scale-125 duration-75 text-sm p-1.5 cursor-pointer leading-none hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Render WhatsApp receipts only for my own sent messages */}
                  {renderReadReceipt(c)}
                </div>
              );
            })}

            {/* Teammate Writing indicator loading indicator */}
            {typingUser && (
              <div className="self-start flex flex-col space-y-1 items-start">
                <span className="text-[10px] text-slate-400 font-bold">{typingUser} {"is typing..."}</span>
                <div className="bg-slate-100 dark:bg-slate-800/60 px-4 py-2.5 border border-slate-100 dark:border-slate-800 rounded-full rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Quotation Target header preview */}
          {replyTarget && (
            <div className="bg-[#EEF2FF] dark:bg-[#111c34] px-4 py-2 border-t border-indigo-200/50 dark:border-indigo-950 flex justify-between items-center text-xs shrink-0 z-10">
              <div className="flex items-center gap-2 overflow-hidden text-left">
                <span className="text-indigo-500 font-bold">{"↳ Replying to:"}</span>
                <div className="font-semibold text-black dark:text-white truncate">
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[9.5px] block leading-none mb-0.5">{replyTarget.sender_name}</strong>
                  <span className="text-[10.5px] italic opacity-85">{replyTarget.text}</span>
                </div>
              </div>
              <button 
                onClick={() => setReplyTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-full hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending attachments roster preview */}
          {chatFiles.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200/60 p-2.5 gap-2 flex flex-wrap shrink-0">
              {chatFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 rounded-full text-[10.5px] font-semibold text-slate-750">
                  <span>📎</span>
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => setChatFiles(prev => prev.filter((_, idx)=> idx !== i))} className="text-red-500 hover:text-red-750 font-black ml-1 scale-105 text-[10px]">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Team Message input form */}
          <form onSubmit={handleSendComment} className="border-t border-slate-200 dark:border-slate-800 p-2.5 bg-white dark:bg-[#0B1222] flex items-center gap-2 shrink-0">
            <Input 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={threads.find(t => t.id === activeThreadId)?.is_archived ? "🔒 This thread is archived and locked..." : "Private team dispatch... Tag teammate via @Arun / @Priya"}
              disabled={threads.find(t => t.id === activeThreadId)?.is_archived}
              className="flex-1 h-10 text-xs bg-slate-50 dark:bg-[#111A2E] border-slate-200 dark:border-slate-800 rounded-xl font-medium focus-visible:ring-indigo-550/25 text-black dark:text-white disabled:opacity-60"
            />

            <input 
              id="team-chat-uploader" 
              type="file" 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleChatFileUpload}
              disabled={threads.find(t => t.id === activeThreadId)?.is_archived}
            />
            <button 
              type="button"
              onClick={() => {
                if (threads.find(t => t.id === activeThreadId)?.is_archived) return;
                document.getElementById("team-chat-uploader")?.click();
              }}
              disabled={threads.find(t => t.id === activeThreadId)?.is_archived}
              className="w-10 h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 text-slate-500 cursor-pointer transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title={"Attach File/Image"}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <Button 
              type="submit"
              disabled={threads.find(t => t.id === activeThreadId)?.is_archived}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-xl p-0 flex items-center justify-center cursor-pointer shadow-sm transition-transform shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

        </div>

      </div>

      {/* BOTTOM SECTION: Official Resolution Note & Proof of Resolution Images */}
      <div className="bg-slate-50/40 dark:bg-[#111A2E]/20 p-5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-4">
        
        {/* Core resolution properties row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 block">{"Incident Triage Status"}</span>
            <Select value={status} onValueChange={(val) => setStatus(val)}>
              <SelectTrigger className="h-10 text-xs bg-white dark:bg-[#111A2E] border-slate-200 dark:border-slate-805 text-slate-800 dark:text-slate-200 rounded-xl">
                <SelectValue placeholder={"Select Status"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                <SelectItem value="Pending">{"Pending"}</SelectItem>
                <SelectItem value="In Progress">{"In Progress"}</SelectItem>
                <SelectItem value="Resolved">{"Resolved"}</SelectItem>
                <SelectItem value="Closed">{"Closed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 block flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-indigo-500" /> {"Assigned To Team Specialist"}</span>
            <Select value={assignedTo} onValueChange={handleAssignChange}>
              <SelectTrigger className="h-10 text-xs bg-white dark:bg-[#111A2E] border-slate-200 dark:border-slate-805 text-slate-800 dark:text-slate-200 rounded-xl">
                <SelectValue placeholder={"Unassigned Queue"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0B1222] border-slate-200 dark:border-slate-800">
                <SelectItem value="Unassigned">{"Unassigned"}</SelectItem>
                <SelectItem value="Kavitha">{"👩‍💼 Kavitha (Operations Supervisor)"}</SelectItem>
                <SelectItem value="Arun">{"👨‍💻 Arun (Networking Engineer)"}</SelectItem>
                <SelectItem value="Priya">{"👩‍💻 Priya (Software Stack Support)"}</SelectItem>
                <SelectItem value="Network Team">{"🏢 Network Team Group"}</SelectItem>
                <SelectItem value="Software Team">{"🏢 Software Team Group"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resolution note text input */}
        <div className="space-y-2 pt-2 text-left">
          <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 block">{"📝 Official Corrective Resolution Note"}</span>
          
          <Textarea
            placeholder={"Describe action steps, configuration parameters, and diagnostic parameters of the active workspace fix..."}
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            className="min-h-[100px] text-xs bg-white dark:bg-[#111A2E] border-slate-205 dark:border-slate-800 p-3.5 rounded-xl resize-y text-slate-800 dark:text-slate-200 placeholder:text-slate-450"
          />

          {/* Polishing Status Alert */}
          {improvingStatus && (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-550 dark:text-indigo-400 animate-pulse mt-1.5 select-none">
              <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{improvingStatus}</span>
            </div>
          )}

          {/* Polishing Action presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={loadingImprove}
              onClick={() => handleAIImprove("professional")}
              className="h-8 text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 bg-indigo-50/10 hover:bg-indigo-100 dark:hover:bg-indigo-905 leading-none transition-all cursor-pointer rounded-lg px-3 flex items-center gap-1.5"
            >
              {"🌿 Professional"}</Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={loadingImprove}
              onClick={() => handleAIImprove("friendly")}
              className="h-8 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900 bg-emerald-50/10 hover:bg-emerald-100 dark:hover:bg-emerald-905 leading-none transition-all cursor-pointer rounded-lg px-3 flex items-center gap-1.5"
            >
              {"😊 Friendly"}</Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={loadingImprove}
              onClick={() => handleAIImprove("shorten")}
              className="h-8 text-xs font-bold text-amber-600 dark:text-amber-400 border-amber-250 dark:border-amber-900 bg-amber-50/10 hover:bg-amber-100 dark:hover:bg-amber-905 leading-none transition-all cursor-pointer rounded-lg px-3 flex items-center gap-1.5"
            >
              {"✂️ Concise"}</Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={loadingImprove}
              onClick={() => handleAIImprove("technical")}
              className="h-8 text-xs font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/10 hover:bg-blue-100 dark:hover:bg-blue-905 leading-none transition-all cursor-pointer rounded-lg px-3 flex items-center gap-1.5"
            >
              {"🔧 Technical"}</Button>
          </div>
        </div>

        {/* Proof of Resolution files */}
        <div className="space-y-2.5 pt-2 text-left border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 block">{"📸 Proof Of Resolution Media"}</span>
              <p className="text-[10.5px] text-slate-400">{"Attach screenshot uploads or capture system photos representing corrected diagnostic operations."}</p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Capture uploader triggers */}
              <input 
                id="proof-camera-trigger"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleProofFileUpload}
              />
              <input 
                id="proof-image-trigger"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleProofFileUpload}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startLiveCamera()}
                className="h-8 text-[11px] font-bold border-indigo-200 dark:border-slate-800 cursor-pointer flex items-center gap-1.5 text-slate-800 dark:text-slate-200 bg-white dark:bg-[#111A2E] hover:bg-slate-50 dark:hover:bg-[#1e293b]"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                {"📷 Open Camera"}</Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("proof-image-trigger")?.click()}
                className="h-8 text-[11px] font-bold border-indigo-200 dark:border-slate-800 cursor-pointer flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                {"🖼️ Upload Images"}</Button>
            </div>
          </div>

          {/* Render uploaded proof attachments using MediaGallery */}
          {proofAttachments.length > 0 ? (
            <div className="p-3 bg-white dark:bg-[#070c15] border border-slate-100 dark:border-slate-850/80 rounded-xl">
              <MediaGallery 
                attachments={proofAttachments} 
                onDelete={(id) => {
                  const filtered = proofAttachments.filter(a => a.id !== id);
                  saveProofAttachments(filtered);
                }} 
                allowEdit={true} 
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-100 dark:border-slate-800/80 p-6 text-center rounded-xl bg-slate-50/10">
              <span className="text-xl">📷</span>
              <p className="text-[11px] text-black dark:text-white italic mt-1 font-medium">{"No resolution screenshots or camera proof attached to this ticket yet."}</p>
            </div>
          )}
        </div>

      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-bold font-mono">
          ✓ {saveSuccess}
        </div>
      )}

      {/* Action triggers */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row flex-wrap gap-2 justify-end">
        <Button
          onClick={handleSaveResolution}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4" /> {"Save Ticket Updates"}</Button>

        <Button
          onClick={handleMarkResolved}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <CheckCircle className="w-4 h-4" /> {"Mark as Resolved"}</Button>

        <Button
          onClick={handleDeleteTicket}
          variant="outline"
          className="border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold h-10 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> {"Delete Ticket"}</Button>

        <Button
          onClick={onBack}
          variant="outline"
          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 font-bold h-10 px-4 rounded-xl text-xs cursor-pointer"
        >
          {"Close Detail"}</Button>
      </div>

      {deleteDialogTarget && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 w-80 shadow-2xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-center mb-1">{"Delete Message?"}</h3>
            <Button
              onClick={() => handleConfirmDelete("everyone")}
              className="w-full justify-center bg-red-50 text-red-600 hover:bg-red-100 border-none font-bold text-xs py-2 shadow-none cursor-pointer"
            >
              {"Delete for Everyone"}</Button>
            <Button
              onClick={() => handleConfirmDelete("me")}
              className="w-full justify-center bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 border-none font-bold text-xs py-2 shadow-none cursor-pointer"
            >
              {"Delete for Me"}</Button>
            <Button
              onClick={() => setDeleteDialogTarget(null)}
              variant="outline"
              className="w-full justify-center border-slate-200 dark:border-slate-700 font-bold text-xs py-2 shadow-none cursor-pointer mt-1"
            >
              {"Cancel"}</Button>
          </div>
        </div>
      )}

      {liveCameraActive && (
        <DcmsCamera 
          onClose={() => setLiveCameraActive(false)}
          onCapturePhotos={(photos) => {
            setProofAttachments(prev => [...prev, ...photos]);
            setLiveCameraActive(false);
          }}
        />
      )}
    </div>
  );
}
