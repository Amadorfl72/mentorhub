import { User } from '../context/AuthContext';

const API_URL = 'http://localhost:5001';

// Agregar un mecanismo de caché para evitar verificaciones repetidas
let lastVerification = {
  timestamp: 0,
  result: { valid: false, user: undefined },
  token: ''
};

export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { valid: false };
  }
  
  // Si el token es el mismo y la verificación es reciente (menos de 1 minuto), usar el resultado en caché
  const now = Date.now();
  if (token === lastVerification.token && now - lastVerification.timestamp < 60000) {
    return lastVerification.result;
  }
  
  try {
    // Comentar o eliminar este log para reducir el ruido en la consola
    // console.log('Verificando token:', token.substring(0, 20) + '...');
    
    const response = await fetch(`${API_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    if (!response.ok) {
      console.error('Error verificando token:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.error('Detalles del error:', errorData);
      return { valid: false };
    }
    
    const data = await response.json();
    
    // Comentar o eliminar este log para reducir el ruido en la consola
    // console.log('Respuesta de verificación de token:', data);
    
    // Guardar el resultado en caché
    lastVerification = {
      timestamp: now,
      result: {
        valid: data.valid,
        user: data.user
      },
      token
    };
    
    return lastVerification.result;
  } catch (error) {
    console.error('Error en la solicitud de verificación de token:', error);
    return { valid: false };
  }
}; 