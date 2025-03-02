// Servicio para gestionar la caché de imágenes
const IMAGE_CACHE_KEY = 'user_images_cache';

interface ImageCacheEntry {
  dataUrl: string;
  timestamp: number;
  expiresIn: number; // tiempo en milisegundos
}

interface ImageCache {
  [imageUrl: string]: ImageCacheEntry;
}

// Objeto para rastrear solicitudes en curso
const pendingRequests: Record<string, Promise<string> | null> = {};

// Cargar la caché desde localStorage
const loadCache = (): ImageCache => {
  try {
    const cached = localStorage.getItem(IMAGE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error loading image cache:', error);
    return {};
  }
};

// Guardar la caché en localStorage
const saveCache = (cache: ImageCache): void => {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving image cache:', error);
  }
};

// Convertir una URL de imagen a data URL
export const convertImageToDataURL = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return '';
  
  // Verificar si es una URL de datos (data:image)
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      cache: 'force-cache',
      headers: {
        'Cache-Control': 'max-age=86400', // 24 horas
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to data URL:', error);
    return ''; // Retornar string vacío en caso de error
  }
};

// Obtener una imagen de la caché o cargarla si no existe
export const getCachedImage = async (
  imageUrl: string, 
  expiresIn: number = 24 * 60 * 60 * 1000 // 24 horas por defecto
): Promise<string> => {
  if (!imageUrl) return '';
  
  // Verificar si es una URL de datos (data:image)
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Verificar si es una URL de Google
  const isGoogleUrl = imageUrl.includes('googleusercontent.com');
  
  // Para URLs de Google, usar una caché más larga
  const actualExpiresIn = isGoogleUrl ? 7 * 24 * 60 * 60 * 1000 : expiresIn; // 7 días para Google
  
  const cache = loadCache();
  const now = Date.now();
  
  // Si la imagen está en caché y no ha expirado, devolverla
  if (cache[imageUrl] && cache[imageUrl].timestamp + cache[imageUrl].expiresIn > now) {
    return cache[imageUrl].dataUrl;
  }
  
  // Si ya hay una solicitud en curso para esta URL, reutilizarla
  if (pendingRequests[imageUrl]) {
    try {
      return await pendingRequests[imageUrl]!;
    } catch (error) {
      console.error(`Error in pending request for ${imageUrl}:`, error);
      pendingRequests[imageUrl] = null;
      return '';
    }
  }
  
  // Si no está en caché o ha expirado, cargarla
  try {
    // Crear una promesa para esta solicitud y almacenarla
    const promise = convertImageToDataURL(imageUrl);
    pendingRequests[imageUrl] = promise;
    
    const dataUrl = await promise;
    
    // Actualizar la caché solo si obtuvimos un dataUrl válido
    if (dataUrl) {
      const updatedCache = loadCache(); // Recargar la caché por si cambió
      updatedCache[imageUrl] = {
        dataUrl,
        timestamp: now,
        expiresIn: actualExpiresIn
      };
      
      saveCache(updatedCache);
    }
    
    // Limpiar la solicitud pendiente
    pendingRequests[imageUrl] = null;
    
    return dataUrl;
  } catch (error) {
    console.error(`Error caching image for URL ${imageUrl}:`, error);
    pendingRequests[imageUrl] = null;
    return '';
  }
};

// Limpiar entradas expiradas de la caché
export const cleanupCache = (): void => {
  const cache = loadCache();
  const now = Date.now();
  let hasChanges = false;
  
  Object.keys(cache).forEach(imageUrl => {
    if (cache[imageUrl].timestamp + cache[imageUrl].expiresIn < now) {
      delete cache[imageUrl];
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveCache(cache);
  }
};

// Iniciar limpieza periódica de la caché (llamar en el componente App)
export const initCacheCleanup = (interval: number = 60 * 60 * 1000): () => void => {
  const intervalId = setInterval(cleanupCache, interval);
  return () => clearInterval(intervalId);
}; 