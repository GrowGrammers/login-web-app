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
