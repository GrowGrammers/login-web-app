import { useNavigate } from 'react-router-dom';
import { getCurrentProviderType } from '../auth/authManager';
import { useAuthStatus } from './useAuthStatus';
import { useLogout } from './useLogout';
import { useAuthPostLogin } from './useAuthPostLogin';

export const useAuthHandlers = () => {
  const { refreshAuthStatus } = useAuthStatus();
  const { logout } = useLogout();
  const { handlePostLogin } = useAuthPostLogin();
  const navigate = useNavigate();

  const handleLoginSuccess = async () => {
    const currentProvider = getCurrentProviderType();
    
    // useAuthPostLogin 훅 사용 - 통합된 후처리 로직
    await handlePostLogin({
      provider: currentProvider as 'email' | 'google' | 'kakao' | 'naver',
      redirectTo: '/login/complete'
    });
  };

  const handleLogout = async (setShowSplash: (show: boolean) => void) => {
    try {
      // useLogout 훅 사용 - 모든 로그아웃 로직이 훅 안에 통합됨
      const result = await logout();
      
      // 로컬 세션은 항상 정리되므로 상태 업데이트 및 리다이렉트는 항상 실행
      // Zustand 스토어 상태 업데이트 (전역 상태 즉시 반영)
      await refreshAuthStatus();
      setShowSplash(true);
      
      if (result.success) {
        alert('✅ 로그아웃되었습니다.');
      } else {
        // 네트워크 오류 또는 서버 오류 발생 시에도 로컬 세션은 정리됨을 명확히 표시
        if (result.isNetworkError) {
          alert('⚠️ 네트워크 오류로 서버 로그아웃에 실패\n로컬 세션은 정리되어 안전하게 로그아웃되었습니다.');
        } else {
          alert('⚠️ 서버 로그아웃에 실패했지만\n로컬 세션은 정리되어 안전하게 로그아웃되었습니다.');
        }
      }
      
      // replace를 사용하여 현재 페이지를 히스토리에서 교체
      // 이렇게 하면 뒤로가기 시 대시보드로 돌아가지 않음
      navigate('/', { replace: true });
      
    } catch (error) {
      // 예상치 못한 오류 (useLogout에서 잡히지 않은 오류)
      console.error('❌ 로그아웃 중 예상치 못한 오류:', error);
      
      // 최후의 수단으로 상태 업데이트 및 리다이렉트
      await refreshAuthStatus();
      setShowSplash(true);
      alert('⚠️ 로그아웃 중 오류가 발생했습니다. 로컬 세션을 정리하고 다시 시도해주세요.');
      navigate('/', { replace: true });
    }
  };

  return {
    handleLoginSuccess,
    handleLogout
  };
};
