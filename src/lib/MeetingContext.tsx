import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.tsx";
import { supabase } from "./supabase.ts";

export type HuddleParticipant = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isCameraOn: boolean;
};

export type MeetingStatus = "Scheduled" | "Waiting" | "Live" | "Ended" | "Cancelled";

export type MeetingRecord = {
  id: string;
  type: "voice" | "video";
  title: string;
  hostId: string;
  participants: string[];
  createdAt: string;
  startTime?: string;
  endTime?: string;
  status: MeetingStatus;
  duration?: string;
  recordingAvailable?: boolean;
};

export type ActiveCall = {
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
  ticketNumber: string;
  ticketTitle: string;
  incoming?: boolean;
  hostId?: string;
};

type MeetingContextType = {
  activeCall: ActiveCall | null;
  setActiveCall: React.Dispatch<React.SetStateAction<ActiveCall | null>>;
  startHuddleCall: (roomId: string, type: "voice" | "video", participants: HuddleParticipant[], ticketNumber: string, ticketTitle: string) => void;
  endHuddleCall: () => void;
  meetings: MeetingRecord[];
  setMeetings: React.Dispatch<React.SetStateAction<MeetingRecord[]>>;
  scheduleMeeting: (title: string, type: "voice" | "video", participants: string[]) => void;
  joinMeeting: (meetingId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
};

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const { dbUser } = useAuth();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("dcms_meetings_v2");
    if (saved) {
      setMeetings(JSON.parse(saved));
    }
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!dbUser) return;
    const channel = supabase.channel('global_calls');
    
    channel.on('broadcast', { event: 'incoming_call' }, (payload: any) => {
      const callData = payload.payload;
      if (activeCall) return;
      
      const isInvited = callData.participants.some((p: any) => p.id === dbUser.id);
      if (isInvited && callData.hostId !== dbUser.id) {
        setActiveCall({
          roomId: callData.roomId,
          type: callData.type,
          status: "ringing",
          isMuted: false,
          isCameraOn: callData.type === "video",
          isScreenSharing: false,
          isSpeakerActive: true,
          isCaptionsOn: false,
          isMinimized: false,
          duration: 0,
          participants: callData.participants,
          ticketNumber: callData.ticketNumber,
          ticketTitle: callData.ticketTitle,
          incoming: true,
          hostId: callData.hostId
        });
      }
    });

    channel.on('broadcast', { event: 'call_rejected' }, (payload: any) => {
      if (activeCall && activeCall.status === 'calling' && payload.payload.roomId === activeCall.roomId) {
        setActiveCall(null);
      }
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [dbUser, activeCall]);

  const saveMeetings = (updated: MeetingRecord[]) => {
    setMeetings(updated);
    localStorage.setItem("dcms_meetings_v2", JSON.stringify(updated));
  }

  const startHuddleCall = (roomId: string, type: "voice" | "video", participants: HuddleParticipant[], ticketNumber: string, ticketTitle: string) => {
    const isDirect = type === 'voice';
    
    setActiveCall({
      roomId,
      type,
      status: "calling",
      isMuted: false,
      isCameraOn: type === "video",
      isScreenSharing: false,
      isSpeakerActive: true,
      isCaptionsOn: false,
      isMinimized: false,
      duration: 0,
      participants,
      ticketNumber,
      ticketTitle,
      hostId: dbUser?.id
    });
    
    const channel = supabase.channel('global_calls');
    channel.send({
      type: 'broadcast',
      event: 'incoming_call',
      payload: {
        roomId, type, participants, ticketNumber, ticketTitle, hostId: dbUser?.id
      }
    });
    
    const newMeeting: MeetingRecord = {
      id: roomId,
      type,
      title: ticketTitle || (isDirect ? "Direct Call" : "Team Sync"),
      hostId: dbUser?.id || "unknown",
      participants: participants.map(p => p.name),
      createdAt: new Date().toISOString(),
      startTime: new Date().toISOString(),
      status: "Live",
    };
    saveMeetings([newMeeting, ...meetings]);
  };

  const scheduleMeeting = (title: string, type: "voice" | "video", participants: string[]) => {
    const newMeeting: MeetingRecord = {
      id: "meet_" + Math.random().toString(36).substr(2, 9),
      type,
      title,
      hostId: dbUser?.id || "unknown",
      participants,
      createdAt: new Date().toISOString(),
      status: "Scheduled",
    };
    saveMeetings([newMeeting, ...meetings]);
  }
  
  const joinMeeting = (meetingId: string) => {
    const m = meetings.find(x => x.id === meetingId);
    if (!m) return;
    
    const updated = meetings.map(x => x.id === meetingId ? { ...x, status: "Live" as const, startTime: x.startTime || new Date().toISOString() } : x);
    saveMeetings(updated);
    
    setActiveCall({
      roomId: m.id,
      type: m.type,
      status: "connected",
      isMuted: false,
      isCameraOn: m.type === "video",
      isScreenSharing: false,
      isSpeakerActive: true,
      isCaptionsOn: false,
      isMinimized: false,
      duration: 0,
      participants: [],
      ticketNumber: "",
      ticketTitle: m.title
    });
  }

  const endHuddleCall = () => {
    if (activeCall) {
      const updated = meetings.map(m => {
        if (m.id === activeCall.roomId && m.status === "Live") {
          const end = new Date();
          const start = new Date(m.startTime || end.toISOString());
          const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);
          return {
            ...m,
            status: "Ended" as const,
            endTime: end.toISOString(),
            duration: diffMin > 0 ? `${Math.floor(diffMin / 60)}h ${diffMin % 60}m` : '0h 1m',
            recordingAvailable: m.type === 'video'
          };
        }
        return m;
      });
      saveMeetings(updated);
    }
    setActiveCall(null);
  };

  const acceptCall = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, status: "connected", incoming: false });
    }
  };

  const rejectCall = () => {
    if (activeCall) {
      const channel = supabase.channel('global_calls');
      channel.send({
        type: 'broadcast',
        event: 'call_rejected',
        payload: { roomId: activeCall.roomId, userId: dbUser?.id }
      });
      setActiveCall(null);
    }
  };

  return (
    <MeetingContext.Provider value={{
      activeCall, setActiveCall, startHuddleCall, endHuddleCall, meetings, setMeetings, scheduleMeeting, joinMeeting, acceptCall, rejectCall
    }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
}
