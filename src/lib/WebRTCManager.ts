import { supabase } from "./supabase.ts";

type Signal = {
  type: 'offer' | 'answer' | 'ice-candidate';
  senderId: string;
  payload: any;
};

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private roomId: string;
  private userId: string;
  
  public onRemoteStream?: (stream: MediaStream) => void;
  public onCallEnded?: () => void;
  public onCallStateChange?: (state: 'ringing' | 'connected' | 'disconnected') => void;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
  }

  async initialize(isInitiator: boolean, audioOnly: boolean = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: !audioOnly, audio: true });
    } catch (err) {
      console.error("Failed to get local media", err);
      throw err;
    }

    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ]
    };
    this.pc = new RTCPeerConnection(config);

    this.localStream.getTracks().forEach(track => {
      if (this.localStream && this.pc) {
        this.pc.addTrack(track, this.localStream);
      }
    });

    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (this.onRemoteStream) {
          this.onRemoteStream(event.streams[0]);
        }
      }
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          senderId: this.userId,
          payload: event.candidate
        });
      }
    };
    
    this.pc.onconnectionstatechange = () => {
      if (this.pc?.connectionState === 'connected') {
        if (this.onCallStateChange) this.onCallStateChange('connected');
      }
      if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
        if (this.onCallStateChange) this.onCallStateChange('disconnected');
        this.endCall();
      }
    };

    this.channel = supabase.channel(`webrtc-${this.roomId}`);
    
    this.channel.on('broadcast', { event: 'signal' }, (payload: any) => {
      this.handleSignal(payload.payload as Signal);
    });

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        if (isInitiator) {
          if (this.onCallStateChange) this.onCallStateChange('ringing');
          const offer = await this.pc!.createOffer();
          await this.pc!.setLocalDescription(offer);
          this.sendSignal({
            type: 'offer',
            senderId: this.userId,
            payload: offer
          });
        }
      }
    });
  }

  private sendSignal(signal: Signal) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: signal
      });
    }
  }

  private async handleSignal(signal: Signal) {
    if (!this.pc) return;
    if (signal.senderId === this.userId) return; // Ignore own signals

    try {
      if (signal.type === 'offer') {
        if (this.onCallStateChange) this.onCallStateChange('ringing');
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.sendSignal({
          type: 'answer',
          senderId: this.userId,
          payload: answer
        });
      } else if (signal.type === 'answer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      } else if (signal.type === 'ice-candidate') {
        await this.pc.addIceCandidate(new RTCIceCandidate(signal.payload));
      }
    } catch (err) {
      console.error("Error handling signal", err);
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.pc) {
      this.pc.close();
    }
    if (this.channel) {
      this.channel.unsubscribe();
    }
    if (this.onCallEnded) {
      this.onCallEnded();
    }
  }
  
  getLocalStream() {
    return this.localStream;
  }
}
