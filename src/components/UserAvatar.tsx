import React from 'react';
import { useAuth } from '../lib/AuthContext';

interface UserAvatarProps {
  className?: string;
}

export function UserAvatar({ className = "w-8 h-8 rounded-full" }: UserAvatarProps) {
  const { dbUser } = useAuth();
  
  if (dbUser?.avatar_url) {
    return (
      <img 
        src={dbUser.avatar_url} 
        alt={dbUser.name} 
        className={`${className} object-cover`}
      />
    );
  }
  
  return (
    <div className={`${className} bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold uppercase shadow-inner`}>
      {dbUser?.name?.[0] || dbUser?.email?.[0] || 'U'}
    </div>
  );
}
