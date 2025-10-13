import { useState, useEffect } from 'react';
import { resetAuthManager } from '../auth/authManager';
import { generateRandomString, generateCodeVerifier, generateCodeChallenge } from '../utils/pkceUtils';
import type { OAuthProvider } from '../components/oauth/providers/index';
import { getOAuthConfig } from '../components/oauth/providers/index';

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
      
      // 환경변수 검증
      if (!config.clientId) {
        const errorMsg = `${config.name} Client ID가 설정되지 않았습니다. .env 파일에 VITE_${config.name.toUpperCase()}_CLIENT_ID를 설정해주세요.`;
        setMessage(`❌ ${errorMsg}`);
        setIsLoading(false);
        return;
      }
      
      // PKCE 파라미터 생성
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      
      // PKCE 파라미터를 localStorage에 저장
      localStorage.setItem(config.storageKeys.codeVerifier, codeVerifier);
      localStorage.setItem(config.storageKeys.state, state);
      
      // OAuth URL 생성
      const authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', config.redirectUri);
      authUrl.searchParams.set('response_type', config.responseType);
      authUrl.searchParams.set('scope', config.scope);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', config.codeChallengeMethod);
      authUrl.searchParams.set('state', state);
      
      // Google의 경우 추가 파라미터
      if (provider === 'google') {
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
      }
      
      // 현재 상태를 localStorage에 저장
      localStorage.setItem('oauth_in_progress', 'true');
      localStorage.setItem('oauth_provider', provider);
      
      // 현재 창에서 OAuth 페이지로 이동
      window.location.href = authUrl.toString();
      
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
