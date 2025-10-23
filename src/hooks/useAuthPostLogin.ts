import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeTokenRefreshService } from '../auth/TokenRefreshService';
import { useAuthStatus } from './useAuthStatus';

interface PostLoginOptions {
  provider?: 'email' | 'google' | 'kakao' | 'naver';
  redirectTo?: string;
  onComplete?: () => void;
}

/**
 * 로그인 성공 후 공통 처리 로직을 관리하는 커스텀 훅
 * 
 * 처리 순서:
 * 1. 토큰 갱신 서비스 시작
 * 2. 사용자 정보 가져오기 (필요시)
 * 3. 전역 상태 업데이트
 * 4. 페이지 이동
 * 5. 콜백 실행 (필요시)
 */
export const useAuthPostLogin = () => {
  const navigate = useNavigate();
  const { refreshAuthStatus } = useAuthStatus();

  /**
   * 로그인 후처리 실행
   */
  const handlePostLogin = useCallback(async (options: PostLoginOptions = {}) => {
    const {
      provider,
      redirectTo = '/login/complete',
      onComplete
    } = options;

    try {
      // 1. 토큰 갱신 서비스 시작
      initializeTokenRefreshService();
      
      // 2. 사용자 정보 가져오기 (이메일 로그인의 경우)
      if (provider === 'email') {
        // 토큰이 저장될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 3. Zustand 스토어 상태 업데이트 (전역 상태 즉시 반영)
      await refreshAuthStatus();
      
      // 4. 페이지 이동
      navigate(redirectTo);
      
      // 5. 완료 콜백 실행
      onComplete?.();
      
    } catch (error) {
      console.error('❌ 로그인 후처리 중 오류:', error);
      throw error;
    }
  }, [navigate, refreshAuthStatus]);

  return {
    handlePostLogin
  };
};

