import React from 'react';
import { MESSAGE_STYLES } from '../../styles';

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

  const getMessageStyle = () => {
    switch (finalType) {
      case 'success':
        return MESSAGE_STYLES.success;
      case 'error':
        return MESSAGE_STYLES.error;
      case 'info':
      default:
        return MESSAGE_STYLES.info;
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
    <div className={`${getMessageStyle()} ${className}`}>
      {message}
    </div>
  );
};

export default MessageAlert;
