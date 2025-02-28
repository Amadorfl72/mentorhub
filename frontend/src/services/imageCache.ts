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
const pendingRequests: { [url: string]: Promise<string> } = {};

// Cargar la caché desde localStorage
const loadCache = (): ImageCache => {
  const cached = localStorage.getItem(IMAGE_CACHE_KEY);
  return cached ? JSON.parse(cached) : {};
};

// Guardar la caché en localStorage
const saveCache = (cache: ImageCache): void => {
  localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
};

// Convertir una URL de imagen a data URL
export const convertImageToDataURL = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return '';
  
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      cache: 'force-cache',
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
    return imageUrl; // Fallback to original URL if conversion fails
  }
};

// Obtener una imagen de la caché o cargarla si no existe
export const getCachedImage = async (
  imageUrl: string, 
  expiresIn: number = 24 * 60 * 60 * 1000 // 24 horas por defecto
): Promise<string> => {
  if (!imageUrl) return '';
  
  const cache = loadCache();
  const now = Date.now();
  
  // Si la imagen está en caché y no ha expirado, devolverla
  if (cache[imageUrl] && cache[imageUrl].timestamp + cache[imageUrl].expiresIn > now) {
    return cache[imageUrl].dataUrl;
  }
  
  // Si ya hay una solicitud en curso para esta URL, reutilizarla
  if (Object.prototype.hasOwnProperty.call(pendingRequests, imageUrl)) {
    return pendingRequests[imageUrl];
  }
  
  // Si no está en caché o ha expirado, cargarla
  try {
    // Crear una promesa para esta solicitud y almacenarla
    pendingRequests[imageUrl] = (async () => {
      try {
        const dataUrl = await convertImageToDataURL(imageUrl);
        
        // Actualizar la caché
        const updatedCache = loadCache(); // Recargar la caché por si cambió
        updatedCache[imageUrl] = {
          dataUrl,
          timestamp: now,
          expiresIn
        };
        
        saveCache(updatedCache);
        return dataUrl;
      } finally {
        // Eliminar esta solicitud de las pendientes cuando termine
        delete pendingRequests[imageUrl];
      }
    })();
    
    return pendingRequests[imageUrl];
  } catch (error) {
    console.error(`Error caching image for URL ${imageUrl}:`, error);
    delete pendingRequests[imageUrl];
    return imageUrl; // Fallback to original URL if caching fails
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