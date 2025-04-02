
import { createClient } from '@supabase/supabase-js';

// Get environment variables or use empty strings as fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock Supabase client for development when credentials are missing
const createMockClient = () => {
  console.warn('Using mock Supabase client. Authentication features will not work.');
  
  // Return a mock client with the same interface but no real functionality
  return {
    auth: {
      signUp: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
      signInWithPassword: async () => ({ data: { session: { user: { id: 'mock-user-id' } } }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
        single: async () => ({ data: null, error: null }),
      }),
      insert: async () => ({ error: null }),
    }),
  };
};

// Create the Supabase client or use mock if credentials are missing
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not set. Authentication features will use mock data.');
}

export type UserProfile = {
  id: string;
  username: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  created_at?: string;
};
