// Servicio para manejar operaciones relacionadas con usuarios
const API_URL = 'http://localhost:5001';

export interface MentorInfo {
  id: number;
  name: string;
  email?: string;
  photoUrl?: string;
  photoBlob?: string;
  role?: string;
}

// Caché local para almacenar información de mentores
const mentorsCache: Record<number, MentorInfo> = {};

// Función para obtener información de un mentor
export const getMentorInfo = async (mentorId: number): Promise<MentorInfo> => {
  console.log(`getMentorInfo: Called for user ID ${mentorId}`);
  
  // Si ya tenemos la información en caché, devolverla
  if (mentorsCache[mentorId]) {
    console.log(`getMentorInfo: Using cached info for ${mentorId}`);
    return mentorsCache[mentorId];
  }
  
  try {
    // Intentar obtener información del usuario actual si coincide con el ID del mentor
    const currentUserStr = localStorage.getItem('user');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      // Si el usuario actual es el mentor que buscamos
      if (currentUser.id === mentorId) {
        console.log(`getMentorInfo: User ${mentorId} is current user`);
        const mentorInfo: MentorInfo = {
          id: currentUser.id,
          name: currentUser.name || currentUser.username || `Mentor ${mentorId}`,
          email: currentUser.email,
          photoUrl: currentUser.photoUrl || generateAvatarUrl(currentUser.name || `User ${mentorId}`),
          photoBlob: currentUser.photoBlob,
          role: currentUser.role
        };
        
        // Guardar en caché
        mentorsCache[mentorId] = mentorInfo;
        return mentorInfo;
      }
    }
    
    // Si no es el usuario actual, obtener de la API
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log(`getMentorInfo: Fetching from API for user ${mentorId}`);
    const response = await fetch(`${API_URL}/users/${mentorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const userData = await response.json();
    console.log(`getMentorInfo: Received data for user ${mentorId}:`, userData);
    
    const mentorInfo: MentorInfo = {
      id: userData.id,
      name: userData.username || userData.name || `Mentor ${mentorId}`,
      email: userData.email,
      photoUrl: userData.photoUrl || generateAvatarUrl(userData.name || `User ${mentorId}`),
      photoBlob: userData.photo_data,
      role: userData.role
    };
    
    // Guardar en caché
    mentorsCache[mentorId] = mentorInfo;
    return mentorInfo;
  } catch (error) {
    console.error(`Error fetching mentor info for ID ${mentorId}:`, error);
    
    // En caso de error, devolver información básica con avatar generado
    const name = `User ${mentorId}`;
    const fallbackInfo: MentorInfo = {
      id: mentorId,
      name: name,
      photoUrl: generateAvatarUrl(name)
    };
    
    // Guardar en caché para evitar solicitudes repetidas
    mentorsCache[mentorId] = fallbackInfo;
    
    return fallbackInfo;
  }
};

// Función para generar URL de avatar con iniciales
function generateAvatarUrl(name: string): string {
  // Eliminar caracteres no alfanuméricos y espacios
  const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  // Generar una URL de avatar con UI Avatars
  const encodedName = encodeURIComponent(cleanName || 'User');
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
}

// Función para obtener información de varios mentores a la vez
export const getMentorsInfo = async (mentorIds: number[]): Promise<Record<number, MentorInfo>> => {
  // Eliminar duplicados sin usar spread de Set
  const uniqueIds: number[] = [];
  mentorIds.forEach(id => {
    if (!uniqueIds.includes(id)) {
      uniqueIds.push(id);
    }
  });
  
  const result: Record<number, MentorInfo> = {};
  
  // Procesar cada ID en paralelo
  const promises = uniqueIds.map(async (id) => {
    try {
      result[id] = await getMentorInfo(id);
    } catch (error) {
      console.error(`Error fetching mentor ${id}:`, error);
      // En caso de error, usar información básica
      result[id] = { 
        id, 
        name: `Mentor ${id}`,
        photoUrl: `https://ui-avatars.com/api/?name=Mentor+${id}&background=random`
      };
    }
  });
  
  await Promise.all(promises);
  
  return result;
};

// Función para obtener todos los usuarios (solo para administradores)
// Esta función no se usará en la implementación actual debido a problemas de CORS
export const getAllUsers = async (): Promise<MentorInfo[]> => {
  try {
    // Como tenemos problemas de CORS, devolvemos un array vacío
    console.warn('getAllUsers: Esta función no está disponible debido a problemas de CORS');
    return [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export default {
  getMentorInfo,
  getMentorsInfo,
  getAllUsers
}; 