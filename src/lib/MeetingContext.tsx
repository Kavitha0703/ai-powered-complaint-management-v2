import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.tsx";

export type HuddleParticipant = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isCameraOn: boolean;
};

export type HuddleTranscript = {
  senderId: string;
  senderName: string;
  text: string;
  time: string;
};

export interface ChatMessage {
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

export type RecentCall = {
  id: string;
  type: "voice" | "video";
  timestamp: string;
  title: string;
  participants: string[];
  duration: string;
};

type ActiveCall = {
  roomId: string;
  type: "voice" | "video";
  status: "ringing" | "connected" | "calling" | "busy";
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isSpeakerActive: boolean;
  isCaptionsOn: boolean;
  isMinimized: boolean;
  duration: number;
  participants: HuddleParticipant[];
  transcripts: HuddleTranscript[];
  ticketNumber: string;
  ticketTitle: string;
};

type MeetingContextType = {
  activeCall: ActiveCall | null;
  setActiveCall: React.Dispatch<React.SetStateAction<ActiveCall | null>>;
  startHuddleCall: (roomId: string, type: "voice" | "video", participants: HuddleParticipant[], ticketNumber: string, ticketTitle: string) => void;
  endHuddleCall: () => void;
  localCamStream: MediaStream | null;
  screenStream: MediaStream | null;
  userStream: MediaStream | null;
  audioLevel: number;
  micPermission: string | null;
  camPermission: string | null;
  speechStatus: "Listening..." | "Converting speech..." | "Ready" | "Inactive";
  setSpeechStatus: (status: "Listening..." | "Converting speech..." | "Ready" | "Inactive") => void;
  isVoicePlaybackMuted: boolean;
  setIsVoicePlaybackMuted: (muted: boolean) => void;
  recentCalls: RecentCall[];
  setRecentCalls: React.Dispatch<React.SetStateAction<RecentCall[]>>;
  requestMicrophone: () => Promise<void>;
  requestCamera: () => Promise<void>;
  requestScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  postHuddleNotes: () => void;
  speakText: (text: string, senderName: string) => void;
  speakAnnouncement: (text: string) => void;
  durationRef: React.MutableRefObject<number>;
};

const MeetingContext = createContext<MeetingContextType | null>(null);

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const durationRef = useRef<number>(0);
  const [localCamStream, setLocalCamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micPermission, setMicPermission] = useState<string | null>(null);
  const [camPermission, setCamPermission] = useState<string | null>(null);
  
  const [speechStatus, setSpeechStatus] = useState<"Listening..." | "Converting speech..." | "Ready" | "Inactive">("Inactive");
  const [isVoicePlaybackMuted, setIsVoicePlaybackMuted] = useState<boolean>(false);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>(() => {
    try {
      const saved = localStorage.getItem("dcms_recent_calls_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recognitionRef = useRef<any>(null);
  const { dbUser } = useAuth();
  const currentAdminId = dbUser?.id || "adm-kavitha";
  const currentAdminName = dbUser?.name || "Kavitha";

  const cleanupCallStreams = () => {
    if (localCamStream) {
      localCamStream.getTracks().forEach(t => t.stop());
      setLocalCamStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    if (userStream) {
      userStream.getTracks().forEach(t => t.stop());
      setUserStream(null);
    }
  };

  const formatCallDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const appendChatMessage = (text: string, callSummary?: NonNullable<ChatMessage["call_summary"]>) => {
    if (!activeCall) return;
    const messageId = "chatmsg_call_" + Date.now();
    const newMsg: ChatMessage = {
      id: messageId,
      room_id: activeCall.roomId || "ch_general",
      sender_id: currentAdminId,
      sender_name: currentAdminName,
      text,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      message_status: "sent",
      reactions: {},
      call_summary: callSummary
    };

    try {
      const saved = localStorage.getItem("dcms_chat_messages_v4");
      const allMsg: ChatMessage[] = saved ? JSON.parse(saved) : [];
      const combined = [...allMsg, newMsg];
      localStorage.setItem("dcms_chat_messages_v4", JSON.stringify(combined));
      
      // Dispatch both custom event and storage event to ensure instant layout updates
      window.dispatchEvent(new CustomEvent("dcms_messages_updated"));
      window.dispatchEvent(new StorageEvent("storage", { key: "dcms_chat_messages_v4" }));
    } catch (err) {
      console.error("Failed appending huddle note message", err);
    }
  };

  const postHuddleNotes = () => {
    if (!activeCall) return;
    const callSummary: NonNullable<ChatMessage["call_summary"]> = {
      type: "voice",
      duration: formatCallDuration(durationRef.current),
      participants: activeCall.participants.map(p => p.name),
      ticketNumber: activeCall.ticketNumber || "#548610",
      ticketTitle: activeCall.ticketTitle || "Database Outages & Level-2 Escalations Queue Spike",
      recordingNotes: `Ad-hoc Triage Huddle Notes for active call session`,
      discussionSummary: [
        "Investigated database deadlock and slow response times",
        "Identified thread locks on complaint table",
        "Scaled database connection pool limit dynamically to 45 threads",
        "Verified normal latency restored (18ms) on all regional gateway nodes"
      ],
      recordingAvailable: false,
      transcriptSaved: false,
      screensShared: activeCall.isScreenSharing ? 1 : 0
    };
    appendChatMessage("Ad-hoc Triage Huddle Notes", callSummary);
  };

  const endHuddleCall = () => {
    if (!activeCall) return;
    
    const durationStr = formatCallDuration(durationRef.current);
    const participantNames = activeCall.participants.map(p => p.name);
    const isVideo = activeCall.type === "video";
    const screensCount = activeCall.isScreenSharing ? 1 : 0;
    
    const callSummary: NonNullable<ChatMessage["call_summary"]> = {
      type: activeCall.type,
      duration: durationStr,
      participants: participantNames,
      screenShareUsed: activeCall.isScreenSharing,
      ticketNumber: activeCall.ticketNumber || "#548610",
      ticketTitle: activeCall.ticketTitle || "Database Outages & Level-2 Escalations Queue Spike",
      recordingNotes: isVideo 
        ? "Video war-room huddle finalized and archived." 
        : "Voice bridge huddle logs finalized and routed.",
      discussionSummary: [
        "Ticket 548 reviewed & logs validated",
        "Database connection deadlock root cause identified",
        "SLA resolution policy compliance confirmed"
      ],
      recordingAvailable: true,
      transcriptSaved: true,
      screensShared: screensCount
    };

    const summaryText = "Team Call Summary";
    appendChatMessage(summaryText, callSummary);
    
    // SAVE NEW CALL RECORD TO RECENT CALLS LIST
    const newRecentCallItem: RecentCall = {
      id: "call_" + Date.now(),
      type: activeCall.type,
      timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      title: activeCall.ticketTitle || "Ad-hoc Huddle",
      participants: participantNames,
      duration: durationStr
    };

    setRecentCalls(prev => {
      const updated = [newRecentCallItem, ...prev];
      localStorage.setItem("dcms_recent_calls_v1", JSON.stringify(updated));
      return updated;
    });

    cleanupCallStreams();
    setActiveCall(null);
    try {
      if (window.speechSynthesis && !isVoicePlaybackMuted) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("You left the meeting.");
        utterance.rate = 1.15;
        window.speechSynthesis.speak(utterance);
      }
    } catch (_) {}
  };

  const startHuddleCall = (roomId: string, type: "voice" | "video", participants: HuddleParticipant[], ticketNumber: string, ticketTitle: string) => {
    setActiveCall({
      roomId,
      type,
      status: "ringing",
      isMuted: false,
      isCameraOn: type === "video",
      isScreenSharing: false,
      isSpeakerActive: true,
      isCaptionsOn: false,
      isMinimized: false,
      duration: 0,
      participants,
      transcripts: [],
      ticketNumber,
      ticketTitle
    });
  };

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setUserStream(stream);
      setMicPermission("granted");
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
        
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;
        
        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
        
        let lastUpdate = 0;
        scriptProcessor.onaudioprocess = () => {
          const now = Date.now();
          if (now - lastUpdate < 120) return; // Only update state once every 120ms
          lastUpdate = now;

          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;
          const length = array.length;
          for (let i = 0; i < length; i++) {
            values += (array[i]);
          }
          const average = values / length;
          setAudioLevel(average);
        };
      }
    } catch (err) {
      console.warn("Microphone access denied or unavailable", err);
      setMicPermission("denied");
    }
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalCamStream(stream);
      setCamPermission("granted");
    } catch (err) {
      console.warn("Camera access denied or unavailable", err);
      setCamPermission("denied");
    }
  };

  const requestScreenShare = async () => {
    if (activeCall?.isScreenSharing) {
      console.warn("Screen sharing is already active. Only one screen share is permitted at a time.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setActiveCall(prev => prev ? { ...prev, isScreenSharing: true } : null);
      
      speakAnnouncement("Screen sharing started.");
      
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("Screen sharing denied or unavailable", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    setActiveCall(prev => prev ? { ...prev, isScreenSharing: false } : null);
    speakAnnouncement("Screen sharing stopped.");
  };

  const speakAnnouncement = (text: string) => {
    if (isVoicePlaybackMuted) return;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15; // concise and fast announcement
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Announcement speech failed:", err);
    }
  };

  // Speaks aloud with distinct pitches/rates
  const speakText = (text: string, senderName: string) => {
    if (isVoicePlaybackMuted) return;

    try {
      if (!window.speechSynthesis) {
        console.warn("SpeechSynthesis not supported.");
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const availableVoices = window.speechSynthesis.getVoices();
      
      if (senderName === "Arun") {
        const maleVoice = availableVoices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("google uk english male"));
        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = 0.85;
        utterance.rate = 0.95;
      } else if (senderName === "Priya") {
        const femaleVoice = availableVoices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("google us english") || v.name.toLowerCase().includes("samantha"));
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.pitch = 1.15;
        utterance.rate = 1.05;
      } else if (senderName === "Karthik") {
        const deepVoice = availableVoices.find(v => v.name.toLowerCase().includes("google uk english male") || v.name.toLowerCase().includes("hazel"));
        if (deepVoice) utterance.voice = deepVoice;
        utterance.pitch = 0.75;
        utterance.rate = 0.9;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Error playing speech synthesis:", err);
    }
  };

  const handleAiBotResponse = async (transcript: string) => {
    if (!activeCall) return;
    
    const otherParticipants = activeCall.participants.filter(p => p.id !== currentAdminId);
    if (otherParticipants.length === 0) return;

    try {
      const response = await fetch("/api/gemini/huddle-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transcript,
          previousContext: activeCall.transcripts.map(t => `${t.senderName}: ${t.text}`).join("\n"),
          participants: otherParticipants
        })
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();
      
      if (data && data.speakerId && data.text) {
        const speaker = otherParticipants.find(p => p.id === data.speakerId) || otherParticipants[0];
        
        // Add text to transcript
        setActiveCall(prev => {
          if (!prev) return null;
          return {
            ...prev,
            transcripts: [
              ...prev.transcripts,
              { senderId: speaker.id, senderName: speaker.name, text: data.text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isSpeech: true }
            ]
          };
        });

        // Speak the text
        speakText(data.text, speaker.name);

        // Flash "isSpeaking" indicator temporarily
        setActiveCall(prev => {
          if (!prev) return null;
          return {
            ...prev,
            participants: prev.participants.map(p => 
              p.id === speaker.id ? { ...p, isSpeaking: true } : p
            )
          };
        });
        
        // Turn off speaking indicator after 3 seconds
        setTimeout(() => {
          setActiveCall(prev => {
            if (!prev) return null;
            return {
              ...prev,
              participants: prev.participants.map(p => 
                p.id === speaker.id ? { ...p, isSpeaking: false } : p
              )
            };
          });
        }, Math.max(3000, data.text.length * 50));
      }
    } catch (err) {
      console.warn("AI Bot response error:", err);
    }
  };

  // Synchronize dynamic user details to userStream microphone audio tracks state
  useEffect(() => {
    if (userStream) {
      userStream.getAudioTracks().forEach(track => {
        track.enabled = !(activeCall?.isMuted);
      });
    }
  }, [activeCall?.isMuted, userStream]);

  // Call duration timer - updates durationRef without triggering global re-renders
  useEffect(() => {
    if (!activeCall || activeCall.status !== "connected") {
      durationRef.current = 0;
      return;
    }
    durationRef.current = 0;
    const interval = setInterval(() => {
      durationRef.current += 1;
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  // Continuous speech recognition loop & fallback simulations (deferred by 500ms to allow smooth rendering of meeting UI)
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let fallbackInterval: any = null;
    let startupTimeout: any = null;

    if (activeCall && activeCall.status === "connected" && !activeCall.isMuted) {
      startupTimeout = setTimeout(() => {
        if (SpeechRecognitionClass) {
          try {
            const rec = new SpeechRecognitionClass();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "en-US";

            rec.onstart = () => {
              setSpeechStatus("Listening...");
            };

            rec.onresult = (event: any) => {
              setSpeechStatus("Converting speech...");
              let interimTranscript = "";
              let finalTranscript = "";

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                } else {
                  interimTranscript += event.results[i][0].transcript;
                }
              }

              const currentSpeechText = finalTranscript || interimTranscript;
              if (currentSpeechText) {
                if (finalTranscript) {
                  const finalClean = finalTranscript.trim();
                  setActiveCall(prev => {
                    if (!prev) return null;
                    const hasDup = prev.transcripts.some(t => t.text === finalClean);
                    if (hasDup) return prev;
                    return {
                      ...prev,
                      transcripts: [
                        ...prev.transcripts,
                        { senderId: currentAdminId, senderName: currentAdminName, text: finalClean, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isSpeech: true }
                      ]
                    };
                  });
                  handleAiBotResponse(finalClean);
                }
              }
            };

            rec.onerror = (e: any) => {
              console.warn("SpeechRecognition error:", e);
            };

            rec.onend = () => {
              if (activeCall && !activeCall.isMuted) {
                try { rec.start(); } catch(_) {}
              } else {
                setSpeechStatus("Ready");
              }
            };

            rec.start();
            recognitionRef.current = rec;
          } catch (err) {
            console.warn("Failed starting Web Speech API Recognition, using fallback simulation:", err);
          }
        }

        fallbackInterval = setInterval(() => {
          setSpeechStatus("Listening...");
          if (Math.random() > 0.6) {
            setSpeechStatus("Converting speech...");
            setTimeout(() => {
              const simulatedSentences = [
                "We need to review ticket #548 and scale the DB thread limits.",
                "Arun can you verify connection latency on the regional gateway?",
                "Priya let's compile complaints system database report first.",
                "Adjusting Redis pool settings to avoid gateway timeout locks.",
                "Ready to finalize this incident huddle and issue resolution guidelines."
              ];
              const sentence = simulatedSentences[Math.floor(Math.random() * simulatedSentences.length)];
              
              setSpeechStatus("Ready");

              setActiveCall(prev => {
                if (!prev) return null;
                const hasDup = prev.transcripts.some(t => t.text === sentence);
                if (hasDup) return prev;
                return {
                  ...prev,
                  transcripts: [
                    ...prev.transcripts,
                    { senderId: currentAdminId, senderName: currentAdminName, text: sentence, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isSpeech: true }
                  ]
                };
              });
            }, 1500);
          }
        }, 12000);
      }, 500); // 500ms startup delay for non-critical systems to guarantee UI starts instantly at 60fps!

    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(_) {}
        recognitionRef.current = null;
      }
      setSpeechStatus("Inactive");
    }

    return () => {
      if (startupTimeout) {
        clearTimeout(startupTimeout);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(_) {}
        recognitionRef.current = null;
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [activeCall?.status, activeCall?.isMuted]);

  return (
    <MeetingContext.Provider value={{
      activeCall, setActiveCall, startHuddleCall, endHuddleCall,
      localCamStream, screenStream, userStream, audioLevel,
      micPermission, camPermission, speechStatus, setSpeechStatus,
      isVoicePlaybackMuted, setIsVoicePlaybackMuted, recentCalls, setRecentCalls,
      requestMicrophone, requestCamera, requestScreenShare, stopScreenShare,
      postHuddleNotes, speakText, speakAnnouncement, durationRef
    }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) throw new Error("useMeeting must be used within MeetingProvider");
  return context;
}
