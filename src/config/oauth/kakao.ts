/**
 * Kakao OAuth 설정
 */
export const getKakaoConfig = () => ({
  clientId: import.meta.env.VITE_KAKAO_CLIENT_ID,
  redirectUri: import.meta.env.VITE_KAKAO_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/kakao/callback`,
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
  scope: 'profile_nickname account_email',
  responseType: 'code',
  codeChallengeMethod: 'S256',
  
  // UI 설정
  name: 'Kakao',
  displayName: 'Kakao로 계속하기',
  buttonColor: 'bg-yellow-400 hover:bg-yellow-500',
  textColor: 'text-black',
  icon: '/kakao_ic.png',
  
  // localStorage 키
  storageKeys: {
    codeVerifier: 'kakao_oauth_code_verifier',
    state: 'kakao_oauth_state',
    authCode: 'kakao_auth_code',
    codeUsed: 'kakao_code_used',
    callbackProcessing: 'kakao_callback_processing'
  }
});

export type KakaoConfig = ReturnType<typeof getKakaoConfig>;

