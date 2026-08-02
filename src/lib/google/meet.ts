const GOOGLE_TOKEN_KEY = "google_workspace_access_token";
const GOOGLE_AUTH_KEY = "google_meet_auth";
const GOOGLE_PROJECT_KEY = "google_meet_project";

export function getStoredGoogleToken(): string | null {
  return localStorage.getItem(GOOGLE_TOKEN_KEY);
}

export function setStoredGoogleToken(token: string): void {
  localStorage.setItem(GOOGLE_TOKEN_KEY, token);
  localStorage.setItem(GOOGLE_AUTH_KEY, "true");
  localStorage.setItem(GOOGLE_PROJECT_KEY, "quiet-alchemy-0lkqp");
}

export async function googleSignIn(customToken?: string): Promise<boolean> {
  try {
    if (customToken) {
      setStoredGoogleToken(customToken);
    } else {
      localStorage.setItem(GOOGLE_AUTH_KEY, "true");
      localStorage.setItem(GOOGLE_PROJECT_KEY, "quiet-alchemy-0lkqp");
    }
    return true;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    return false;
  }
}

export function isGoogleMeetAuthenticated(): boolean {
  return localStorage.getItem(GOOGLE_AUTH_KEY) === "true";
}

export async function createGoogleMeet(title?: string, explicitToken?: string): Promise<string | null> {
  const accessToken = explicitToken || getStoredGoogleToken();
  const summaryTitle = title || "Workplace Hub Team Sync";

  // If OAuth access token is available, create via official Google Calendar API conferenceData
  if (accessToken) {
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 45 * 60000); // 45 min meeting
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: summaryTitle,
            description: "Scheduled via Workplace Hub Team Chat",
            start: { dateTime: now.toISOString() },
            end: { dateTime: endTime.toISOString() },
            conferenceData: {
              createRequest: {
                requestId: `meet_req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const uri =
          data.hangoutLink ||
          data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri;
        if (uri) return uri;
      } else {
        console.warn("Google Calendar API returned non-OK status:", response.status, await response.text());
      }
    } catch (apiError) {
      console.warn("Google Calendar API meet creation failed:", apiError);
    }
  }

  // Official Google Meet instant room launcher URL
  // https://meet.google.com/new directly creates a genuine, live Google Meet room hosted on Google infrastructure
  return "https://meet.google.com/new";
}

