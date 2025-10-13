import React from 'react';

interface MessageAlertProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  className?: string;
}

const MessageAlert: React.FC<MessageAlertProps> = ({ 
  message, 
  type = 'info',
  className = '' 
}) => {
  if (!message) return null;

  const getAlertStyles = (alertType: 'success' | 'error' | 'info') => {
    switch (alertType) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // 메시지에서 이모지로 타입 자동 감지
  const getAutoType = (msg: string): 'success' | 'error' | 'info' => {
    if (msg.includes('✅')) return 'success';
    if (msg.includes('❌')) return 'error';
    return 'info';
  };

  const finalType = type === 'info' ? getAutoType(message) : type;

  return (
    <div className={`p-4 rounded-xl mb-4 font-medium text-sm ${getAlertStyles(finalType)} ${className}`}>
      {message}
    </div>
  );
};

export default MessageAlert;
