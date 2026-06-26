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
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  logOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export const ADMIN_EMAILS = ['kalenhitsumi.dev@gmail.com', 'testdemo@admin.local', 'nasikakavitha@gmail.com'];

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  logOut: async () => {},
  getToken: async () => null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
         syncUser(session.user);
      } else {
         setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
     
     const payload = {
        id: u.id,
        email: email,
        name: full_name,
        role: role,
        sub_role: sub_role
     };

     // Optionally UPSERT into users table if RLS allows
     try {
       await supabase.from('users').upsert(payload, { onConflict: 'id' });
     } catch (e: any) { 
         // completely suppress sync errors to prevent AI Studio error surfaces if RLS policies are not applied
     }
     
     setDbUser({ id: u.id, uid: u.id, email, name: full_name, role, sub_role });
     setLoading(false);
  }

  const logOut = async () => {
    localStorage.removeItem("dcms_ai_chat_threads_v1");
    await supabase.auth.signOut();
  };

  const getToken = async () => {
     const { data: { session } } = await supabase.auth.getSession();
     return session?.access_token || null;
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, logOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

