import { useState, useEffect } from 'react';
import { resetAuthManager } from '../auth/authManager';
import type { OAuthProvider } from '../components/auth/oauth/providers/index';
import { getOAuthConfig } from '../components/auth/oauth/providers/index';
import { initiateOAuthFlow } from '../utils/oauthUtils';

interface UseOAuthReturn {
  isLoading: boolean;
  message: string;
  handleOAuthLogin: () => Promise<void>;
}

export const useOAuth = (provider: OAuthProvider): UseOAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const config = getOAuthConfig(provider);

  // AuthManager 초기화
  useEffect(() => {
    resetAuthManager(provider);
    setMessage('');
  }, [provider]);

  const handleOAuthLogin = async () => {
    try {
      setIsLoading(true);
      setMessage(`🔄 ${config.name} OAuth 페이지로 이동합니다...`);
      
      // 공통 OAuth 플로우 시작
      await initiateOAuthFlow(provider, 'login');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setMessage(`❌ ${errorMessage}`);
      console.error(`❌ ${config.name} 로그인 중 오류:`, error);
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    message,
    handleOAuthLogin
  };
};
