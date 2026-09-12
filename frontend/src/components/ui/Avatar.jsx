import React, { useState } from 'react';
import { getAvatarUrl, getInitials } from '../../utils/avatar';

const SIZE_MAP = {
  xs: {
    container: 'w-6 h-6 text-[10px]',
    img: 'w-6 h-6',
  },
  sm: {
    container: 'w-8 h-8 text-xs',
    img: 'w-8 h-8',
  },
  md: {
    container: 'w-10 h-10 text-sm font-semibold',
    img: 'w-10 h-10',
  },
  lg: {
    container: 'w-14 h-14 text-base font-bold',
    img: 'w-14 h-14',
  },
  xl: {
    container: 'w-20 h-20 text-xl font-bold',
    img: 'w-20 h-20',
  },
  '2xl': {
    container: 'w-28 h-28 text-3xl font-bold',
    img: 'w-28 h-28',
  },
};

export default function Avatar({
  src,
  name,
  size = 'md',
  className = '',
  ring = true,
}) {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const avatarUrl = getAvatarUrl(src);
  const initials = getInitials(name);

  // If source exists and hasn't failed to load, show the image
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ${sizeConfig.img} ${
          ring ? 'ring-2 ring-brand-500/30 shadow-sm' : ''
        } ${className}`}
      />
    );
  }

  // Otherwise, render styled initials avatar
  return (
    <div
      className={`rounded-full bg-gradient-to-tr from-brand-600/30 to-teal-500/20 text-brand-300 border border-brand-500/40 flex items-center justify-center font-bold shrink-0 tracking-wider ${
        sizeConfig.container
      } ${ring ? 'ring-2 ring-brand-500/20 shadow-sm' : ''} ${className}`}
      title={name || 'User Avatar'}
    >
      {initials}
    </div>
  );
}
