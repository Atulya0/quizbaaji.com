import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  wallet_balance: number;
  kyc_verified: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (googleToken: string, userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Verify token and get updated user data
      axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(response => {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      })
      .catch(error => {
        console.error('Token verification failed:', error);
        logout();
      });
    }
    
    setLoading(false);
  }, []);

  const login = async (googleToken: string, userData: any) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/google`, {
        token: googleToken,
        email: userData.email,
        name: userData.name,
        google_id: userData.sub,
        avatar: userData.picture
      });

      const { access_token } = response.data;
      
      // Get user profile
      const profileResponse = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      setToken(access_token);
      setUser(profileResponse.data);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(profileResponse.data));
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    updateUser
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};