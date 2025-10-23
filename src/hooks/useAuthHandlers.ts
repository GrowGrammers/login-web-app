import { useNavigate } from 'react-router-dom';
import { getCurrentProviderType } from '../auth/authManager';
import { initializeTokenRefreshService } from '../auth/TokenRefreshService';
import { useAuthStatus } from './useAuthStatus';
import { useLogout } from './useLogout';

/**
 * 이메일 로그인 후 사용자 정보 가져오기
 */
async function fetchUserInfoAfterEmailLogin(): Promise<void> {
  try {
    // 토큰이 저장될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ 이메일 로그인 후처리 중 오류:', error);
  }
}

export const useAuthHandlers = () => {
  const { refreshAuthStatus } = useAuthStatus();
  const { logout } = useLogout();
  const navigate = useNavigate();

  const handleLoginSuccess = async () => {
    // 로그인 성공 시 토큰 갱신 서비스 시작
    initializeTokenRefreshService();
    
    // 사용자 정보 가져오기 시도 (이메일 로그인의 경우)
    const currentProvider = getCurrentProviderType();
    if (currentProvider === 'email') {
      await fetchUserInfoAfterEmailLogin();
    }
    
    // Zustand 스토어 상태 업데이트 (전역 상태 즉시 반영)
    await refreshAuthStatus();
    
    navigate('/login/complete');
  };

  const handleLogout = async (setShowSplash: (show: boolean) => void) => {
    try {
      // useLogout 훅 사용 - 모든 로그아웃 로직이 훅 안에 통합됨
      const result = await logout();
      
      if (result.success) {
        // Zustand 스토어 상태 업데이트 (전역 상태 즉시 반영)
        await refreshAuthStatus();
        setShowSplash(true);
        alert('✅ 로그아웃되었습니다.');
        navigate('/');
      } else {
        console.error('❌ 로그아웃 실패:', result.message);
        alert('로그아웃에 실패했습니다: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return {
    handleLoginSuccess,
    handleLogout
  };
};
