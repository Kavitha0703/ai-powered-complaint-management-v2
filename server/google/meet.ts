// Server Google Meet Helper

export interface ServerMeeting {
  id: string;
  title: string;
  meetLink: string;
  hostName: string;
  status: "scheduled" | "active" | "ended";
  startedAt: string;
  endedAt?: string;
  participants: string[];
}

const serverMeetingsStore: ServerMeeting[] = [];

export async function createGoogleMeetOnServer(
  title: string,
  hostName: string,
  participants: string[] = []
): Promise<ServerMeeting> {
  const meetingId = "meet_srv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  // Official instant Google Meet room creator link
  const meetLink = "https://meet.google.com/new";

  const meeting: ServerMeeting = {
    id: meetingId,
    title: title || "Workplace Hub Team Sync",
    meetLink,
    hostName: hostName || "Administrator",
    status: "active",
    startedAt: new Date().toISOString(),
    participants,
  };

  serverMeetingsStore.unshift(meeting);
  return meeting;
}

export function getServerMeetings(): ServerMeeting[] {
  return serverMeetingsStore;
}

export function endServerMeeting(id: string): boolean {
  const meeting = serverMeetingsStore.find((m) => m.id === id);
  if (meeting) {
    meeting.status = "ended";
    meeting.endedAt = new Date().toISOString();
    return true;
  }
  return false;
}
