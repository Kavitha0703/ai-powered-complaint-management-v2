import { supabase } from "../lib/supabase.ts";
import { signInWithGoogle, signOutGoogle, getGoogleProfile } from "./googleAuth.ts";

export const AuthService = {
  // Email Password Sign In
  async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Account Registration
  async register(email: string, password: string, name: string) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          full_name: name,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  // Password Reset
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
    return data;
  },

  // Google OAuth Sign In
  async loginWithGoogle() {
    return await signInWithGoogle();
  },

  // Sign Out
  async logout() {
    await signOutGoogle();
    return await supabase.auth.signOut();
  },

  // Get current user session
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
    return await getGoogleProfile();
  }
};
