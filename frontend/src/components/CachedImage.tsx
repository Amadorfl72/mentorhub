import React, { useState, useEffect, memo } from 'react';
import { getCachedImage } from '../services/imageCache';

// Definir los valores válidos para referrerPolicy
type ReferrerPolicy = 
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  referrerPolicy?: ReferrerPolicy;
}

const CachedImage: React.FC<CachedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = 'https://via.placeholder.com/40',
  crossOrigin = 'anonymous',
  referrerPolicy = 'no-referrer'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    if (!src) {
      setImageSrc(fallbackSrc);
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        const cachedSrc = await getCachedImage(src);
        
        // Verificar si el componente sigue montado antes de actualizar el estado
        if (isMounted) {
          setImageSrc(cachedSrc);
          setError(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading cached image:', err);
        
        // Verificar si el componente sigue montado antes de actualizar el estado
        if (isMounted) {
          setImageSrc(fallbackSrc);
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();
    
    // Función de limpieza para evitar actualizar el estado si el componente se desmonta
    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc]);

  return (
    <>
      {loading && (
        <div className={`${className} bg-gray-700 animate-pulse`}></div>
      )}
      {!loading && (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          crossOrigin={crossOrigin}
          referrerPolicy={referrerPolicy}
          onError={() => {
            if (!error) {
              setImageSrc(fallbackSrc);
              setError(true);
            }
          }}
        />
      )}
    </>
  );
};

// Usar memo para evitar renderizados innecesarios
export default memo(CachedImage); 