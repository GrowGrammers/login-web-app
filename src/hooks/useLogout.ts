import { useCallback } from 'react';
import { getAuthManager, getCurrentProviderType } from '../auth/authManager';
import { useAuthStore } from '../stores/authStore';
import type { AuthProviderType } from 'growgrammers-auth-core';
import { handleRateLimitError } from '../utils/rateLimitErrorUtils';

/**
 * localStorage 정리 유틸리티 함수들
 */
const cleanupOAuthStorage = (provider: 'google' | 'naver' | 'kakao') => {
  try {
    localStorage.removeItem(`${provider}_auth_code`);
    localStorage.removeItem(`${provider}_oauth_code_verifier`);
    localStorage.removeItem(`${provider}_oauth_state`);
    localStorage.removeItem('oauth_processing');
    localStorage.removeItem('oauth_in_progress');
    localStorage.removeItem('oauth_provider');
    localStorage.removeItem('current_provider_type');
  } catch (error) {
    console.error('❌ OAuth localStorage 정리 중 오류:', error);
  }
};

const cleanupEmailStorage = () => {
  try {
    localStorage.removeItem('current_provider_type');
  } catch (error) {
    console.error('❌ Email localStorage 정리 중 오류:', error);
  }
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
  isNetworkError?: boolean; // 네트워크 오류 여부
}

/**
 * 로그아웃 처리를 관리하는 커스텀 훅
 */
export const useLogout = () => {
  const clearAuthState = useAuthStore(state => state.logout);

  /**
   * 로컬 세션 정리 (백엔드 응답과 무관하게 항상 실행)
   */
  const cleanupLocalSession = useCallback(async (provider: string) => {
    try {
      // 1. 토큰 스토어 정리 (가장 중요!)
      const authManager = getAuthManager();
      const tokenStore = authManager['tokenStore']; // private 필드 접근
      if (tokenStore && typeof tokenStore.clear === 'function') {
        await tokenStore.clear();
      } else {
        // 직접 localStorage에서 토큰 제거
        localStorage.removeItem('login_web_app_tokens');
      }
      
      // 2. OAuth 관련 임시 데이터 정리
      if (isOAuthProvider(provider)) {
        cleanupOAuthStorage(provider);
      } else {
        cleanupEmailStorage();
      }
      
      // 3. Zustand 스토어 상태 업데이트 (로그아웃)
      // logout() 내부에서 clearUserInfo()를 호출하여 user_info도 정리됨
      clearAuthState();
      
    } catch (error) {
      console.error('❌ 로컬 세션 정리 중 오류:', error);
      
      // 실패해도 최소한 토큰은 삭제 시도
      try {
        localStorage.removeItem('login_web_app_tokens');
        clearAuthState();
      } catch (fallbackError) {
        console.error('❌ 폴백 정리도 실패:', fallbackError);
      }
    }
  }, [clearAuthState]);

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(async (): Promise<LogoutResult> => {
    const currentProvider = getCurrentProviderType();
    let isNetworkError = false;
    
    try {
      const authManager = getAuthManager();
      
      // 백엔드 API 호출로 로그아웃 처리
      const result = await authManager.logout({ 
        provider: currentProvider as AuthProviderType
      });
      
      if (result.success) {
        // 백엔드 로그아웃 성공 -> 로컬 세션 정리
        await cleanupLocalSession(currentProvider);
        return { success: true };
      }
      
      // 백엔드 로그아웃 실패 -> 로컬 세션은 정리하고 오류 반환
      await cleanupLocalSession(currentProvider);
      
      // 429 에러 처리 (authManager에서 status를 확인할 수 없다면 메시지로 판단)
      const rateLimitMessage = result.message?.includes('429') || result.message?.toLowerCase().includes('too many')
        ? handleRateLimitError(429, '/api/v1/auth/members/logout', result.message)
        : null;
      
      return { 
        success: false, 
        message: rateLimitMessage || result.message || '서버 로그아웃에 실패했지만 로컬 세션은 정리되었습니다.'
      };
      
    } catch (error) {
      // 네트워크 오류 판별
      isNetworkError = error instanceof TypeError || 
                       (error instanceof Error && 
                        (error.message.includes('fetch') || 
                         error.message.includes('network') ||
                         error.message.includes('Failed to fetch')));
      
      // 네트워크 오류여도 로컬 세션은 정리
      await cleanupLocalSession(currentProvider);
      
      const errorMessage = isNetworkError 
        ? '네트워크 오류로 서버 로그아웃에 실패했지만 로컬 세션은 정리되었습니다.'
        : (error instanceof Error ? error.message : '로그아웃 중 알 수 없는 오류가 발생했지만 로컬 세션은 정리되었습니다.');
      
      return { 
        success: false, 
        message: errorMessage,
        isNetworkError
      };
    }
  }, [cleanupLocalSession]);

  return {
    logout
  };
};

