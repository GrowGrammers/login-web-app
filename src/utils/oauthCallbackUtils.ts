/**
 * OAuth 콜백 처리 관련 유틸리티 함수들
 */


/**
 * OAuth 제공자별 콜백 처리
 * @param provider OAuth 제공자 ('google' | 'naver' | 'kakao')
 * @param authCode 인증 코드
 * @param codeVerifier PKCE Code Verifier
 * @param setShowSplash 스플래시 화면 상태 설정 함수
 * @param setIsAuthenticated 인증 상태 설정 함수
 * @param initializeTokenRefreshService 토큰 갱신 서비스 초기화 함수
 * @param navigate 네비게이션 함수
 * @param globalOAuthProcessing 전역 OAuth 처리 상태
 * @returns 처리 결과
 */
export async function handleOAuthProviderCallback(
  provider: 'google' | 'naver' | 'kakao',
  authCode: string,
  codeVerifier: string,
  setShowSplash: (show: boolean) => void,
  setIsAuthenticated: (authenticated: boolean) => void,
  initializeTokenRefreshService: () => void,
  navigate: (path: string) => void,
  globalOAuthProcessing: { value: boolean }
): Promise<{ success: boolean; message?: string }> {
  try {
    // 인가 코드 재사용 방지: 이미 사용된 코드인지 확인
    const codeUsedFlag = localStorage.getItem(`${provider}_code_used`);
    if (codeUsedFlag === 'true') {
      console.warn(`⚠️ ${provider} 인가 코드가 이미 사용되었습니다. 중복 처리 방지`);
      return { success: false, message: '인가 코드가 이미 사용되었습니다.' };
    }
    
    // 처리 중 플래그 설정 (이중 보안)
    localStorage.setItem('oauth_processing', 'true');
    globalOAuthProcessing.value = true;
    setShowSplash(false);
    
    // 인가 코드 사용 플래그 설정 (재사용 방지)
    localStorage.setItem(`${provider}_code_used`, 'true');
    
    // AuthManager 설정 및 로그인 처리
    const { resetAuthManager } = await import('../auth/authManager');
    const authManager = resetAuthManager(provider);
    
    const result = await authManager.login({
      provider: provider,
      authCode: authCode,
      codeVerifier: codeVerifier
    });
    
    if (result.success) {
      setIsAuthenticated(true);
      initializeTokenRefreshService();
      setShowSplash(false);
      
      // RealHttpClient에서 이미 사용자 정보를 가져오므로 중복 호출 제거
      // await fetchUserInfoAfterLogin(provider);
      
      // 연동 모드인지 확인
      const isLinkingMode = localStorage.getItem('is_linking_mode');
      const linkingProvider = localStorage.getItem('linking_provider');
      
      console.log(`🔗 OAuth 콜백 완료 - 연동 모드: ${isLinkingMode}, provider: ${linkingProvider}`);
      
      if (isLinkingMode === 'true') {
        // 연동 모드면 대시보드로
        console.log('✅ 연동 모드 → /dashboard로 이동');
        
        // 연동 모드 플래그는 여기서 제거 (OAuth 콜백 완료 시점)
        localStorage.removeItem('is_linking_mode');
        localStorage.removeItem('linking_provider');
        
        // URL 파라미터로 연동 완료된 provider 전달
        navigate(`/dashboard?linked=${linkingProvider || provider}`);
      } else {
        // 일반 로그인이면 로그인 완료 페이지로
        console.log('✅ 일반 로그인 → /login/complete로 이동');
        navigate('/login/complete');
      }
    } else {
      console.error(`${provider} 로그인 실패:`, result.message);
      
      // 사용자에게 오류 알림 표시
      const errorMessage = result.message || '로그인에 실패했습니다.';
      alert(`❌ ${provider} 로그인 실패\n\n${errorMessage}\n\n다시 시도해주세요.`);
      
      // 로그인 페이지로 리다이렉트
      navigate('/start');
    }
    
    return result;
    
  } catch (error) {
    console.error(`${provider} OAuth 콜백 처리 중 오류:`, error);
    
    // 사용자에게 오류 알림 표시
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    alert(`❌ ${provider} 로그인 중 오류 발생\n\n${errorMessage}\n\n다시 시도해주세요.`);
    
    // 로그인 페이지로 리다이렉트
    navigate('/start');
    
    return { success: false, message: errorMessage };
  } finally {
    // 사용한 인증 코드 및 PKCE 파라미터 삭제
    localStorage.removeItem(`${provider}_auth_code`);
    localStorage.removeItem(`${provider}_oauth_code_verifier`);
    localStorage.removeItem(`${provider}_oauth_state`);
    localStorage.removeItem(`${provider}_code_used`); // 인가 코드 사용 플래그도 삭제
    localStorage.removeItem('oauth_processing');
    globalOAuthProcessing.value = false;
  }
}

/**
 * OAuth 제공자별 인증 코드와 Code Verifier 검증 및 처리
 * @param provider OAuth 제공자
 * @param authCode 인증 코드
 * @param setShowSplash 스플래시 화면 상태 설정 함수
 * @param setIsAuthenticated 인증 상태 설정 함수
 * @param initializeTokenRefreshService 토큰 갱신 서비스 초기화 함수
 * @param navigate 네비게이션 함수
 * @param globalOAuthProcessing 전역 OAuth 처리 상태
 */
export async function processOAuthProvider(
  provider: 'google' | 'naver' | 'kakao',
  authCode: string,
  setShowSplash: (show: boolean) => void,
  setIsAuthenticated: (authenticated: boolean) => void,
  initializeTokenRefreshService: () => void,
  navigate: (path: string) => void,
  globalOAuthProcessing: { value: boolean }
): Promise<void> {
  const codeVerifier = localStorage.getItem(`${provider}_oauth_code_verifier`);
  
  if (codeVerifier) {
    await handleOAuthProviderCallback(
      provider,
      authCode,
      codeVerifier,
      setShowSplash,
      setIsAuthenticated,
      initializeTokenRefreshService,
      navigate,
      globalOAuthProcessing
    );
  } else {
    console.warn(`${provider} authCode는 있지만 codeVerifier가 없습니다.`);
    
    // 사용자에게 오류 알림 표시
    alert(`❌ ${provider} 로그인 오류\n\n인증 정보가 올바르지 않습니다.\n\n다시 시도해주세요.`);
    
    // 로그인 페이지로 리다이렉트
    navigate('/start');
    
    // 관련 데이터 정리
    localStorage.removeItem(`${provider}_auth_code`);
  }
}

/**
 * OAuth 콜백 경로인지 확인
 * @param pathname 현재 경로
 * @returns OAuth 콜백 경로 여부
 */
export function isOAuthCallbackPath(pathname: string): boolean {
  return pathname === '/auth/google/callback' || 
         pathname === '/auth/kakao/callback' || 
         pathname === '/auth/naver/callback';
}

/**
 * OAuth 진행 상태 정리
 */
export function cleanupOAuthProgress(): void {
  const oauthInProgress = localStorage.getItem('oauth_in_progress');
  if (oauthInProgress === 'true') {
    localStorage.removeItem('oauth_in_progress');
    localStorage.removeItem('oauth_provider');
  }
}
