
import { supabase } from '@/integrations/supabase/client';
import { RegisterData } from '@/types/auth';
import type { UserProfile } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useAuthOperations(
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  isMockMode: boolean
) {
  const { toast } = useToast();
  
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
      
      // Real Supabase login
      // First check if user exists in the Users table
      const { data: existingUser, error: userError } = await supabase
        .from('Users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError || !existingUser) {
        throw new Error('Invalid credentials');
      }
      
      // Simple password verification (Note: In a real app, this should be done server-side!)
      if (existingUser.password_hash !== password) {
        throw new Error('Invalid credentials');
      }
      
      // Create user profile from database record
      const userProfile: UserProfile = {
        id: existingUser.user_id.toString(),
        username: existingUser.username,
        name: existingUser.full_name,
        age: existingUser.age,
        height: existingUser.height_cm,
        weight: existingUser.weight_kg,
      };
      
      setUser(userProfile);
      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      
      toast({
        title: 'Success',
        description: 'You have successfully logged in',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
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
        
        toast({
          title: 'Success',
          description: 'Account created successfully in mock mode',
        });
        return;
      }
      
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('Users')
        .select('username')
        .eq('username', userData.username)
        .single();
      
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      // Generate a unique user ID
      const user_id = Date.now(); // Simple approach for demo purposes
      
      // Insert new user into Users table
      const { error: insertError } = await supabase
        .from('Users')
        .insert([{
          user_id: user_id,
          username: userData.username,
          password_hash: userData.password, // In a real app, this should be hashed!
          full_name: userData.name,
          age: userData.age,
          height_cm: userData.height,
          weight_kg: userData.weight
        }]);
      
      if (insertError) {
        console.error('Registration error:', insertError);
        throw new Error(insertError.message || 'Failed to create account');
      }
      
      // Create user profile object
      const userProfile: UserProfile = {
        id: user_id.toString(),
        username: userData.username,
        name: userData.name,
        age: userData.age,
        height: userData.height,
        weight: userData.weight,
        created_at: new Date().toISOString(),
      };
      
      // Set the user in state and localStorage
      setUser(userProfile);
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      
      toast({
        title: 'Success',
        description: 'Your account has been created successfully',
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Registration failed',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    if (isMockMode) {
      // For development without Supabase, clear local storage
      localStorage.removeItem('mockUser');
      localStorage.removeItem('currentUser');
      setUser(null);
      return;
    }
    
    // Clear user from localStorage
    localStorage.removeItem('currentUser');
    setUser(null);
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  return {
    login,
    register,
    logout
  };
}
