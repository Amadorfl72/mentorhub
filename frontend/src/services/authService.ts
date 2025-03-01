import { User } from '../context/AuthContext';

const API_URL = 'http://localhost:5001';

export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { valid: false };
  }
  
  try {
    const response = await fetch(`${API_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    if (!response.ok) {
      return { valid: false };
    }
    
    const data = await response.json();
    return {
      valid: data.valid,
      user: data.user
    };
  } catch (error) {
    console.error('Error verificando token:', error);
    return { valid: false };
  }
}; 