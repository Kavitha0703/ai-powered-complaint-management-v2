import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables. Authentication and database features will fail.");
}

const createMockQuery = () => {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => chain,
    then: (resolve: any) => resolve({ data: [], error: { message: "Supabase not configured" } }),
    catch: (reject: any) => chain
  };
  // Make it a real Promise
  return Object.assign(Promise.resolve({ data: [], error: { message: "Supabase not configured" } }), chain);
};

const createMockSupabase = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: "Supabase not configured" } }),
      signInWithOAuth: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null })
    },
    from: (table: string) => {
      const mockQuery = () => {
        const q: any = Promise.resolve({ data: [], error: null });
        q.select = () => mockQuery();
        q.insert = () => mockQuery();
        q.update = () => mockQuery();
        q.delete = () => mockQuery();
        q.eq = () => mockQuery();
        q.order = () => mockQuery();
        q.limit = () => mockQuery();
        q.single = () => mockQuery();
        return q;
      };
      return mockQuery();
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: "Supabase not configured" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } })
      })
    }
  } as any as SupabaseClient;
};

const isInvalidUrl = !supabaseUrl || supabaseUrl.includes("placeholder") || supabaseUrl.includes("example.com") || supabaseUrl === "mock";
export const supabase = (!isInvalidUrl && supabasePublishableKey) 
  ? createClient(supabaseUrl, supabasePublishableKey)
  : createMockSupabase();
