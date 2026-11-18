import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { isEmailAdmin, getAdminRoleByEmail, getAdminInvites, saveAdminInvites } from './AdminManagementHelper';

interface DbUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  sub_role?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  logOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  updateAvatar: (url: string) => Promise<void>;
}

export const ADMIN_EMAILS = ['testdemo@admin.local', 'nasikakavitha@gmail.com'];

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  logOut: async () => {},
  getToken: async () => null,
  updateAvatar: async () => {}
});

export const useAuth = () => useContext(AuthContext);

const safeSetStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage access errors in restricted iframe contexts
  }
};

const safeRemoveStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage access errors
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const syncedDbUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Fallback: if this window is an OAuth popup that landed on an SPA route instead of /auth/callback
    try {
      if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        if (
          hash.includes('access_token=') ||
          hash.includes('error=') ||
          search.includes('code=') ||
          search.includes('error=')
        ) {
          window.opener.postMessage(
            { type: 'SUPABASE_OAUTH_CALLBACK', hash, search },
            window.location.origin
          );
          window.close();
        }
      }
    } catch {
      // Ignore cross-origin opener errors
    }

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn("[AuthContext] getSession() error:", error.message);
        }
        if (session?.provider_token) {
          safeSetStorage("google_workspace_access_token", session.provider_token);
          safeSetStorage("google_gmail_auth", "true");
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          syncUser(session.user);
        } else {
          setLoading(false);
        }
      })
      .catch((e) => {
        console.warn("[AuthContext] Caught getSession error gracefully:", e);
        if (mounted) {
          setUser(null);
          setDbUser(null);
          setLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.provider_token) {
        safeSetStorage("google_workspace_access_token", session.provider_token);
        safeSetStorage("google_gmail_auth", "true");
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUser(session.user);
      } else {
        syncedDbUserIdRef.current = null;
        setDbUser(null);
        setLoading(false);
      }
    });

    // Listen for OAuth completion from popup window (/auth/callback)
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'SUPABASE_OAUTH_CALLBACK') return;
      if (event.origin !== window.location.origin && !event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }

      const rawHash = typeof event.data.hash === 'string' ? event.data.hash.replace(/^#/, '') : '';
      const rawSearch = typeof event.data.search === 'string' ? event.data.search.replace(/^\?/, '') : '';
      const hashParams = new URLSearchParams(rawHash);
      const searchParams = new URLSearchParams(rawSearch);

      const oauthError = hashParams.get('error_description') || searchParams.get('error_description') || hashParams.get('error') || searchParams.get('error');
      if (oauthError) {
        window.dispatchEvent(new CustomEvent('dcms_oauth_error', { detail: oauthError }));
        return;
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const providerToken = hashParams.get('provider_token');
      const code = searchParams.get('code');

      try {
        if (providerToken) {
          safeSetStorage("google_workspace_access_token", providerToken);
          safeSetStorage("google_gmail_auth", "true");
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            window.dispatchEvent(new CustomEvent('dcms_oauth_error', { detail: error.message }));
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            window.dispatchEvent(new CustomEvent('dcms_oauth_error', { detail: error.message }));
          }
        }
      } catch (err: any) {
        window.dispatchEvent(new CustomEvent('dcms_oauth_error', { detail: err?.message || 'Failed to complete Google sign-in.' }));
      }
    };

    window.addEventListener('message', handleOAuthMessage);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  const syncUser = (u: User) => {
    const email = u.email || '';
    const cleanEmail = email.toLowerCase();
    const fallbackName = u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0] || 'User';
    const fallbackAvatar = u.user_metadata?.avatar_url || '';

    let isAdminVal = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail);
    let sub_role: string = isAdminVal ? 'super_admin' : 'user';

    try {
      // Auto-activate any pending invites for this email
      const invites = getAdminInvites();
      let invitesUpdated = false;
      const pendingIdx = invites.findIndex(i => i.email.toLowerCase() === cleanEmail && (i.status === "Pending" || i.status === "Active"));
      if (pendingIdx !== -1) {
        if (invites[pendingIdx].status === "Pending") {
          invites[pendingIdx].status = "Active";
          invites[pendingIdx].delivery_status = "Registered";
          invites[pendingIdx].name = fallbackName;
          invites[pendingIdx].last_active = "Just now";
          invitesUpdated = true;
        }
      }
      if (invitesUpdated) {
        saveAdminInvites(invites);
      }

      isAdminVal = isAdminVal || isEmailAdmin(email);
      sub_role = isAdminVal ? getAdminRoleByEmail(email) : 'user';
    } catch (inviteErr) {
      console.warn("[AuthContext] Invite sync warning:", inviteErr);
    }

    const role = isAdminVal ? 'admin' : 'user';

    // Immediately unblock UI render with verified session identity
    setDbUser({ id: u.id, uid: u.id, email, name: fallbackName, role, sub_role, avatar_url: fallbackAvatar });
    setLoading(false);

    // Sync profile to users table asynchronously in the background (at most once per user session)
    if (syncedDbUserIdRef.current !== u.id) {
      syncedDbUserIdRef.current = u.id;
      const payload = {
        id: u.id,
        email: email,
        name: fallbackName,
        role: role,
        sub_role: sub_role,
        avatar_url: fallbackAvatar
      };
      Promise.resolve(supabase.from('users').upsert(payload, { onConflict: 'id' })).catch(() => {
        // Suppress sync errors if RLS policies restrict client upsert
      });
    }
  };

  const logOut = async () => {
    safeRemoveStorage("dcms_ai_chat_threads_v1");
    await supabase.auth.signOut();
  };

  const updateAvatar = async (url: string) => {
    if (!user) return;
    try {
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (dbUser) {
        setDbUser({ ...dbUser, avatar_url: url });
      }
      await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
    } catch (e) {
      console.error('Failed to update avatar', e);
    }
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, logOut, getToken, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

