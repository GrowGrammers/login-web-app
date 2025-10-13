import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = '#fbbf24',
  className = '' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'md':
      default:
        return 'w-6 h-6';
    }
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <div 
        className={`${getSizeClasses()} border-2 border-gray-200 border-t-current rounded-full animate-spin`}
        style={{ borderTopColor: color }}
      />
    </div>
  );
};

export default LoadingSpinner;
