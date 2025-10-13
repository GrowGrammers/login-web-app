import React from 'react';

interface AuthStatusBadgeProps {
  isAuthenticated: boolean;
  className?: string;
}

const AuthStatusBadge: React.FC<AuthStatusBadgeProps> = ({ 
  isAuthenticated, 
  className = '' 
}) => {
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${
      isAuthenticated 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    } ${className}`}>
      {isAuthenticated ? '🟢 인증됨' : '🔴 미인증'}
    </span>
  );
};

export default AuthStatusBadge;
