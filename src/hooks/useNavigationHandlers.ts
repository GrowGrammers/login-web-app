import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initializeTokenRefreshService } from '../auth/TokenRefreshService';
import { useAuthStatus } from './useAuthStatus';

export const useNavigationHandlers = (
  setShowSplash: (show: boolean) => void
) => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const navigate = useNavigate();
  const location = useLocation();

  // 인증 상태가 변경될 때 처리
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // 인증된 상태이면 토큰 갱신 서비스 시작
        initializeTokenRefreshService();
        setShowSplash(false);
        
        // 연동 모드인지 확인
        const isLinkingMode = localStorage.getItem('is_linking_mode');
        
        // 이미 로그인 완료 페이지나 대시보드, 서비스 메인, 연동 페이지, OAuth 콜백 페이지에 있으면 리다이렉트하지 않음
        if (location.pathname !== '/login/complete' && 
            location.pathname !== '/dashboard' && 
            location.pathname !== '/service' &&
            !location.pathname.startsWith('/link/') &&
            !location.pathname.startsWith('/auth/')) {
          // 연동 모드면 대시보드로, 아니면 로그인 완료 페이지로
          if (isLinkingMode === 'true') {
            navigate('/dashboard');
          } else {
            navigate('/login/complete');
          }
        }
      } else {
        // 인증되지 않은 상태이면 스플래시 화면을 숨김 (로그인 페이지 접근 허용)
        setShowSplash(false);
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate, setShowSplash]);

  const handleStartApp = () => {
    setShowSplash(false);
    navigate('/start');
  };

  const handleBackToSplash = () => {
    setShowSplash(true);
    navigate('/');
  };

  return {
    handleStartApp,
    handleBackToSplash
  };
};
