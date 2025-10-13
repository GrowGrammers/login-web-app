import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  className = '',
  children = '←'
}) => {
  return (
    <button 
      className={`bg-transparent border-0 text-2xl cursor-pointer text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default BackButton;
