const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

// 1. Add missing imports
content = content.replace('Share, MousePointerSquare, FileText, Image', 'Share, MousePointerSquare, FileText, Image, PanelLeft as Panel, ShieldAlert, Group, Trash2, Trash, ArrowRight, Edit2, Pin, Sparkles, MessageSquare, Bell, Reply');

// 2. Add missing state variables and dummy functions
const missingStates = `
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
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
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

`;

// Find a good place to insert this inside AdminTeamChat()
content = content.replace('const [rooms, setRooms] = useState<ChatRoom[]>([]);', missingStates + '\n  const [rooms, setRooms] = useState<ChatRoom[]>([]);');

fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
