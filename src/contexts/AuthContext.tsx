
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/supabase';

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
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
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
