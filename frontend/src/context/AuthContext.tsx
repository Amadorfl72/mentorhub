import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  photoBlob?: string;
  skills?: string;
  interests?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const convertImageToDataURL = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        cache: 'force-cache',
      });
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      return imageUrl;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      setIsAuthenticated(true);
      
      if (parsedUser.photoUrl && !parsedUser.photoBlob) {
        convertImageToDataURL(parsedUser.photoUrl).then(dataUrl => {
          const updatedUser = { ...parsedUser, photoBlob: dataUrl };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        });
      }
    }
  }, []);

  const login = async (data: { token: string; user: User }) => {
    let userData = { ...data.user };
    
    if (userData.photoUrl) {
      try {
        const dataUrl = await convertImageToDataURL(userData.photoUrl);
        userData.photoBlob = dataUrl;
      } catch (error) {
        console.error('Error caching profile image:', error);
      }
    }
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(data.token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (userData.photoUrl && user?.photoUrl !== userData.photoUrl) {
        userData.photoBlob = await convertImageToDataURL(userData.photoUrl);
      }
      
      const updatedUser = user ? { ...user, ...userData } : null;
      setUser(updatedUser);
      
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 