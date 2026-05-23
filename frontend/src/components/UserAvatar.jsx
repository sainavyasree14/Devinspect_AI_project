import React from 'react';
import { cn } from '@/lib/utils';

const UserAvatar = ({ user, size = 'md', className }) => {
  const avatar = user?.avatarUrl || localStorage.getItem('devinspect-avatar');
  const initials = user?.name?.charAt(0).toUpperCase() || 'U';

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-32 h-32 text-4xl',
  };

  return (
    <div className={cn(
      'rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0',
      sizes[size],
      className
    )}>
      {avatar ? (
        <img src={avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-primary">{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar;
