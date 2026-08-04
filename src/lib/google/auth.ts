import { supabase } from "../supabase.ts";

export interface GoogleUserSession {
  user: any;
  accessToken?: string;
  provider?: string;
}

export async function signInWithGoogle(opts?: { isAdmin?: boolean }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Ensure any stale session is cleared before initiating a fresh OAuth flow
    await supabase.auth.signOut();

    const redirectPath = opts?.isAdmin ? "/admin" : "/dashboard";
    const targetRedirectUrl = `${window.location.origin}${redirectPath}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: targetRedirectUrl,
        scopes: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar",
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.url) {
      window.location.href = data.url;
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return { success: false, error: err.message || "Failed to initiate Google authentication." };
  }
}

export async function signOutGoogle(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Google SignOut error:", error);
    return true;
  } catch {
    return false;
  }
}

export async function getGoogleProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
