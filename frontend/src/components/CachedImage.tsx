import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMentorInfo } from '../services/userService';

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
  userId?: number | string; // Si se proporciona, se usará para obtener la foto de un usuario específico
}

const CachedImage: React.FC<CachedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/images/default-avatar.svg',
  crossOrigin = 'anonymous',
  referrerPolicy = 'no-referrer',
  useUserPhoto = false,
  userId
}) => {
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState<string>(src || fallbackSrc);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      setIsUsingFallback(false);
      
      // console.log(`CachedImage: Loading image for userId=${userId}, src=${src}, alt=${alt}`);
      
      // Si se proporciona un userId específico, obtener la foto de ese usuario
      if (userId) {
        try {
          // Asegurarse de que userId sea un número
          const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
          
          // Si userIdNum no es un número válido o es cero, usar fallback
          if (isNaN(userIdNum) || userIdNum === 0) {
            console.warn(`Invalid userId provided: ${userId}`);
            setImageSrc(fallbackSrc);
            setIsUsingFallback(true);
            setLoading(false);
            return;
          }
          
          // console.log(`CachedImage: Fetching user info for ID ${userIdNum}`);
          const userInfo = await getMentorInfo(userIdNum);
          // console.log(`CachedImage: Received user info:`, userInfo);
          
          if (userInfo && userInfo.photoBlob) {
            // console.log(`CachedImage: Using photoBlob for user ${userIdNum}`);
            setImageSrc(userInfo.photoBlob);
            setLoading(false);
            return;
          } else if (userInfo && userInfo.photoUrl) {
            // console.log(`CachedImage: Using photoUrl for user ${userIdNum}: ${userInfo.photoUrl}`);
            setImageSrc(userInfo.photoUrl);
            setLoading(false);
            return;
          } else {
            // console.log(`CachedImage: No photo found for user ${userIdNum}, using fallback`);
          }
        } catch (error) {
          console.error(`Error loading user photo for ID ${userId}:`, error);
          // Continuar con otras opciones si falla
        }
      }
      
      // Si se debe usar la foto del usuario actual y está disponible en el contexto
      if (useUserPhoto && user) {
        // Usar photoData (base64) si está disponible, sino usar photoUrl
        if (user.photoData) {
          setImageSrc(user.photoData);
          setLoading(false);
          return;
        } else if (user.photoUrl) {
          setImageSrc(user.photoUrl);
          setLoading(false);
          return;
        }
      }
      
      // Si no se usa la foto del usuario, usar la URL proporcionada
      if (src) {
        setImageSrc(src);
        setLoading(false);
        return;
      }
      
      // Si no hay URL, usar la imagen de fallback
      setImageSrc(fallbackSrc);
      setIsUsingFallback(true);
      setLoading(false);
    };
    
    loadImage();
  }, [src, fallbackSrc, user, useUserPhoto, userId]);

  // Para generar iniciales cuando no hay imagen
  const getInitials = () => {
    if (!alt) return '?';
    return alt
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleImageError = () => {
    console.error(`CachedImage: Error loading image with src=${imageSrc}, userId=${userId}, fallbackSrc=${fallbackSrc}`);
    
    if (!error) {
      setError(true);
      setIsUsingFallback(true);
      
      // Verificar si el fallbackSrc existe y es una URL local
      if (fallbackSrc && fallbackSrc.startsWith('/')) {
        // console.log(`CachedImage: Using local fallback image: ${fallbackSrc}`);
        setImageSrc(fallbackSrc);
      } else {
        // Si no hay un fallback local válido, usamos iniciales
        // console.log(`CachedImage: No valid fallback, using initials for: ${alt}`);
        setImageSrc('');
      }
    }
  };

  return (
    <>
      {loading && (
        <div className={`${className} bg-gray-700 animate-pulse rounded-full`}></div>
      )}
      {!loading && imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          // Solo aplicar crossOrigin si no es un fallback o una URL local
          {...(!isUsingFallback && !imageSrc.startsWith('/') && { crossOrigin, referrerPolicy })}
          onError={handleImageError}
        />
      )}
      {(!loading && !imageSrc) && (
        // Fallback con iniciales cuando la imagen no carga
        <div 
          className={`${className} bg-blue-700 flex items-center justify-center text-white rounded-full`}
          style={{ fontSize: className.includes('w-6') ? '9px' : '12px' }}
        >
          {getInitials()}
        </div>
      )}
    </>
  );
};

// Usar memo para evitar renderizados innecesarios
export default memo(CachedImage); 