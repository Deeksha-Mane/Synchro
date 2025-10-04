import { useState } from 'react';

export default function ImagePreview({ imageUrl, fallbackName, className = "w-32 h-32" }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'User')}&background=3b82f6&color=fff&size=200`;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className={`${className} relative`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
      <img
        src={imageError || !imageUrl ? fallbackUrl : imageUrl}
        alt="Profile"
        className={`${className} rounded-full object-cover border-4 border-white shadow-lg ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
}