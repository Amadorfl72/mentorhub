import { User } from '../context/AuthContext';
import { postData, fetchData } from './apiService';

export interface Session {
  id?: number;
  title: string;
  description: string;
  mentor_id: number;
  scheduled_time: string;
  max_attendees: number;
  keywords?: string;
  mentees?: User[];
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'http://localhost:5001';

// Función auxiliar para manejar las peticiones HTTP
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  // Verifica el formato del token (para depuración)
  // console.log('Token:', token);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // Asegúrate de que el formato sea "Bearer [token]"
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Response error:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  // Verificar si hay contenido en la respuesta
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  // Si no hay contenido JSON, devolver un objeto vacío o true
  return {};
};

// Añade esta función para verificar si el token es válido
const isTokenValid = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Intenta hacer una solicitud a un endpoint que requiera autenticación
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verificando token:', error);
    return false;
  }
};

// Crear una nueva sesión
export const createSession = async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
  try {
    return await postData('sessions', sessionData);
  } catch (error) {
    console.error('Error al crear la sesión:', error);
    throw error;
  }
};

// Obtener una sesión específica por ID
export const getSession = async (sessionId: number): Promise<Session | null> => {
  try {
    return await fetchData(`sessions/${sessionId}`);
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
    throw error;
  }
};

// Obtener todas las sesiones del usuario actual (como mentor)
export const getMentorSessions = async (): Promise<Session[]> => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) throw new Error('Usuario no autenticado');
    
    // Aquí ya estamos filtrando por mentor_id, así que está bien
    return await fetchWithAuth(`/sessions?mentor_id=${user.id}`);
  } catch (error) {
    console.error('Error al obtener las sesiones:', error);
    throw error;
  }
};

// Obtener todas las sesiones (sin filtrar)
export const getAllSessions = async (): Promise<Session[]> => {
  try {
    return await fetchWithAuth(`/sessions`);
  } catch (error) {
    console.error('Error al obtener todas las sesiones:', error);
    throw error;
  }
};

// Obtener todas las sesiones del usuario actual (como aprendiz)
export const getApprenticeSessions = async (): Promise<Session[]> => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) throw new Error('Usuario no autenticado');
    
    return await fetchWithAuth(`/sessions?mentee_id=${user.id}`);
  } catch (error) {
    console.error('Error al obtener las sesiones:', error);
    throw error;
  }
};

// Actualizar una sesión existente
export const updateSession = async (sessionId: number, sessionData: Partial<Session>): Promise<Session> => {
  try {
    return await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData)
    });
  } catch (error) {
    console.error('Error al actualizar la sesión:', error);
    throw error;
  }
};

// Eliminar una sesión
export const deleteSession = async (sessionId: number): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar la sesión:', error);
    throw error;
  }
};

// Inscribir a un aprendiz en una sesión
export const enrollMentee = async (sessionId: number, menteeId: number): Promise<any> => {
  try {
    return await fetchWithAuth(`/sessions/${sessionId}/enrol`, {
      method: 'POST',
      body: JSON.stringify({ mentee_id: menteeId })
    });
  } catch (error) {
    console.error('Error al inscribir al aprendiz:', error);
    throw error;
  }
};

// Desuscribir a un aprendiz de una sesión
export const unenrollMentee = async (sessionId: number, menteeId: number): Promise<any> => {
  try {
    return await fetchWithAuth(`/sessions/${sessionId}/unenrol`, {
      method: 'POST',
      body: JSON.stringify({ mentee_id: menteeId })
    });
  } catch (error) {
    console.error('Error al desuscribir al aprendiz:', error);
    throw error;
  }
}; 