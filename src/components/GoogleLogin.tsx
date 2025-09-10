import { useState, useEffect } from 'react';
import { resetAuthManager } from '../auth/authManager';

// PKCE 헬퍼 함수들
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[byte % 66]
  ).join('');
}

function generateCodeVerifier(): string {
  return generateRandomString(128);
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Base64URL 인코딩
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const GoogleLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // AuthManager 초기화
  useEffect(() => {
    resetAuthManager('google');
    setMessage('');
    console.log('🔄 AuthManager 초기화: google');
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setMessage('🔄 Google OAuth 페이지로 이동합니다...');
      
      // 환경변수에서 Google OAuth 설정 가져오기
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; 
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      // 환경변수 redirect URI가 있으면 사용, 없으면 기본값 사용
      const finalRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || redirectUri;
      
      // 환경변수 검증
      if (!clientId) {
        throw new Error('Google Client ID가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      }
      
      // PKCE 파라미터 생성
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      
      // PKCE 파라미터를 localStorage에 저장
      localStorage.setItem('google_oauth_code_verifier', codeVerifier);
      localStorage.setItem('google_oauth_state', state);
      
      // Google OAuth URL 생성 (PKCE 포함)
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(finalRedirectUri)}&` +
        `scope=${encodeURIComponent('email profile openid')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256&` +
        `state=${encodeURIComponent(state)}`;
      
      // 현재 상태를 localStorage에 저장
      localStorage.setItem('oauth_in_progress', 'true');
      localStorage.setItem('oauth_provider', 'google');
      
      // 현재 창에서 Google OAuth 페이지로 이동
      window.location.href = googleAuthUrl;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setMessage(`❌ ${errorMessage}`);
      console.error('❌ Google 로그인 중 오류:', error);
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-white w-full border-l border-r border-gray-200 shadow-xl">

      {/* 헤더 */}
      <div className="px-4 py-16 pb-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Google로 계속하기</h2>
        <p className="text-sm text-gray-600">Google 계정으로 빠르게 로그인하세요</p>
      </div>

      <div className="flex-1 px-8 pb-8 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-8">
          <div className="flex flex-col w-full">
            {/* 메시지 표시 */}
            {message && (
              <div className={`p-4 rounded-xl mb-4 font-medium text-sm ${
                message.includes('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full p-4 bg-blue-500 text-white rounded-xl text-base font-semibold hover:bg-blue-600 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Google 인증 중...' : 'Google로 계속하기'}
            </button>
          </div>
        </div>

        {/* 개발 정보 */}
        <div className="mt-auto p-4 bg-gray-100 rounded-lg border-l-4 border-gray-500">
          <h4 className="mb-2 text-gray-900 text-sm">🛠️ 개발 정보</h4>
          <p className="my-1 text-xs text-gray-600"><strong>Provider:</strong> google</p>
          <p className="my-1 text-xs text-gray-600"><strong>Step:</strong> oauth</p>
        </div>
      </div>
    </div>
  );
};

export default GoogleLogin;
