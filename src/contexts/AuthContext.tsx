
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for user and auth context
type User = {
  id: string;
  username: string;
  name: string;
  age: number;
  height: number;
  weight: number;
};

type AuthContextType = {
  user: User | null;
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

// Mock user data for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'demo',
    name: 'Demo User',
    age: 30,
    height: 175,
    weight: 70,
  },
];

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user by username (mock authentication)
    const foundUser = MOCK_USERS.find(u => u.username === username);
    
    if (foundUser) {
      // In a real app, verify password here
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  // Register function
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if username already exists
    if (MOCK_USERS.some(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }
    
    // Create new user (in a real app, save to database)
    const newUser: User = {
      id: (MOCK_USERS.length + 1).toString(),
      username: userData.username,
      name: userData.name,
      age: userData.age,
      height: userData.height,
      weight: userData.weight,
    };
    
    // Add to mock users array (in a real app, save to database)
    MOCK_USERS.push(newUser);
    
    // Auto-login after registration
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    setIsLoading(false);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
