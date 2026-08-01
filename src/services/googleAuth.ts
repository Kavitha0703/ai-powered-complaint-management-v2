import { supabase } from "../lib/supabase.ts";

export interface GoogleUserSession {
  user: any;
  accessToken?: string;
  provider?: string;
}

export async function signInWithGoogle(opts?: { isAdmin?: boolean }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const redirectPath = opts?.isAdmin ? "/admin" : "/dashboard";
    const targetRedirectUrl = `${window.location.origin}${redirectPath}`;

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes("placeholder")) {
      console.warn("Supabase URL not configured. Simulating Google OAuth session.");
      return { 
        success: true, 
        data: { url: `${targetRedirectUrl}?oauth=google_simulated` } 
      };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: targetRedirectUrl,
        scopes: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        queryParams: {
          access_type: "offline",
          prompt: "select_account consent",
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
