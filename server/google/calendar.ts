// Server Google Calendar Helper

export interface ServerCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  meetLink?: string;
  htmlLink?: string;
  attendees?: Array<{ email: string }>;
  status: string;
  created_at: string;
}

// In-memory / server cache store for calendar events
const serverEventsStore: ServerCalendarEvent[] = [];

export async function createCalendarEventOnServer(eventData: {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  addMeet?: boolean;
}): Promise<ServerCalendarEvent> {
  const eventId = "cal_srv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  const meetLink = eventData.addMeet ? "https://meet.google.com/new" : undefined;

  const event: ServerCalendarEvent = {
    id: eventId,
    summary: eventData.summary,
    description: eventData.description,
    start: { dateTime: eventData.startTime },
    end: { dateTime: eventData.endTime },
    meetLink,
    htmlLink: meetLink || `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(eventData.summary)}`,
    attendees: (eventData.attendees || []).map((email) => ({ email })),
    status: "confirmed",
    created_at: new Date().toISOString(),
  };

  serverEventsStore.unshift(event);
  return event;
}

export function getServerCalendarEvents(): ServerCalendarEvent[] {
  return serverEventsStore;
}

export function deleteServerCalendarEvent(id: string): boolean {
  const idx = serverEventsStore.findIndex((e) => e.id === id);
  if (idx !== -1) {
    serverEventsStore.splice(idx, 1);
    return true;
  }
  return false;
}
