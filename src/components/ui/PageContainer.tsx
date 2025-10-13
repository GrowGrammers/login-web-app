import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = '',
  maxWidth = 'xl'
}) => {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
      default:
        return 'max-w-xl';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${getMaxWidthClass()} mx-auto bg-white border-l border-r border-gray-200 shadow-xl ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
