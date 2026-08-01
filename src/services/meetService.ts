// Google Meet Service

export interface MeetingRecord {
  id: string;
  title: string;
  meetLink: string;
  hostName: string;
  status: "scheduled" | "active" | "ended";
  startedAt: string;
  endedAt?: string;
  participants: string[];
}

const MEETINGS_CACHE_KEY = "google_meet_records_v1";

export const MeetService = {
  // Get active/past meetings
  async getMeetings(): Promise<MeetingRecord[]> {
    try {
      const response = await fetch("/api/meet/status");
      if (response.ok) {
        const data = await response.json();
        if (data.meetings && Array.isArray(data.meetings)) {
          localStorage.setItem(MEETINGS_CACHE_KEY, JSON.stringify(data.meetings));
          return data.meetings;
        }
      }
    } catch {
      console.warn("Using local meeting records");
    }

    try {
      const raw = localStorage.getItem(MEETINGS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Create Google Meet Meeting
  async createMeeting(title: string, hostName: string, participants: string[] = []): Promise<MeetingRecord> {
    try {
      const response = await fetch("/api/meet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, hostName, participants }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.meeting) {
          const current = await this.getMeetings();
          localStorage.setItem(MEETINGS_CACHE_KEY, JSON.stringify([data.meeting, ...current]));
          return data.meeting;
        }
      }
    } catch (err) {
      console.warn("Failed to create meet on backend, executing client generator", err);
    }

    // Fallback room creation
    const created: MeetingRecord = {
      id: "meet_" + Math.random().toString(36).substr(2, 8),
      title: title || "Workplace Hub Sync",
      meetLink: "https://meet.google.com/new",
      hostName: hostName || "Administrator",
      status: "active",
      startedAt: new Date().toISOString(),
      participants,
    };

    const current = await this.getMeetings();
    localStorage.setItem(MEETINGS_CACHE_KEY, JSON.stringify([created, ...current]));
    return created;
  },

  // End Meeting
  async endMeeting(meetingId: string): Promise<boolean> {
    try {
      await fetch("/api/meet/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
    } catch {
      console.warn("Server end meeting API call");
    }

    const current = await this.getMeetings();
    const updated = current.map((m) => {
      if (m.id === meetingId) {
        return { ...m, status: "ended" as const, endedAt: new Date().toISOString() };
      }
      return m;
    });
    localStorage.setItem(MEETINGS_CACHE_KEY, JSON.stringify(updated));
    return true;
  }
};
