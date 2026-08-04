import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.ts';
import { User } from '@supabase/supabase-js';
import { isEmailAdmin, getAdminRoleByEmail } from './AdminManagementHelper.ts';

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthContext] Fetching initial session via getSession()"); supabase.auth.getSession().then(({ data: { session } }) => { console.log("[AuthContext] getSession() returned:", session ? "Session exists for " + session.user?.email : "No session");
      if (session?.provider_token) {
        localStorage.setItem("google_workspace_access_token", session.provider_token);
        localStorage.setItem("google_gmail_auth", "true");
      }
      setUser(session?.user ?? null);
      if (session?.user) {
         syncUser(session.user);
      } else {
         setLoading(false);
      }
    }).catch(console.error);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { console.log("[AuthContext] onAuthStateChange triggered - Event: " + _event + ", Session:", session ? "Exists for " + session.user?.email : "None");
      if (session?.provider_token) {
        localStorage.setItem("google_workspace_access_token", session.provider_token);
        localStorage.setItem("google_gmail_auth", "true");
      }
      setUser(session?.user ?? null);
      if (session?.user) {
         syncUser(session.user);
      } else {
         setDbUser(null);
         setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUser = async (u: User) => {
     const email = u.email || '';
     const isAdminVal = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase()) || isEmailAdmin(email);
     const role = isAdminVal ? 'admin' : 'user';
     const sub_role = isAdminVal ? getAdminRoleByEmail(email) : 'user';
     
     const full_name = u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0];
     const avatar_url = u.user_metadata?.avatar_url || '';
     
     const payload = {
        id: u.id,
        email: email,
        name: full_name,
        role: role,
        sub_role: sub_role,
        avatar_url: avatar_url
     };

     // Optionally UPSERT into users table if RLS allows
     try {
       await supabase.from('users').upsert(payload, { onConflict: 'id' });
     } catch (e: any) { 
         // completely suppress sync errors to prevent AI Studio error surfaces if RLS policies are not applied
     }
     
     setDbUser({ id: u.id, uid: u.id, email, name: full_name, role, sub_role, avatar_url });
     setLoading(false);
  }

  const logOut = async () => {
    localStorage.removeItem("dcms_ai_chat_threads_v1");
    await supabase.auth.signOut();
  };

  const updateAvatar = async (url: string) => {
    if (!user) return;
    try {
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (dbUser) {
        setDbUser({ ...dbUser, avatar_url: url });
      }
      // optional: update public.users if applicable
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

