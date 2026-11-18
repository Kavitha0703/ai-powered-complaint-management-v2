import { supabase } from "../supabase";

export interface GoogleUserSession {
  user: any;
  accessToken?: string;
  provider?: string;
}

export interface GoogleAuthResult {
  success: boolean;
  data?: any;
  error?: string;
  mode?: "popup" | "redirect";
  url?: string;
  popupBlocked?: boolean;
  popupWindow?: Window | null;
}

export async function signInWithGoogle(opts?: { isAdmin?: boolean; returnTo?: string }): Promise<GoogleAuthResult> {
  try {
    const isIframe = typeof window !== "undefined" && window.self !== window.top;
    const redirectPath = opts?.returnTo || (opts?.isAdmin ? "/admin" : "/dashboard");
    const targetRedirectUrl = isIframe
      ? `${window.location.origin}/auth/callback`
      : `${window.location.origin}${redirectPath}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: targetRedirectUrl,
        scopes: "openid email profile",
        skipBrowserRedirect: true,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      return { success: false, error: "Authentication server did not return a Google sign-in URL." };
    }

    if (isIframe) {
      const width = 520;
      const height = 660;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
      const popup = window.open(
        data.url,
        "dcms_google_oauth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        return {
          success: false,
          mode: "popup",
          url: data.url,
          popupBlocked: true,
          error: "Pop-up was blocked by your browser. Click the direct link below to sign in with Google.",
        };
      }

      return {
        success: true,
        mode: "popup",
        url: data.url,
        popupWindow: popup,
        data,
      };
    }

    window.location.href = data.url;
    return { success: true, mode: "redirect", url: data.url, data };
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return { success: false, error: err?.message || "Failed to initiate Google authentication." };
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
