import React, { useState } from 'react';
import { photoUrl, thumbUrl } from '../api.js';

// Loads the small server-side thumbnail, falling back to the original photo.
export default function Thumb({ filename, alt = '', className = '' }) {
  const [src, setSrc] = useState(thumbUrl(filename));
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => src !== photoUrl(filename) && setSrc(photoUrl(filename))}
      className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
