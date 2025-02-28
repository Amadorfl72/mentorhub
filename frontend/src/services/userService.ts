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
  // Si ya tenemos la información en caché, devolverla
  if (mentorsCache[mentorId]) {
    return mentorsCache[mentorId];
  }
  
  // Intentar obtener información del usuario actual si coincide con el ID del mentor
  try {
    const currentUserStr = localStorage.getItem('user');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      // Si el usuario actual es el mentor que buscamos
      if (currentUser.id === mentorId) {
        const mentorInfo: MentorInfo = {
          id: currentUser.id,
          name: currentUser.name || currentUser.username || `Mentor ${mentorId}`,
          email: currentUser.email,
          photoUrl: currentUser.photoUrl,
          photoBlob: currentUser.photoBlob,
          role: currentUser.role
        };
        
        // Guardar en caché
        mentorsCache[mentorId] = mentorInfo;
        return mentorInfo;
      }
    }
    
    // Si no es el usuario actual, intentar obtener de la API
    // Pero como tenemos problemas de CORS, usaremos un fallback
    throw new Error('User not found in local storage');
  } catch (error) {
    console.error(`Error fetching mentor info for ID ${mentorId}:`, error);
    
    // En caso de error, devolver información básica
    const fallbackInfo: MentorInfo = {
      id: mentorId,
      name: `Mentor ${mentorId}`,
      photoUrl: `https://ui-avatars.com/api/?name=Mentor+${mentorId}&background=random`
    };
    
    // Guardar en caché para evitar solicitudes repetidas
    mentorsCache[mentorId] = fallbackInfo;
    
    return fallbackInfo;
  }
};

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