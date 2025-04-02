
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Define types for auth context
type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  age: number;
  height: number;
  weight: number;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      // Check for active Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Fetch user profile from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profile && !error) {
          setUser(profile as UserProfile);
        }
      } else if (isMockMode) {
        // For development without Supabase, use demo user
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            setUser(profile as UserProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [isMockMode]);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      if (isMockMode) {
        // For development without Supabase, use mock login
        if (username === 'demo') {
          const mockUser: UserProfile = {
            id: 'mock-id-123',
            username: 'demo',
            name: 'Demo User',
            age: 25,
            height: 170,
            weight: 70,
            created_at: new Date().toISOString(),
          };
          
          setUser(mockUser);
          localStorage.setItem('mockUser', JSON.stringify(mockUser));
          return;
        } else {
          throw new Error('In demo mode, only username "demo" is accepted');
        }
      }
      
      // First, get user by username to get their email
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (profileError || !userProfile) {
        throw new Error('Invalid credentials');
      }
      
      // Then sign in with email/password
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username}@example.com`, // Using username as email for demo
        password,
      });
      
      if (error) {
        throw error;
      }
      
      setUser(userProfile as UserProfile);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    
    try {
      if (isMockMode) {
        // For development without Supabase, use mock registration
        const mockUser: UserProfile = {
          id: `mock-id-${Date.now()}`,
          username: userData.username,
          name: userData.name,
          age: userData.age,
          height: userData.height,
          weight: userData.weight,
          created_at: new Date().toISOString(),
        };
        
        setUser(mockUser);
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        return;
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', userData.username)
        .single();
      
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      // Create auth user first (using username as email for simplicity)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${userData.username}@example.com`,
        password: userData.password,
      });
      
      if (authError || !authData.user) {
        throw authError || new Error('Failed to create user');
      }
      
      // Create user profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          username: userData.username,
          name: userData.name,
          age: userData.age,
          height: userData.height,
          weight: userData.weight,
        }]);
      
      if (profileError) {
        throw profileError;
      }
      
      // Get the created profile
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      setUser(newProfile as UserProfile);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    if (isMockMode) {
      // For development without Supabase, clear local storage
      localStorage.removeItem('mockUser');
      setUser(null);
      return;
    }
    
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
