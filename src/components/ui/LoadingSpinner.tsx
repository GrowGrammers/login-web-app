import React from 'react';
import { LOADING_STYLES } from '../../styles';

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
        return LOADING_STYLES.small;
      case 'lg':
        return LOADING_STYLES.large;
      case 'md':
      default:
        return LOADING_STYLES.default;
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
