import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  photoData?: string; // Imagen en base64 desde el backend
  skills?: string;
  interests?: string;
  admin?: boolean;
  language?: string;
  email_notifications?: boolean;
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

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
  }, []);

  const login = (data: { token: string; user: User }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
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
      if (!user) {
        throw new Error('No user to update');
      }
      
      // Asegurar que los valores booleanos se manejan explícitamente
      const processedData = { ...userData };
      
      // Convertir explícitamente los valores booleanos y evitar undefined
      if ('email_notifications' in processedData) {
        // Usar doble negación para convertir cualquier valor a boolean
        processedData.email_notifications = !!processedData.email_notifications;
        console.log('Valor de email_notifications procesado:', processedData.email_notifications);
      }
      
      console.log('Actualizando usuario con datos procesados:', processedData);
      
      const updatedUser = { ...user, ...processedData };
      
      console.log('Usuario actualizado final:', updatedUser);
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // No devolver el usuario para que coincida con Promise<void>
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