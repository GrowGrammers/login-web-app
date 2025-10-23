import { useCallback } from 'react';
import { getAuthManager, getCurrentProviderType } from '../auth/authManager';
import { useAuthStore } from '../stores/authStore';
import type { AuthProviderType } from 'growgrammers-auth-core';

/**
 * localStorage 정리 유틸리티 함수들
 */
const cleanupOAuthStorage = (provider: 'google' | 'naver' | 'kakao') => {
  localStorage.removeItem(`${provider}_auth_code`);
  localStorage.removeItem(`${provider}_oauth_code_verifier`);
  localStorage.removeItem(`${provider}_oauth_state`);
  localStorage.removeItem('oauth_processing');
  localStorage.removeItem('oauth_in_progress');
  localStorage.removeItem('oauth_provider');
  localStorage.removeItem('current_provider_type');
};

const cleanupEmailStorage = () => {
  localStorage.removeItem('current_provider_type');
};

/**
 * OAuth 제공자인지 확인
 */
const isOAuthProvider = (provider: string): provider is 'google' | 'naver' | 'kakao' => {
  return ['google', 'naver', 'kakao'].includes(provider);
};

interface LogoutResult {
  success: boolean;
  message?: string;
}

/**
 * 로그아웃 처리를 관리하는 커스텀 훅
 */
export const useLogout = () => {
  const clearAuthState = useAuthStore(state => state.logout);

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(async (): Promise<LogoutResult> => {
    try {
      const authManager = getAuthManager();
      const currentProvider = getCurrentProviderType();
      
      // 백엔드 API 호출로 로그아웃 처리
      const result = await authManager.logout({ 
        provider: currentProvider as AuthProviderType
      });
      
      if (result.success) {
        // localStorage 정리
        if (isOAuthProvider(currentProvider)) {
          cleanupOAuthStorage(currentProvider);
        } else {
          cleanupEmailStorage();
        }
        
        // Zustand 스토어 상태 업데이트 (로그아웃)
        // logout() 내부에서 clearUserInfo()를 호출하여 user_info도 정리됨
        clearAuthState();
        
        return { success: true };
      }
      
      return { 
        success: false, 
        message: result.message || '로그아웃에 실패했습니다.'
      };
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '로그아웃 중 알 수 없는 오류가 발생했습니다.' 
      };
    }
  }, [clearAuthState]);

  return {
    logout
  };
};

