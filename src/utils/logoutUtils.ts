/**
 * 로그아웃 관련 유틸리티 함수들
 */

/**
 * OAuth 제공자별 로그아웃 처리 (구글, 네이버, 카카오)
 * @param provider OAuth 제공자 ('google' | 'naver' | 'kakao')
 * @param authManager AuthManager 인스턴스
 */
export async function handleOAuthLogout(provider: 'google' | 'naver' | 'kakao', authManager: any): Promise<void> {
  // TokenStore에서 토큰 제거
  const tokenStore = authManager['tokenStore'];
  if (tokenStore && typeof tokenStore.removeToken === 'function') {
    await tokenStore.removeToken();
  }
  
  // 쿠키에서 토큰들 삭제
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // OAuth 관련 localStorage 정리
  localStorage.removeItem(`${provider}_auth_code`);
  localStorage.removeItem(`${provider}_oauth_code_verifier`);
  localStorage.removeItem(`${provider}_oauth_state`);
  localStorage.removeItem('oauth_processing');
  localStorage.removeItem('oauth_in_progress');
  localStorage.removeItem('oauth_provider');
  localStorage.removeItem('current_provider_type');
}

/**
 * 이메일 로그아웃 처리
 * @param authManager AuthManager 인스턴스
 * @param provider 현재 제공자
 */
export async function handleEmailLogout(authManager: any, provider: string): Promise<{ success: boolean; message?: string }> {
  const result = await authManager.logout({ 
    provider: provider
  });
  
  if (result.success) {
    // 이메일 로그아웃 시에도 provider type 정리
    localStorage.removeItem('current_provider_type');
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
