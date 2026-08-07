// Replaced by Google Identity Services backend auth
export async function createGoogleMeetBackend(title: string, userId: string): Promise<string | null> {
  try {
    const response = await fetch("/api/google/meet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: title || "Workplace Hub Team Sync", userId }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.meetingUri;
    } else {
      console.warn("Backend Google Meet creation failed:", response.status);
    }
  } catch (error) {
    console.error("Failed to create Google Meet via backend:", error);
  }
  return null;
}
