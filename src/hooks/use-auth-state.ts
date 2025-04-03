
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/lib/supabase';

export function useAuthState() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        if (isMockMode) {
          // For development without Supabase, use demo user from localStorage
          const storedUser = localStorage.getItem('mockUser') || localStorage.getItem('currentUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          // Check for stored user in localStorage
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [isMockMode]);

  return {
    user,
    setUser,
    isLoading,
    setIsLoading,
    isAuthenticated: !!user,
    isMockMode
  };
}
