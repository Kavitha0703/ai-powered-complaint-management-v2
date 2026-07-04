import React, { useState, useEffect, useRef } from "react";
import { useMeeting } from "../lib/MeetingContext";
import { useAuth } from "../lib/AuthContext";
import { 
  Phone, Video, Monitor, Mic, MicOff, VideoOff, Minimize2, PhoneOff, 
  FileText, MessageSquare, Activity, Hand, Smile, MoreVertical, 
  Users, Pin, PinOff, Signal, AlertTriangle, Play, Square, 
  Check, X, Send, Volume2, VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Duration Display Component
export function CallDurationDisplay() {
    
  const { durationRef } = useMeeting();
  const [seconds, setSeconds] = useState(durationRef.current);

  useEffect(() => {
    setSeconds(durationRef.current);
    const interval = setInterval(() => {
      setSeconds(durationRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [durationRef]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <span className="font-mono">{`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}</span>;
}

// Real-time Canvas-based Voice Wave Visualizer
export function VoiceCanvasVisualizer({ volume, isSpeaking, color = "#10b981" }: { volume: number; isSpeaking: boolean; color?: string }) {
    
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const smoothedVolumeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      if (!ctx || !canvas) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.floor(width * dpr);
      const targetHeight = Math.floor(height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth volume
      const targetVolume = isSpeaking ? volume : 0;
      smoothedVolumeRef.current += (targetVolume - smoothedVolumeRef.current) * 0.18;
      const activeVol = smoothedVolumeRef.current;

      const centerY = height / 2;
      phase += 0.05 + (activeVol / 100) * 0.08;

      if (activeVol > 1) {
        const numWaves = 3;
        const waveParams = [
          { speed: 1.0, amplitude: 0.9, strokeColor: color, opacity: 0.9, frequency: 0.04, lineWidth: 2 },
          { speed: -0.7, amplitude: 0.5, strokeColor: "#3b82f6", opacity: 0.6, frequency: 0.07, lineWidth: 1 },
          { speed: 1.3, amplitude: 0.3, strokeColor: "#8b5cf6", opacity: 0.4, frequency: 0.1, lineWidth: 1 }
        ];

        for (let w = 0; w < numWaves; w++) {
          const p = waveParams[w];
          ctx.beginPath();
          ctx.strokeStyle = p.strokeColor;
          ctx.globalAlpha = p.opacity;
          ctx.lineWidth = p.lineWidth;
          ctx.shadowBlur = p.lineWidth > 1 ? 6 : 0;
          ctx.shadowColor = p.strokeColor;

          for (let x = 0; x < width; x++) {
            const edgeTaper = Math.sin((x / width) * Math.PI);
            const currentAmp = (activeVol / 100) * (height * 0.45) * p.amplitude * edgeTaper;
            const y = centerY + Math.sin(x * p.frequency + phase * p.speed) * currentAmp;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else {
        // Silent flat line with subtle idle hum
        ctx.beginPath();
        ctx.strokeStyle = "#475569";
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;

        for (let x = 0; x < width; x++) {
          const edgeTaper = Math.sin((x / width) * Math.PI);
          const idleAmp = 1.5 * edgeTaper;
          const y = centerY + Math.sin(x * 0.05 + phase * 0.3) * idleAmp;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [volume, isSpeaking, color]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

export default function MeetingOverlay() {
    
  const { 
    activeCall, setActiveCall, endHuddleCall, 
    localCamStream, screenStream, audioLevel, 
    micPermission, camPermission, requestMicrophone, requestCamera, 
    requestScreenShare, stopScreenShare, postHuddleNotes,
    durationRef, isVoicePlaybackMuted, setIsVoicePlaybackMuted,
    speakAnnouncement,
    isRecording, recordingSeconds, startRecordingSession, stopRecordingSession
  } = useMeeting();

  const { dbUser } = useAuth();
  const currentAdminId = dbUser?.id || "adm-kavitha";
  const currentAdminName = dbUser?.name || "Kavitha";

  // Component local states
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"chat" | "participants" | null>(null);
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({});
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<"excellent" | "fair" | "poor">("excellent");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [alertToast, setAlertToast] = useState<string | null>(null);

  // Timeouts tracking reference for clean unmounting/leaving
  const overlayTimeoutsRef = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      overlayTimeoutsRef.current.forEach(t => clearTimeout(t));
      overlayTimeoutsRef.current = [];
    };
  }, [activeCall]);

  // Auto scroll chat to bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeCall?.transcripts, activeSidebarTab]);

  // Active call speaking states with noise gate and speech-end hang time (300-500ms)
  const [isMeSpeakingSmooth, setIsMeSpeakingSmooth] = useState(false);
  const speechTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const isNowSpeaking = activeCall && !activeCall.isMuted && audioLevel > 8; // Noise Gate at 8%
    if (isNowSpeaking) {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      setIsMeSpeakingSmooth(true);
    } else {
      // Speech ended: wait 350ms before turning off speaking indicator (hang time)
      if (!speechTimeoutRef.current && isMeSpeakingSmooth) {
        speechTimeoutRef.current = setTimeout(() => {
          setIsMeSpeakingSmooth(false);
          speechTimeoutRef.current = null;
        }, 350);
      }
    }
  }, [audioLevel, activeCall?.isMuted, isMeSpeakingSmooth]);

  const prevParticipantsRef = useRef<string[]>([]);
  const prevRaisedHandsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!activeCall || activeCall.status !== "connected") {
      prevParticipantsRef.current = [];
      prevRaisedHandsRef.current = {};
      return;
    }

    // Check participants join/leave
    const currentParticipantNames = activeCall.participants.map(p => p.name);
    const prevNames = prevParticipantsRef.current;

    if (prevNames.length > 0) {
      // Find who joined
      currentParticipantNames.forEach(name => {
        if (!prevNames.includes(name) && name !== currentAdminName) {
          speakAnnouncement(`${name} joined.`);
        }
      });
      // Find who left
      prevNames.forEach(name => {
        if (!currentParticipantNames.includes(name) && name !== currentAdminName) {
          speakAnnouncement(`${name} left.`);
        }
      });
    }
    prevParticipantsRef.current = currentParticipantNames;

    // Check hand raises
    const currentHands = raisedHands;
    const prevHands = prevRaisedHandsRef.current;

    Object.keys(currentHands).forEach(id => {
      const isRaisedNow = currentHands[id];
      const wasRaisedBefore = prevHands[id];
      if (isRaisedNow && !wasRaisedBefore) {
        // Find the participant's name
        const p = activeCall.participants.find(part => part.id === id);
        if (p) {
          const displayName = p.id === currentAdminId ? "You" : p.name;
          speakAnnouncement(`${displayName} raised hand.`);
        }
      }
    });
    prevRaisedHandsRef.current = currentHands;

  }, [activeCall?.participants, raisedHands, activeCall?.status]);

  // Simulated occasional network quality change
  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.85) {
        setNetworkQuality("fair");
        triggerAlert("Network connection latency fluctuated slightly.");
      } else if (rand > 0.97) {
        setNetworkQuality("poor");
        triggerAlert("⚠️ Network unstable. Standard latency threshold exceeded.");
      } else {
        setNetworkQuality("excellent");
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [activeCall]);

  // Simulating teammate reactions & raised hands occasionally to make the call feel fully interactive!
  useEffect(() => {
    if (!activeCall || activeCall.status !== "connected") return;

    const interval = setInterval(() => {
      // Choose a random participant other than the current user
      const otherParticipants = activeCall.participants.filter(p => p.id !== currentAdminId);
      if (otherParticipants.length === 0) return;
      const randomUser = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];

      const roll = Math.random();
      if (roll > 0.85) {
        // Trigger a reaction
        const emojis = ["👍", "❤️", "😂", "🎉", "👏"];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        triggerTeammateReaction(emoji);
      } else if (roll > 0.70) {
        // Toggle hand raise for a teammate
        setRaisedHands(prev => {
          const isRaisedNow = !prev[randomUser.id];
          if (isRaisedNow) {
            triggerAlert(`✋ ${randomUser.name} raised hand`);
          }
          return { ...prev, [randomUser.id]: isRaisedNow };
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [activeCall?.status, activeCall?.participants]);

  const triggerAlert = (msg: string) => {
    setAlertToast(msg);
    setTimeout(() => setAlertToast(null), 4000);
  };

  const triggerTeammateReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = 30 + Math.random() * 40;
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 2000);
  };

  // Return null if there is no active call, placed below all hook declarations
  if (!activeCall) return null;

  const handleSendReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = 40 + Math.random() * 20;
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 2000);
    setShowMoreMenu(false);
  };

  const handleToggleRaiseHand = () => {
    const nextState = !raisedHands[currentAdminId];
    setRaisedHands(prev => ({ ...prev, [currentAdminId]: nextState }));
    if (nextState) {
      triggerAlert("✋ You raised your hand");
    }
  };

  // Modern clean Send Message handler that integrates with transcripts and triggers AI responds!
  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    const messageText = chatInput.trim();
    setChatInput("");

    // Append to unified transcripts list so it appears inside call chat and as subtitles if speaking
    setActiveCall(prev => {
      if (!prev) return null;
      return {
        ...prev,
        transcripts: [
          ...prev.transcripts,
          { 
            senderId: currentAdminId, 
            senderName: currentAdminName, 
            text: messageText, 
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isSpeech: false
          }
        ]
      };
    });

    // Trigger AI respond asynchronously with a realistic 2-3 second delay
    const tid1 = setTimeout(() => {
      if (!activeCall) return;
      // Use existing AI bridge in MeetingContext
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      // Triggers AI Response logic
      const otherParticipants = activeCall.participants.filter(p => p.id !== currentAdminId);
      if (otherParticipants.length > 0) {
        // Trigger simulated huddle bot response
        fetch("/api/gemini/huddle-bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: messageText,
            previousContext: activeCall.transcripts.map(t => `${t.senderName}: ${t.text}`).join("\n"),
            participants: otherParticipants
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.speakerId && data.text) {
            const speaker = otherParticipants.find(p => p.id === data.speakerId) || otherParticipants[0];
            
            setActiveCall(prev => {
              if (!prev) return null;
              return {
                ...prev,
                transcripts: [
                  ...prev.transcripts,
                  { senderId: speaker.id, senderName: speaker.name, text: data.text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isSpeech: false }
                ],
                participants: prev.participants.map(p => p.id === speaker.id ? { ...p, isSpeaking: true } : p)
              };
            });

            // Silence speaking icon after 3 seconds
            const tid2 = setTimeout(() => {
              setActiveCall(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  participants: prev.participants.map(p => p.id === speaker.id ? { ...p, isSpeaking: false } : p)
                };
              });
            }, 3500);
            overlayTimeoutsRef.current.push(tid2);
          }
        })
        .catch(err => console.warn("Meeting chat AI response failed:", err));
      }
    }, 1500);
    overlayTimeoutsRef.current.push(tid1);
  };

  // Leave and save chat handler
  const handleLeaveMeetingConfirm = (saveChat: boolean) => {
    setShowConfirmLeave(false);
    if (saveChat) {
      postHuddleNotes();
      triggerAlert("Meeting transcript saved to support desk feed.");
    }
    // Briefly delay closing to show save confirmation
    setTimeout(() => {
      endHuddleCall();
    }, 600);
  };

  const formatRecordingTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pre-join state
  if (activeCall.status === "ringing" || activeCall.status === "calling") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#090C15] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-[#111625] border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
          {/* Decorative ambient background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <h2 className="text-xl lg:text-2xl font-bold text-white text-center mb-1 tracking-tight">{"Ready to join your team?"}</h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            {"Incident Bridge #"}{activeCall.roomId} {"&bull;"}{activeCall.ticketTitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            {/* Local Preview */}
            <div className="aspect-video bg-[#0B0F19] rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
              {activeCall.type === "video" ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#111528] to-[#1a2342] animate-pulse flex flex-col items-center justify-center">
                    <span className="text-5xl filter drop-shadow-md mb-2">👩‍💼</span>
                    <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                      {"Local Cam Loopback"}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {"Camera Ready"}</div>
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center text-2xl shadow">🎙️</div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{"Voice Only Mode"}</span>
                </div>
              )}
              {/* Micro level bar */}
              <div className="absolute bottom-3 right-3 left-3 h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${Math.max(12, Math.min(100, (audioLevel || 2) * 12))}%` }} />
              </div>
            </div>

            {/* Device settings list */}
            <div className="flex flex-col justify-center space-y-4 bg-[#161D30]/50 p-5 rounded-2xl border border-slate-850">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-1">
                {"Security &amp; Device Status"}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{"Microphone"}</span>
                {micPermission === "granted" ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {"Granted"}</span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {"Pending Approval"}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{"Camera"}</span>
                {activeCall.type === "video" ? (
                  camPermission === "granted" ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {"Granted"}</span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {"Pending Approval"}</span>
                  )
                ) : (
                  <span className="text-slate-500 italic">{"Muted"}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{"VoIP Stream"}</span>
                <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">{"AES-256 Encrypted"}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full max-w-md justify-center">
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 h-12 text-white rounded-xl text-sm font-bold px-8 cursor-pointer flex-1 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95" 
              onClick={() => {
                // OPTIMIZE MEETING STARTUP:
                // Immediately transition the main state to connected without blocking on stream requests
                setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
                speakAnnouncement("You joined the meeting.");
                
                // Fetch devices asynchronously in the background so rendering loads immediately at 60 FPS
                setTimeout(() => {
                  requestMicrophone();
                  if (activeCall.type === "video") {
                    requestCamera();
                  }
                }, 100);
              }}
            >
              {"Join Meeting"}</button>
            <button 
              className="bg-slate-800 hover:bg-slate-700 h-12 text-slate-300 rounded-xl text-sm font-bold px-6 cursor-pointer flex items-center justify-center gap-2 transition-colors border border-slate-750" 
              onClick={endHuddleCall}
            >
              <PhoneOff className="w-4 h-4" /> {"Cancel"}</button>
          </div>
        </div>
      </div>
    );
  }

  // Minimized Floating Widget Mode
  if (activeCall.isMinimized) {
    return (
      <div 
        onClick={() => setActiveCall(p => p ? { ...p, isMinimized: false } : null)} 
        className="fixed bottom-6 right-6 w-64 z-[100] bg-[#111625] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all group p-4 flex flex-col"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {activeCall.type === "video" ? <Video className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" /> : <Phone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />}
            <span className="text-white font-bold text-xs truncate max-w-[120px]">{"Ongoing Team Huddle"}</span>
          </div>
          <span className="text-slate-400 font-mono text-xs font-bold"><CallDurationDisplay /></span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex -space-x-1.5 overflow-hidden">
            {activeCall.participants.map(p => (
              <div key={p.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-[#111625] bg-slate-800 flex items-center justify-center text-xs shadow-md">{p.avatar}</div>
            ))}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowConfirmLeave(true); }} 
            className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg transition-colors shadow-sm"
            title={"Leave Call"}
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const getIsParticipantSpeaking = (p: any) => {
    if (p.isMuted) return false;
    if (p.id === currentAdminId) {
      return isMeSpeakingSmooth;
    }
    return !!p.isSpeaking;
  };

  const getParticipantVolume = (p: any) => {
    if (p.isMuted) return 0;
    if (p.id === currentAdminId) {
      return activeCall.isMuted ? 0 : audioLevel;
    }
    if (p.isSpeaking) {
      // Generate dynamic speaking volume fluctuations (simulating realistic speech waveforms)
      const time = Date.now() * 0.015;
      const wave = Math.sin(time) * 30 + Math.cos(time * 1.6) * 15 + 45;
      const isWordGap = Math.sin(time * 0.22) < -0.55;
      return isWordGap ? 0 : Math.max(10, Math.min(100, Math.floor(wave)));
    }
    return 0;
  };

  const showWebcamFeed = activeCall.isCameraOn && localCamStream;

  const getParticipantColor = (p: any) => {
    if (p.id === currentAdminId) return "#10b981"; // Emerald
    const idLower = String(p.id).toLowerCase();
    if (idLower.includes("arun")) return "#06b6d4"; // Cyan
    if (idLower.includes("priya")) return "#2dd4bf"; // Teal
    if (idLower.includes("karthik") || idLower.includes("rahul")) return "#a855f7"; // Purple
    if (idLower.includes("sarah") || idLower.includes("anita")) return "#f43f5e"; // Rose
    return "#3b82f6"; // Blue
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0F19] flex flex-col overflow-hidden text-slate-100 select-none">
      
      {/* 1. Header (Google Meet style minimal upper panel) */}
      <div className="h-14 bg-slate-900/60 border-b border-slate-800/60 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => setActiveCall(p => p ? { ...p, isMinimized: true } : null)} 
            className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg border border-slate-700" 
            title={"Minimize Call"}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white font-bold text-sm tracking-tight truncate">#{activeCall.roomId} {"&bull; IT War Room"}</span>
            <span className="text-slate-400 text-xs truncate max-w-[150px] sm:max-w-none hidden sm:inline">({activeCall.ticketTitle})</span>
          </div>
        </div>

        {/* Status markers */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{"REC"}{formatRecordingTimer(recordingSeconds)}</span>
            </div>
          )}

          {/* Network Indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            networkQuality === "excellent" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : networkQuality === "fair"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
          }`}>
            <Signal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{"Connection:"}</span>
            <span className="capitalize">{networkQuality}</span>
          </div>

          <div className="bg-slate-950 font-mono text-emerald-400 text-xs px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
            <CallDurationDisplay />
          </div>
        </div>
      </div>

      {/* 2. Workspace Layout */}
      <div className="flex-1 min-h-0 flex relative z-10 bg-[#070A13]">
        
        {/* Left Side: Video viewport */}
        <div className="flex-1 min-w-0 p-4 lg:p-6 flex flex-col justify-between relative overflow-hidden">
          
          {/* Sub-container for grid or pin-layout */}
          <div className="flex-1 w-full h-full flex flex-col justify-center min-h-0">
            {activeCall.isScreenSharing && screenStream ? (
              // ----------------- SCREEN SHARING ACTIVE VIEW -----------------
              <div className="flex-1 flex flex-col min-h-0 relative">
                <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col relative">
                  <div className="absolute top-4 left-4 bg-black/75 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 z-20 flex items-center gap-2 text-white shadow-lg">
                    <Monitor className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold">{"Screen Sharing LIVE"}</span>
                  </div>
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() => stopScreenShare()}
                      className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500"
                      title={"Stop Sharing Your Screen"}
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                      <span>{"Stop Sharing"}</span>
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <video 
                      ref={(el) => { if (el && el.srcObject !== screenStream) el.srcObject = screenStream; }}
                      autoPlay playsInline muted 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Floating Webcam Overlay Bubble (similar to Google Meet) */}
                <div className="absolute bottom-4 right-4 w-32 md:w-44 aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-2xl z-20 bg-slate-900">
                  {showWebcamFeed ? (
                    <video 
                      ref={(el) => { if (el && el.srcObject !== localCamStream) el.srcObject = localCamStream; }}
                      autoPlay playsInline muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#111625] text-white">
                      <div className="text-2xl">👩‍💼</div>
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-bold">{currentAdminName} {"(You)"}</div>
                </div>

                {/* Smaller preview strip for other participants */}
                <div className="h-24 md:h-28 mt-4 flex gap-3 overflow-x-auto pb-1 shrink-0 scrollbar-thin">
                  {activeCall.participants.map(p => {
                    const isMe = p.id === currentAdminId;
                    const hasCamera = isMe ? activeCall.isCameraOn : p.isCameraOn;
                    const isSpeakingNow = getIsParticipantSpeaking(p);
                    const volume = getParticipantVolume(p);
                    return (
                      <div 
                        key={p.id} 
                        className={`w-36 md:w-44 shrink-0 bg-[#161D30] rounded-xl overflow-hidden relative border-2 transition-all duration-300 ${
                          isSpeakingNow ? "border-emerald-500 shadow-md shadow-emerald-500/30" : "border-slate-800"
                        }`}
                      >
                        {isMe && hasCamera && localCamStream ? (
                          <video ref={(el) => { if (el && el.srcObject !== localCamStream) el.srcObject = localCamStream; }} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            {/* Circular Voice Ring */}
                            <div className="relative flex items-center justify-center">
                              {isSpeakingNow && (
                                <>
                                  <span 
                                    className="absolute rounded-full bg-emerald-500/10 border border-emerald-500/30 transition-all duration-75 animate-ping"
                                    style={{ 
                                      transform: `scale(${1 + (volume / 100) * 0.4})`,
                                      opacity: 0.1 + (volume / 100) * 0.3
                                    }} 
                                  />
                                  <span 
                                    className="absolute rounded-full bg-emerald-500/15 border border-emerald-500/30 transition-all duration-75"
                                    style={{ 
                                      width: `${100 + (volume / 100) * 40}%`,
                                      height: `${100 + (volume / 100) * 40}%`,
                                      opacity: 0.15 + (volume / 100) * 0.4
                                    }} 
                                  />
                                </>
                              )}
                              <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl transition-all relative z-10 ${isSpeakingNow ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-slate-900 scale-105" : ""}`}>{p.avatar}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Show Speaking Level */}
                        {isSpeakingNow && (
                          <div className="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur px-1 py-0.5 rounded text-[8px] border border-emerald-500/20 text-emerald-400 font-mono z-15">
                            {volume}%
                          </div>
                        )}

                        {/* Real-time Voice Wave overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-8 z-10 pointer-events-none">
                          <VoiceCanvasVisualizer volume={volume} isSpeaking={isSpeakingNow} color={getParticipantColor(p)} />
                        </div>

                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1.5 z-15">
                          <span className="text-white text-[9px] font-bold truncate max-w-[65px]">{p.name} {isMe && "(You)"}</span>
                          {p.isMuted ? (
                            <MicOff className="w-2.5 h-2.5 text-rose-500" />
                          ) : isSpeakingNow ? (
                            <div className="flex items-end gap-0.5 h-2.5 px-0.5 pointer-events-none">
                              <span className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(2, Math.min(10, volume * 0.4))}px` }} />
                              <span className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(3, Math.min(10, volume * 0.8))}px` }} />
                              <span className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(2, Math.min(10, volume * 0.5))}px` }} />
                            </div>
                          ) : (
                            <Mic className="w-2.5 h-2.5 text-slate-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : pinnedParticipantId ? (
              // ----------------- PINNED LAYOUT -----------------
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* Large main pinned box */}
                <div className="flex-1 bg-slate-900/40 rounded-3xl overflow-hidden relative border border-slate-800/80 shadow-2xl flex flex-col justify-center">
                  {(() => {
                    const p = activeCall.participants.find(part => part.id === pinnedParticipantId) || activeCall.participants[0];
                    const isMe = p.id === currentAdminId;
                    const isSpeakingNow = getIsParticipantSpeaking(p);
                    const hasCamera = isMe ? activeCall.isCameraOn : p.isCameraOn;
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center relative">
                        {isMe && hasCamera && localCamStream ? (
                          <video
                            ref={(el) => { if (el && el.srcObject !== localCamStream) el.srcObject = localCamStream; }}
                            autoPlay playsInline muted
                            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : hasCamera ? (
                          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
                            <span className="text-6xl mb-3 animate-pulse">📹</span>
                            <span className="text-slate-400 text-xs">{"Simulated Web Camera Feed"}</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-slate-950/40">
                            <div className="relative">
                              {isSpeakingNow && (
                                <span className="absolute -inset-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-ping" />
                              )}
                              <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#182035] border border-slate-700 flex items-center justify-center text-5xl sm:text-6xl shadow-2xl transition-all ${
                                isSpeakingNow ? "ring-4 ring-emerald-500 ring-offset-4 ring-offset-slate-950" : ""
                              }`}>
                                {p.avatar}
                              </div>
                            </div>
                            {isSpeakingNow && (
                              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full animate-pulse tracking-wide">
                                {"🎙️ Speaking"}</span>
                            )}
                          </div>
                        )}

                        {/* Speaking Waveform overlay */}
                        {isSpeakingNow && (
                          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-12 bg-black/75 rounded-2xl border border-white/10 flex items-center px-4 backdrop-blur-md shadow-2xl overflow-hidden z-15">
                            <div className="w-12 h-full py-2 shrink-0 flex items-center">
                              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">{"VOICE"}</span>
                            </div>
                            <div className="flex-1 h-full py-1">
                              <VoiceCanvasVisualizer volume={getParticipantVolume(p)} isSpeaking={isSpeakingNow} color={getParticipantColor(p)} />
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 font-extrabold ml-2 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/20">{getParticipantVolume(p)}%</span>
                          </div>
                        )}

                        {/* Top corner pins */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <button 
                            onClick={() => setPinnedParticipantId(null)} 
                            className="bg-black/60 hover:bg-slate-800 text-white p-2.5 rounded-xl border border-white/10 flex items-center gap-1.5 text-xs font-bold transition-all"
                            title={"Unpin participant"}
                          >
                            <PinOff className="w-3.5 h-3.5 text-indigo-400" />
                            {"Unpin Pinned View"}</button>
                        </div>

                        {/* Hand Raise indicator */}
                        {raisedHands[p.id] && (
                          <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg animate-bounce">
                            <span>✋</span> {"Raised Hand"}</div>
                        )}

                        {/* Name badge */}
                        <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg">
                          <span className="text-white text-xs font-extrabold">{p.name} {isMe && "(You)"}</span>
                          {p.isMuted && <MicOff className="w-3.5 h-3.5 text-rose-500" />}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Row of non-pinned participants below */}
                <div className="h-28 md:h-32 mt-4 flex gap-3 overflow-x-auto pb-1 shrink-0 scrollbar-thin">
                  {activeCall.participants.map(p => {
                    const isMe = p.id === currentAdminId;
                    const hasCamera = isMe ? activeCall.isCameraOn : p.isCameraOn;
                    const isSpeakingNow = getIsParticipantSpeaking(p);
                    const volume = getParticipantVolume(p);
                    return (
                      <div 
                        key={p.id} 
                        className={`w-36 md:w-48 shrink-0 bg-[#161D30] rounded-2xl overflow-hidden relative border-2 transition-all group ${
                          isSpeakingNow ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-slate-800"
                        }`}
                      >
                        {isMe && hasCamera && localCamStream ? (
                          <video ref={(el) => { if (el && el.srcObject !== localCamStream) el.srcObject = localCamStream; }} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <div className={`w-12 h-12 rounded-full bg-[#1e273e] border border-slate-700 flex items-center justify-center text-2xl ${isSpeakingNow ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950" : ""}`}>{p.avatar}</div>
                          </div>
                        )}

                        {/* Hover Overlay for actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all z-10">
                          <button 
                            onClick={() => setPinnedParticipantId(p.id)} 
                            className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-lg text-white"
                            title={"Pin view"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Raised Hand indicator */}
                        {raisedHands[p.id] && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 p-1.5 rounded-lg text-[10px] font-black leading-none">
                            ✋
                          </div>
                        )}

                        {/* Real-time Voice Wave overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-8 z-10 pointer-events-none">
                          <VoiceCanvasVisualizer volume={volume} isSpeaking={isSpeakingNow} color={getParticipantColor(p)} />
                        </div>

                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1.5 pointer-events-none z-15">
                          <span className="text-white text-[10px] font-bold truncate max-w-[80px]">{p.name} {isMe && "(You)"}</span>
                          {p.isMuted ? (
                            <MicOff className="w-3 h-3 text-rose-500" />
                          ) : isSpeakingNow ? (
                            <div className="flex items-end gap-0.5 h-2.5 px-0.5 pointer-events-none">
                              <span 
                                className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75" 
                                style={{ height: isMe ? `${Math.max(2, Math.min(8, audioLevel * 0.6))}px` : '5px' }} 
                              />
                              <span 
                                className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75" 
                                style={{ height: isMe ? `${Math.max(4, Math.min(8, audioLevel * 0.9))}px` : '8px' }} 
                              />
                              <span 
                                className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75" 
                                style={{ height: isMe ? `${Math.max(2, Math.min(8, audioLevel * 0.6))}px` : '4px' }} 
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // ----------------- STANDARD SPLIT GRID LAYOUT -----------------
              <div className={`flex-1 grid gap-4 auto-rows-fr ${activeCall.participants.length > 2 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {activeCall.participants.map(p => {
                  const isMe = p.id === currentAdminId;
                  const isSpeakingNow = getIsParticipantSpeaking(p);
                  const hasCamera = isMe ? activeCall.isCameraOn : p.isCameraOn;
                  const volume = getParticipantVolume(p);
                  return (
                    <div 
                      key={p.id} 
                      className={`bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden relative border-2 transition-all duration-300 group ${
                        isSpeakingNow 
                          ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-slate-900/80" 
                          : "border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      {isMe && hasCamera && localCamStream ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0e131f]">
                          <video
                            ref={(el) => { if (el && el.srcObject !== localCamStream) el.srcObject = localCamStream; }}
                            autoPlay playsInline muted
                            className="w-[80%] h-[80%] rounded-xl object-cover scale-x-[-1] border border-slate-700/50 shadow-md"
                          />
                        </div>
                      ) : hasCamera ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0e131f]">
                          <div className="w-[80%] h-[80%] rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-400 border border-slate-700/50 shadow-md">
                            <span className="text-4xl mb-2 animate-pulse">📹</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                              {"Remote Camera"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0e131f]">
                          <div className="relative w-[80%] h-[80%] rounded-xl bg-[#161D30] border border-slate-850 flex items-center justify-center">
                            <div className="relative">
                              {isSpeakingNow && (
                                <span className="absolute -inset-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-pulse" />
                              )}
                              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#182035] border border-slate-700/85 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl transition-all ${
                                isSpeakingNow ? "ring-4 ring-emerald-500 ring-offset-4 ring-offset-slate-950 scale-105" : ""
                              }`}>
                                {p.avatar}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all z-10 pointer-events-none">
                        <button 
                          onClick={() => setPinnedParticipantId(p.id)} 
                          className="bg-indigo-600 hover:bg-indigo-700 p-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 shadow-lg pointer-events-auto"
                          title={"Pin View"}
                        >
                          <Pin className="w-3.5 h-3.5" /> {"Pin View"}</button>
                      </div>

                      {/* Raised Hand indicator */}
                      {raisedHands[p.id] && (
                        <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 px-3 py-1 rounded-xl text-xs font-black shadow-lg animate-bounce flex items-center gap-1">
                          <span>✋</span> {"Hand Raised"}</div>
                      )}

                      {/* Real-time Voice Wave overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-12 z-10 pointer-events-none">
                        <VoiceCanvasVisualizer volume={volume} isSpeaking={isSpeakingNow} color={getParticipantColor(p)} />
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-15">
                        <div className="bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-md">
                          <span className="text-white text-xs font-bold">{p.name} {isMe && "(You)"}</span>
                          {p.isMuted ? (
                            <MicOff className="w-3.5 h-3.5 text-rose-500" />
                          ) : isSpeakingNow ? (
                            <div className="flex items-end gap-0.5 h-3 px-0.5 pointer-events-none">
                              <span 
                                className="w-0.75 bg-emerald-400 rounded-full transition-all duration-75" 
                                style={{ height: isMe ? `${Math.max(4, Math.min(12, audioLevel * 0.8))}px` : '8px' }} 
                              />
                              <span 
                                className="w-0.75 bg-emerald-400 rounded-full transition-all duration-75" 
                                style={{ height: isMe ? `${Math.max(6, Math.min(12, audioLevel * 1.2))}px` : '12px' }} 
                              />
                              <span 
                                className="w-0.75 bg-emerald-400 rounded-full transition-all duration-75" 
                                style={{ height: isMe ? `${Math.max(4, Math.min(12, audioLevel * 0.8))}px` : '6px' }} 
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Captions bottom overlay - automatically display speech transcripts above the toolbar if CC is toggled on */}
          {(() => {
            if (!activeCall.isCaptionsOn) return null;
            const speechTranscripts = activeCall.transcripts.filter(t => t.isSpeech);
            if (speechTranscripts.length === 0) return null;
            const lastSpeech = speechTranscripts[speechTranscripts.length - 1];
            return (
              <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none z-30">
                <div className="bg-black/85 backdrop-blur-md text-white text-sm md:text-base font-semibold px-5 py-3 rounded-xl border border-white/10 shadow-2xl max-w-2xl text-center pointer-events-auto leading-relaxed animate-fade-in">
                  <span className="text-indigo-400 font-extrabold">{lastSpeech.senderName}: </span>
                  <span>{lastSpeech.text}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Side: Sidebar Panels (Chat / Participants) */}
        <AnimatePresence>
          {activeSidebarTab && (
            <motion.div 
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-80 lg:w-96 bg-[#111625] border-l border-slate-800/80 flex flex-col shrink-0 shadow-2xl z-20 h-full relative"
            >
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeSidebarTab === "chat" ? (
                    <>
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-extrabold text-white uppercase tracking-wider">{"In-Call Chat Log"}</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-extrabold text-white uppercase tracking-wider">{"Participants list"}</span>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Content */}
              {activeSidebarTab === "chat" ? (
                // ---------------- CHAT CONTENT ----------------
                <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]/40">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {(() => {
                      const chatMessages = activeCall.transcripts.filter(t => !t.isSpeech);
                      if (chatMessages.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
                            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                            <span className="text-xs font-semibold">{"No chat messages yet."}</span>
                            <span className="text-[10px] mt-1 max-w-[200px]">{"Send a chat message to the team. Spoken sentences are kept separate in captions."}</span>
                          </div>
                        );
                      }
                      return chatMessages.map((t, idx) => {
                        const isMe = t.senderName === currentAdminName;
                        return (
                          <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className="flex items-baseline gap-1.5 mb-1 text-[10px]">
                              <span className="font-bold text-slate-400">{t.senderName}</span>
                              <span className="text-slate-500 font-mono">{t.time}</span>
                            </div>
                            <div className={`text-sm py-2 px-3.5 rounded-2xl max-w-[85%] border shadow-sm leading-relaxed ${
                              isMe 
                                ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none" 
                                : "bg-slate-850 border-slate-800 text-slate-100 rounded-tl-none"
                            }`}>
                              <p>{t.text}</p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Send chat block */}
                  <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                      placeholder={"Type message to team..."}
                      className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                    />
                    <button 
                      onClick={handleSendChatMessage}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors shadow"
                      title={"Send Message"}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // ---------------- PARTICIPANTS CONTENT ----------------
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B0F19]/40">
                  {activeCall.participants.map(p => {
                    const isMe = p.id === currentAdminId;
                    const isSpeakingNow = getIsParticipantSpeaking(p);
                    return (
                      <div key={p.id} className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl flex items-center justify-between hover:bg-slate-850/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm ring-1 ring-slate-700">
                            {p.avatar}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {p.name} {isMe && "(You)"}
                              {raisedHands[p.id] && <span className="text-amber-400">✋</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">{isMe ? "Support Coordinator" : p.role}</div>
                          </div>
                        </div>

                        {/* Participant details & pins */}
                        <div className="flex items-center gap-2">
                          {isSpeakingNow && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title={"Speaking"} />
                          )}
                          <button 
                            onClick={() => {
                              if (pinnedParticipantId === p.id) {
                                setPinnedParticipantId(null);
                              } else {
                                setPinnedParticipantId(p.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              pinnedParticipantId === p.id 
                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                            }`}
                            title={pinnedParticipantId === p.id ? "Unpin participant" : "Pin participant"}
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/60">
                <button 
                  onClick={postHuddleNotes}
                  className="w-full bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4 text-indigo-400" /> {"Export Huddle Logs to Feed"}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Floating Reaction Emojis rising animation */}
      <div className="absolute inset-x-0 bottom-24 h-96 pointer-events-none z-[80] overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((e) => (
            <motion.div
              key={e.id}
              initial={{ y: "100%", opacity: 0, scale: 0.5 }}
              animate={{ y: "0%", opacity: 1, scale: 1.4 }}
              exit={{ y: "-100%", opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute text-4xl"
              style={{ left: `${e.x}%` }}
            >
              {e.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. Persistent Warning/Toast notifications */}
      {alertToast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
          <div className="bg-[#111625] border border-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 pointer-events-auto select-none border-l-4 border-l-indigo-500 animate-bounce">
            <span>ℹ️</span>
            {alertToast}
          </div>
        </div>
      )}

      {/* 5. Modern Google Meet style Controls Toolbar */}
      <div className="h-22 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between shrink-0 z-30 px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
        
        {/* Left: Meeting code and mini time */}
        <div className="hidden md:flex flex-col justify-center text-left">
          <span className="text-white font-black text-sm font-mono tracking-tight">#{activeCall.roomId}</span>
          <span className="text-slate-400 text-xs mt-0.5">{"IT Huddle Bridge"}</span>
        </div>

        {/* Center: Controls Buttons */}
        <div className="flex items-center gap-3.5 mx-auto">
          {/* Microphone */}
          <button 
            onClick={() => {
              const nextMuted = !activeCall.isMuted;
              setActiveCall(p => p ? { ...p, isMuted: nextMuted } : null);
              if (!nextMuted && micPermission !== "granted") requestMicrophone();
            }} 
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeCall.isMuted 
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700" 
                : "bg-slate-800 hover:bg-slate-750 text-white"
            }`} 
            title={activeCall.isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {/* Camera */}
          <button 
            onClick={async () => {
              const nextCam = !activeCall.isCameraOn;
              setActiveCall(p => p ? { ...p, isCameraOn: nextCam } : null);
              if (nextCam) await requestCamera();
            }} 
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !activeCall.isCameraOn 
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700" 
                : "bg-slate-800 hover:bg-slate-750 text-white"
            }`} 
            title={!activeCall.isCameraOn ? "Turn On Camera" : "Turn Off Camera"}
          >
            {!activeCall.isCameraOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          
          {/* Screen Share */}
          <button 
            onClick={async () => {
              if (activeCall.isScreenSharing) {
                stopScreenShare();
              } else {
                try {
                  await requestScreenShare();
                } catch (err: any) {
                  triggerAlert(err.message || "Screen sharing failed.");
                }
              }
            }} 
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeCall.isScreenSharing 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700" 
                : "bg-slate-800 hover:bg-slate-750 text-white"
            }`} 
            title={activeCall.isScreenSharing ? "Stop Sharing" : "Share Screen"}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button 
            onClick={handleToggleRaiseHand}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              raisedHands[currentAdminId] 
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-600" 
                : "bg-slate-800 hover:bg-slate-750 text-white"
            }`} 
            title={"Raise Hand"}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Reactions popover trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer bg-slate-800 hover:bg-slate-750 text-white ${
                showMoreMenu ? "ring-2 ring-indigo-500" : ""
              }`} 
              title={"Reactions & Emojis"}
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {showMoreMenu && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#161D30] border border-slate-800 p-2.5 rounded-2xl flex gap-2 z-[100] shadow-2xl shrink-0">
                {["👍", "❤️", "😂", "🎉", "👏"].map((emoji) => (
                  <button 
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="hover:scale-130 active:scale-95 transition-transform text-2xl p-1 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speaker (Audio Output Volume Toggle) */}
          <button 
            onClick={() => {
              const nextMuted = !isVoicePlaybackMuted;
              setIsVoicePlaybackMuted(nextMuted);
              triggerAlert(nextMuted ? "Speakers muted (simulated voice synthesis paused)." : "Speakers unmuted.");
            }} 
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVoicePlaybackMuted 
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700" 
                : "bg-slate-800 hover:bg-slate-750 text-white"
            }`} 
            title={isVoicePlaybackMuted ? "Unmute Speakers" : "Mute Speakers"}
          >
            {isVoicePlaybackMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Captions Toggle Button */}
          <button 
            onClick={() => {
              const nextCC = !activeCall.isCaptionsOn;
              setActiveCall(p => p ? { ...p, isCaptionsOn: nextCC } : null);
              triggerAlert(nextCC ? "Captions (CC) enabled." : "Captions (CC) disabled.");
            }} 
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer font-black text-xs ${
              activeCall.isCaptionsOn 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700" 
                : "bg-slate-800 hover:bg-slate-750 text-white"
            }`} 
            title={activeCall.isCaptionsOn ? "Turn Off Captions" : "Turn On Captions"}
          >
            {"CC"}</button>

          {/* Switch Call Mode (Voice <-> Video) */}
          <button 
            onClick={async () => {
              const isVoice = activeCall.type === "voice";
              const nextType = isVoice ? "video" : "voice";
              setActiveCall(p => p ? { ...p, type: nextType, isCameraOn: isVoice } : null);
              if (isVoice && !localCamStream) {
                await requestCamera();
              }
              triggerAlert(`Switched huddle to ${nextType} conference mode.`);
              speakAnnouncement(`Switched to ${nextType} call.`);
            }} 
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer bg-slate-800 hover:bg-slate-750 text-white"
            title={activeCall.type === "voice" ? "Switch to Video Call" : "Switch to Voice Call"}
          >
            {activeCall.type === "voice" ? <Video className="w-5 h-5 text-indigo-400" /> : <Phone className="w-5 h-5 text-emerald-400" />}
          </button>
          
          <div className="w-px h-6 bg-slate-800 mx-1"></div>
          
          {/* Leave Call (red button) */}
          <button 
            onClick={() => setShowConfirmLeave(true)} 
            className="h-11 px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            title={"Leave Bridge"}
          >
            <PhoneOff className="w-4.5 h-4.5 mr-2 animate-pulse" /> {"Leave"}</button>
        </div>

        {/* Right Side: Sidebar Toggles & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Participants toggler */}
          <button 
            onClick={() => setActiveSidebarTab(activeSidebarTab === "participants" ? null : "participants")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
              activeSidebarTab === "participants" 
                ? "bg-indigo-600/25 text-indigo-400 border border-indigo-500/30" 
                : "bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300"
            }`}
            title={"Participants"}
          >
            <Users className="w-4.5 h-4.5" />
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
              {activeCall.participants.length}
            </span>
          </button>

          {/* Chat toggler */}
          <button 
            onClick={() => setActiveSidebarTab(activeSidebarTab === "chat" ? null : "chat")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
              activeSidebarTab === "chat" 
                ? "bg-indigo-600/25 text-indigo-400 border border-indigo-500/30" 
                : "bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300"
            }`}
            title={"Chat log"}
          >
            <MessageSquare className="w-4.5 h-4.5" />
            {activeCall.transcripts.length > 0 && (
              <span className="absolute top-1 right-1 bg-indigo-500 w-2 h-2 rounded-full shadow animate-ping" />
            )}
          </button>

          {/* Standard Recording Button */}
          <button 
            onClick={() => {
              if (isRecording) {
                stopRecordingSession();
                triggerAlert("⏺ Recording finalized and archived.");
              } else {
                startRecordingSession();
                triggerAlert("🔴 Screen & Audio recording session started.");
              }
            }}
            className={`w-24 h-10 rounded-xl flex items-center justify-center gap-1.5 px-3 border transition-all ${
              isRecording 
                ? "bg-rose-500/20 text-rose-500 border-rose-500/30 hover:bg-rose-500/30 animate-pulse" 
                : "bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300"
            }`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${isRecording ? "animate-ping" : ""}`} />
            <span className="text-xs font-bold">{isRecording ? "Stop Rec" : "Record"}</span>
          </button>
        </div>
      </div>

      {/* 6. Leave confirmation / Save Chat? Modal */}
      <AnimatePresence>
        {showConfirmLeave && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111625] border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center"
            >
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{"Leave incident bridge?"}</h3>
              <p className="text-slate-400 text-xs mb-6">
                {"Would you like to auto-save and compile the huddle's live chat log/transcripts to the general ticket activity stream?"}</p>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleLeaveMeetingConfirm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {"Yes, Save Chat &amp; Leave"}</button>
                <button 
                  onClick={() => handleLeaveMeetingConfirm(false)}
                  className="bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {"No, Leave Without Saving"}</button>
                <button 
                  onClick={() => setShowConfirmLeave(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {"Keep Chat Active"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
