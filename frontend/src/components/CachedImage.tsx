import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '../context/AuthContext';

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
  useUserPhoto?: boolean; // Usar la foto del usuario del contexto
}

const CachedImage: React.FC<CachedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = 'https://via.placeholder.com/40',
  crossOrigin = 'anonymous',
  referrerPolicy = 'no-referrer',
  useUserPhoto = false
}) => {
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Si se debe usar la foto del usuario y está disponible en el contexto
    if (useUserPhoto && user) {
      // Usar photoData (base64) si está disponible, sino usar photoUrl
      if (user.photoData) {
        setImageSrc(user.photoData);
        setLoading(false);
        setError(false);
        return;
      } else if (user.photoUrl) {
        setImageSrc(user.photoUrl);
        setLoading(false);
        setError(false);
        return;
      }
    }
    
    // Si no se usa la foto del usuario, usar la URL proporcionada
    if (src) {
      setImageSrc(src);
      setLoading(false);
      setError(false);
      return;
    }
    
    // Si no hay URL, usar la imagen de fallback
    setImageSrc(fallbackSrc);
    setLoading(false);
    setError(false);
  }, [src, fallbackSrc, user, useUserPhoto]);

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