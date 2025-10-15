/**
 * 로그아웃 관련 유틸리티 함수들
 */

import type { AuthManager, AuthProviderType } from 'growgrammers-auth-core';
import { useAuthStore } from '../stores/authStore';

/**
 * OAuth 제공자별 로그아웃 처리 (구글, 네이버, 카카오)
 * @param provider OAuth 제공자 ('google' | 'naver' | 'kakao')
 * @param authManager AuthManager 인스턴스
 */
export async function handleOAuthLogout(provider: 'google' | 'naver' | 'kakao', authManager: AuthManager): Promise<{ success: boolean; message?: string }> {
  try {
    // 백엔드 API 호출로 로그아웃 처리 (이메일 로그인과 동일하게)
    const result = await authManager.logout({ 
      provider: provider as AuthProviderType
    });
    
    if (result.success) {
      // OAuth 관련 localStorage 정리
      localStorage.removeItem(`${provider}_auth_code`);
      localStorage.removeItem(`${provider}_oauth_code_verifier`);
      localStorage.removeItem(`${provider}_oauth_state`);
      localStorage.removeItem('oauth_processing');
      localStorage.removeItem('oauth_in_progress');
      localStorage.removeItem('oauth_provider');
      localStorage.removeItem('current_provider_type');
      
      // 사용자 정보 정리
      localStorage.removeItem('user_info');
      
      // Zustand 스토어 상태 업데이트 (로그아웃)
      useAuthStore.getState().logout();
    }
    
    return result;
  } catch (error) {
    console.error('OAuth 로그아웃 중 오류:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'OAuth 로그아웃 중 알 수 없는 오류가 발생했습니다.' 
    };
  }
}

/**
 * 이메일 로그아웃 처리
 * @param authManager AuthManager 인스턴스
 * @param provider 현재 제공자
 */
export async function handleEmailLogout(authManager: AuthManager, provider: string): Promise<{ success: boolean; message?: string }> {
  const result = await authManager.logout({ 
    provider: provider as AuthProviderType
  });
  
  if (result.success) {
    // 이메일 로그아웃 시에도 provider type 정리
    localStorage.removeItem('current_provider_type');
    
    // 사용자 정보 정리
    localStorage.removeItem('user_info');
    
    // Zustand 스토어 상태 업데이트 (로그아웃)
    useAuthStore.getState().logout();
  }
  
  return result;
}

/**
 * OAuth 제공자인지 확인
 * @param provider 제공자 타입
 * @returns OAuth 제공자 여부
 */
export function isOAuthProvider(provider: string): provider is 'google' | 'naver' | 'kakao' {
  return ['google', 'naver', 'kakao'].includes(provider);
}
