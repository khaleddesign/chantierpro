'use client';

interface AvatarProps {
  name: string;
  role: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  image?: string;
  className?: string;
}

export default function Avatar({ name, role, size = 'md', image, className = '' }: AvatarProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'from-red-500 to-red-600';
      case 'COMMERCIAL': return 'from-green-500 to-green-600';
      case 'CLIENT': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-md ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getRoleColor(role)} flex items-center justify-center text-white font-semibold shadow-md ${className}`}>
      {getInitials(name)}
    </div>
  );
}

import Image from "next/image";

