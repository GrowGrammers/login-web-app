import { useState, useEffect } from 'react';
import { resetAuthManager } from '../../auth/authManager';
import { generateRandomString, generateCodeVerifier, generateCodeChallenge } from '../../utils/pkceUtils';
import type { OAuthProvider } from './providers/index';
import { getOAuthConfig } from './providers/index';
import { MessageAlert } from '../ui';

interface OAuthLoginProps {
  provider: OAuthProvider;
}

const OAuthLogin = ({ provider }: OAuthLoginProps) => {
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

  return (
    <div className="h-full flex flex-col bg-white w-full border-l border-r border-gray-200">
      {/* 헤더 */}
      <div className="px-4 py-16 pb-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.displayName}</h2>
        <p className="text-sm text-gray-600">{config.name} 계정으로 빠르게 로그인하세요</p>
      </div>

      <div className="flex-1 px-8 pb-4 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col w-full">
            {/* 메시지 표시 */}
            <MessageAlert message={message} />

            <button
              onClick={handleOAuthLogin}
              disabled={isLoading}
              className={`w-full p-4 ${config.buttonColor} ${config.textColor} rounded-xl text-base font-semibold hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {isLoading ? `${config.name} 인증 중...` : config.displayName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthLogin;
