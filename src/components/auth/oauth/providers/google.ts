/**
 * Google OAuth 설정
 */
export const getGoogleConfig = () => ({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/google/callback`,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scope: 'email profile openid',
  responseType: 'code',
  accessType: 'offline',
  prompt: 'consent',
  codeChallengeMethod: 'S256',
  
  // UI 설정
  name: 'Google',
  displayName: 'Google로 계속하기',
  buttonColor: 'bg-blue-500 hover:bg-blue-600',
  textColor: 'text-white',
  icon: '/google_ic.svg',
  
  // localStorage 키
  storageKeys: {
    codeVerifier: 'google_oauth_code_verifier',
    state: 'google_oauth_state',
    authCode: 'google_auth_code',
    codeUsed: 'google_code_used',
    callbackProcessing: 'google_callback_processing'
  }
});

export type GoogleConfig = ReturnType<typeof getGoogleConfig>;
