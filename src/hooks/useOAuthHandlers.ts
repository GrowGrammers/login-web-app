import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { processOAuthProvider, isOAuthCallbackPath, cleanupOAuthProgress } from '../utils/oauthCallbackUtils';
import { initializeTokenRefreshService } from '../auth/TokenRefreshService';
import { useAuthStatus } from './useAuthStatus';

// 전역 OAuth 처리 상태 (React Strict Mode 대응)
const globalOAuthProcessing = { value: false };

export const useOAuthHandlers = (setShowSplash: (show: boolean) => void) => {
  const { refreshAuthStatus } = useAuthStatus();
  const navigate = useNavigate();
  const location = useLocation();

  // OAuth 콜백 처리 (localStorage에서 인증 코드 확인)
  const handleOAuthCallback = async () => {
    // OAuth 콜백 경로에서는 실행하지 않음
    if (isOAuthCallbackPath(location.pathname)) {
      return;
    }
    
    // 이미 처리 중인지 확인 (중복 실행 방지 - localStorage + 전역 변수)
    const isOAuthProcessing = localStorage.getItem('oauth_processing');
    if (isOAuthProcessing === 'true' || globalOAuthProcessing.value) {
      return;
    }
    
    // OAuth 코드 확인 (Google, Kakao, Naver)
    const googleAuthCode = localStorage.getItem('google_auth_code');
    const kakaoAuthCode = localStorage.getItem('kakao_auth_code');
    const naverAuthCode = localStorage.getItem('naver_auth_code');
    
    // OAuth 진행 상태 정리
    cleanupOAuthProgress();
    
    // OAuth 제공자별 처리
    const oauthProviders = [
      { provider: 'google' as const, authCode: googleAuthCode },
      { provider: 'kakao' as const, authCode: kakaoAuthCode },
      { provider: 'naver' as const, authCode: naverAuthCode }
    ];
    
    for (const { provider, authCode } of oauthProviders) {
      if (authCode) {
        try {
          await processOAuthProvider(
            provider,
            authCode,
            setShowSplash,
            refreshAuthStatus,
            initializeTokenRefreshService,
            navigate,
            globalOAuthProcessing
          );
        } catch (error) {
          console.error(`${provider} OAuth 처리 중 예상치 못한 오류:`, error);
          
          // 사용자에게 오류 알림 표시
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          alert(`❌ ${provider} 로그인 처리 중 오류 발생\n\n${errorMessage}\n\n다시 시도해주세요.`);
          
          // 로그인 페이지로 리다이렉트
          navigate('/start');
        }
        break; // 한 번에 하나의 제공자만 처리
      }
    }
  };

  // OAuth 콜백 처리
  useEffect(() => {
    let hasRun = false;
    let isProcessing = false; // OAuth 처리 중 플래그 추가
    
    const runOnce = async () => {
      if (hasRun || isProcessing) {
        // 중복 실행 방지
        return;
      }
      hasRun = true;
      isProcessing = true;
      
      try {
        await handleOAuthCallback();
      } finally {
        isProcessing = false;
      }
    };
    
    runOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return {
    handleOAuthCallback
  };
};
