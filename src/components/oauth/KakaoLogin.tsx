import { useState, useEffect } from 'react';
import { resetAuthManager } from '../../auth/authManager';
import { generateRandomString, generateCodeVerifier, generateCodeChallenge } from '../../utils/pkceUtils';

const KakaoLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // AuthManager 초기화
  useEffect(() => {
    resetAuthManager('kakao');
    setMessage('');
  }, []);

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      setMessage('🔄 Kakao OAuth 페이지로 이동합니다...');
      
      // 환경변수에서 Kakao OAuth 설정 가져오기
      const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID; 
      const redirectUri = `${window.location.origin}/auth/kakao/callback`;
      
      // 환경변수 redirect URI가 있으면 사용, 없으면 기본값 사용
      const finalRedirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI || redirectUri;
      
      // 환경변수 검증
      if (!clientId) {
        setMessage('❌ Kakao Client ID가 설정되지 않았습니다. .env 파일에 VITE_KAKAO_CLIENT_ID를 설정해주세요.');
        setIsLoading(false);
        return;
      }
      
      // PKCE 파라미터 생성
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      
      // PKCE 파라미터를 localStorage에 저장
      localStorage.setItem('kakao_oauth_code_verifier', codeVerifier);
      localStorage.setItem('kakao_oauth_state', state);
      
      // Kakao OAuth URL 생성 (PKCE 포함)
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(finalRedirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('profile_nickname account_email')}&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256&` +
        `state=${encodeURIComponent(state)}`;
      
      // 현재 상태를 localStorage에 저장
      localStorage.setItem('oauth_in_progress', 'true');
      localStorage.setItem('oauth_provider', 'kakao');
      
      // 현재 창에서 Kakao OAuth 페이지로 이동
      window.location.href = kakaoAuthUrl;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setMessage(`❌ ${errorMessage}`);
      console.error('❌ Kakao 로그인 중 오류:', error);
      setIsLoading(false);
    }
  };


  return (
    <div className="h-full flex flex-col bg-white w-full border-l border-r border-gray-200">

      {/* 헤더 */}
      <div className="px-4 py-16 pb-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kakao로 계속하기</h2>
        <p className="text-sm text-gray-600">Kakao 계정으로 빠르게 로그인하세요</p>
      </div>

      <div className="flex-1 px-8 pb-4 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-4">
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
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="w-full p-4 bg-yellow-400 text-black rounded-xl text-base font-semibold hover:bg-yellow-500 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Kakao 인증 중...' : 'Kakao로 계속하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KakaoLogin;
