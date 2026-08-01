// Google Calendar Integration Service

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  location?: string;
  meetLink?: string;
  htmlLink?: string;
  attendees?: string[];
  status?: string;
}

const LOCAL_CALENDAR_CACHE_KEY = "google_calendar_events_v2";

export const CalendarService = {
  // Get all cached or server events
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await fetch("/api/calendar/events");
      if (response.ok) {
        const data = await response.json();
        if (data.events && Array.isArray(data.events)) {
          localStorage.setItem(LOCAL_CALENDAR_CACHE_KEY, JSON.stringify(data.events));
          return data.events;
        }
      }
    } catch {
      console.warn("Using local calendar storage");
    }

    // Fallback to local storage
    try {
      const raw = localStorage.getItem(LOCAL_CALENDAR_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Create Calendar Event
  async createEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    try {
      const response = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.event) {
          const events = await this.getEvents();
          localStorage.setItem(LOCAL_CALENDAR_CACHE_KEY, JSON.stringify([data.event, ...events]));
          return data.event;
        }
      }
    } catch (err) {
      console.warn("Failed to create event on server API, storing locally", err);
    }

    // Fallback local creation
    const created: CalendarEvent = {
      ...event,
      id: "evt_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      htmlLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.summary)}`,
      meetLink: event.meetLink || "https://meet.google.com/new",
    };

    const current = await this.getEvents();
    const updated = [created, ...current];
    localStorage.setItem(LOCAL_CALENDAR_CACHE_KEY, JSON.stringify(updated));
    return created;
  },

  // Delete Event
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await fetch(`/api/calendar/delete?id=${eventId}`, { method: "DELETE" });
    } catch {
      console.warn("Server delete API unverified");
    }

    const current = await this.getEvents();
    const filtered = current.filter((e) => e.id !== eventId);
    localStorage.setItem(LOCAL_CALENDAR_CACHE_KEY, JSON.stringify(filtered));
    return true;
  }
};
