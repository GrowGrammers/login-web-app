/**
 * OAuth 공통 유틸리티 함수
 */

import type { OAuthProvider } from '../components/auth/oauth/providers/index';
import { getOAuthConfig } from '../components/auth/oauth/providers/index';
import { generateCodeVerifier, generateCodeChallenge, generateRandomString } from './pkceUtils';

/**
 * OAuth 인증 플로우 시작
 * @param provider OAuth 제공자
 * @param mode 'login' (일반 로그인) 또는 'link' (계정 연동)
 */
export async function initiateOAuthFlow(
  provider: OAuthProvider,
  mode: 'login' | 'link' = 'login'
): Promise<void> {
  try {
    // OAuth 설정 가져오기
    const config = getOAuthConfig(provider);
    
    // 환경변수 검증
    if (!config.clientId) {
      throw new Error(`${config.name} Client ID가 설정되지 않았습니다.`);
    }
    
    // PKCE 파라미터 생성
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);
    
    // PKCE 파라미터를 localStorage에 저장
    localStorage.setItem(config.storageKeys.codeVerifier, codeVerifier);
    localStorage.setItem(config.storageKeys.state, state);
    
    // 모드별 플래그 설정
    if (mode === 'login') {
      // 일반 로그인 모드
      localStorage.setItem('oauth_in_progress', 'true');
      localStorage.setItem('oauth_provider', provider);
    } else {
      // 연동 모드
      localStorage.setItem('is_linking_mode', 'true');
      localStorage.setItem('linking_provider', provider);
    }
    
    // OAuth URL 생성
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', config.responseType);
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', config.codeChallengeMethod);
    authUrl.searchParams.set('state', state);
    
    // Google의 경우 추가 파라미터
    if (provider === 'google') {
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
    }
    
    // OAuth 페이지로 이동
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error(`❌ OAuth ${mode === 'login' ? '로그인' : '연동'} 시작 실패:`, error);
    throw error;
  }
}

