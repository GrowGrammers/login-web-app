/**
 * OAuth 제공자 설정 통합
 */
import { getGoogleConfig } from './google';
import { getKakaoConfig } from './kakao';
import { getNaverConfig } from './naver';

export type OAuthProvider = 'google' | 'kakao' | 'naver';

export type OAuthConfig = {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  scope: string;
  responseType: string;
  codeChallengeMethod: string;
  name: string;
  displayName: string;
  buttonColor: string;
  textColor: string;
  icon: string;
  storageKeys: {
    codeVerifier: string;
    state: string;
    authCode: string;
    codeUsed: string;
    callbackProcessing: string;
  };
  accessType?: string;
  prompt?: string;
};

export const getOAuthConfig = (provider: OAuthProvider): OAuthConfig => {
  switch (provider) {
    case 'google':
      return getGoogleConfig();
    case 'kakao':
      return getKakaoConfig();
    case 'naver':
      return getNaverConfig();
    default:
      throw new Error(`Unknown OAuth provider: ${provider}`);
  }
};

export { getGoogleConfig, getKakaoConfig, getNaverConfig };

