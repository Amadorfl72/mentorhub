import React, { useState, useEffect } from 'react';
import { Avatar } from 'flowbite-react';
import { getCachedImage } from '../services/imageCache';

interface CachedAvatarProps {
  img?: string;
  alt?: string;
  rounded?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const CachedAvatar: React.FC<CachedAvatarProps> = ({ 
  img, 
  alt = 'User', 
  rounded = true, 
  size = 'md',
  className = ''
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!img) {
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        const cachedSrc = await getCachedImage(img);
        setImageSrc(cachedSrc);
      } catch (err) {
        console.error('Error loading cached image for avatar:', err);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [img]);

  if (loading) {
    return (
      <div className={`rounded-full bg-gray-700 animate-pulse ${className}`} style={{
        width: size === 'xs' ? '1.5rem' : size === 'sm' ? '2rem' : size === 'md' ? '2.5rem' : size === 'lg' ? '3rem' : '3.5rem',
        height: size === 'xs' ? '1.5rem' : size === 'sm' ? '2rem' : size === 'md' ? '2.5rem' : size === 'lg' ? '3rem' : '3.5rem'
      }}></div>
    );
  }

  return (
    <Avatar 
      img={imageSrc || undefined}
      alt={alt}
      rounded={rounded}
      size={size}
      className={className}
    />
  );
};

export default CachedAvatar; 