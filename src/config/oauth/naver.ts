/**
 * Naver OAuth 설정
 */
export const getNaverConfig = () => ({
  clientId: import.meta.env.VITE_NAVER_CLIENT_ID,
  redirectUri: import.meta.env.VITE_NAVER_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/naver/callback`,
  authUrl: 'https://nid.naver.com/oauth2/authorize',
  scope: 'openid',
  responseType: 'code',
  codeChallengeMethod: 'S256',
  
  // UI 설정
  name: 'Naver',
  displayName: 'Naver로 계속하기',
  buttonColor: 'bg-green-500 hover:bg-green-600',
  textColor: 'text-white',
  icon: '/naver_ic.png',
  
  // localStorage 키
  storageKeys: {
    codeVerifier: 'naver_oauth_code_verifier',
    state: 'naver_oauth_state',
    authCode: 'naver_auth_code',
    codeUsed: 'naver_code_used',
    callbackProcessing: 'naver_callback_processing'
  }
});

export type NaverConfig = ReturnType<typeof getNaverConfig>;

