// Google Calendar Integration Helper

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  hangoutLink?: string;
  htmlLink?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  status?: string;
  type?: string;
  visibility?: 'Private' | 'Team';
  color?: string;
    priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  userId?: string;
}

const CALENDAR_AUTH_KEY = "google_calendar_auth";
const CALENDAR_PROJECT_KEY = "google_calendar_project";
const CALENDAR_EVENTS_CACHE_KEY = "google_calendar_events_cache_v1";

export function isGoogleCalendarAuthenticated(): boolean {
  return localStorage.getItem(CALENDAR_AUTH_KEY) === "true";
}

export async function googleCalendarSignIn(): Promise<boolean> {
  try {
    localStorage.setItem(CALENDAR_AUTH_KEY, "true");
    localStorage.setItem(CALENDAR_PROJECT_KEY, "default-project");
    return true;
  } catch (error) {
    console.error("Google Calendar Sign-In error:", error);
    return false;
  }
}

export function googleCalendarSignOut(): void {
  localStorage.removeItem(CALENDAR_AUTH_KEY);
  localStorage.removeItem(CALENDAR_PROJECT_KEY);
  localStorage.removeItem(CALENDAR_EVENTS_CACHE_KEY);
}

// Local cache helpers to ensure smooth offline or fallback user experience
export function getCachedCalendarEvents(): GoogleCalendarEvent[] {
  try {
    const data = localStorage.getItem(CALENDAR_EVENTS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCachedCalendarEvents(events: GoogleCalendarEvent[]): void {
  localStorage.setItem(CALENDAR_EVENTS_CACHE_KEY, JSON.stringify(events));
}

// API Calls
export async function fetchGoogleCalendarEvents(accessToken?: string, userId?: string): Promise<GoogleCalendarEvent[]> {
  if (accessToken) {
    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=50", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const events: GoogleCalendarEvent[] = (data.items || []).map((item: any) => ({
          id: item.id,
          summary: item.summary || "Untitled Event",
          description: item.description,
          start: item.start || { dateTime: new Date().toISOString() },
          end: item.end || { dateTime: new Date().toISOString() },
          location: item.location,
          hangoutLink: item.hangoutLink || item.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri,
          htmlLink: item.htmlLink,
          attendees: item.attendees,
          status: item.status,
        }));
        saveCachedCalendarEvents(events);
        return events;
      }
    } catch (err) {
      console.warn("Could not fetch Google Calendar events directly from API, using cached data", err);
    }
  }

  try {
    const res = await fetch('/api/calendar/events', {
      headers: { 'x-user-id': userId || '' }
    });
    if (res.ok) {
      const data = await res.json();
      return data.items || [];
    }
  } catch (err) {}
  return getCachedCalendarEvents();
}

export async function createGoogleCalendarEvent(
  eventData: {
    summary: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    attendees?: string[];
    addGoogleMeet?: boolean;
    type?: string;
    visibility?: 'Private' | 'Team';
    color?: string;
    priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
    userId?: string;
  },
  accessToken?: string
): Promise<GoogleCalendarEvent> {
  const localEventId = "gcal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
  const meetLink = eventData.addGoogleMeet ? "https://meet.google.com/new" : undefined;

  const newEvent: GoogleCalendarEvent = {
    id: localEventId,
    summary: eventData.summary,
    description: eventData.description,
    start: { dateTime: eventData.startTime },
    end: { dateTime: eventData.endTime },
    hangoutLink: meetLink,
    htmlLink: meetLink ? meetLink : `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(eventData.summary)}`,
    attendees: (eventData.attendees || []).map((email) => ({ email })),
    status: "confirmed",
    type: eventData.type || 'Personal',
    visibility: eventData.visibility || 'Private',
    color: eventData.color || 'blue',
    priority: eventData.priority || 'Normal',
    userId: eventData.userId,
  };

  if (accessToken) {
    try {
      const body: any = {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.startTime },
        end: { dateTime: eventData.endTime },
        attendees: (eventData.attendees || []).map((email) => ({ email })),
      };

      if (eventData.addGoogleMeet) {
        body.conferenceData = {
          createRequest: {
            requestId: `req_${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        };
      }

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        const item = await response.json();
        newEvent.id = item.id;
        newEvent.hangoutLink = item.hangoutLink || newEvent.hangoutLink;
        newEvent.htmlLink = item.htmlLink || newEvent.htmlLink;
      }
    } catch (err) {
      console.warn("Failed to create event directly on Google API, saved locally", err);
    }
  }

  // Update local cache
  const existing = getCachedCalendarEvents();
  saveCachedCalendarEvents([newEvent, ...existing]);

  return newEvent;
}

export async function deleteGoogleCalendarEvent(eventId: string, accessToken?: string, userId?: string): Promise<boolean> {
  if (accessToken) {
    try {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.warn("Failed to delete event via Google API", err);
    }
  }

  try {
    await fetch(`/api/calendar/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId || '' }
    });
  } catch (e) {}
  const existing = getCachedCalendarEvents();
  const filtered = existing.filter((e) => e.id !== eventId);
  saveCachedCalendarEvents(filtered);
  return true;
}
