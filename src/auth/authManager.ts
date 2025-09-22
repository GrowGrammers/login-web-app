import { AuthManager } from 'growgrammers-auth-core';
import { WebTokenStore } from './WebTokenStore';
import { RealHttpClient } from './RealHttpClient';
import { getApiConfig, getGoogleConfig, checkEnvironmentVariables } from '../config/auth.config';
import { isJWTExpired } from './jwtUtils';

// 전역 AuthManager 인스턴스
let authManagerInstance: AuthManager | null = null;
let currentProviderType: 'email' | 'google' = (localStorage.getItem('current_provider_type') as 'email' | 'google') || 'email';

/**
 * 이메일 인증용 AuthManager 생성
 */
export function createEmailAuthManager(): AuthManager {
  const apiConfig = getApiConfig();
  const httpClient = new RealHttpClient();
  const tokenStore = new WebTokenStore();

  return new AuthManager({
    providerType: 'email',
    platform: 'web', // 🌐 웹 플랫폼 명시
    apiConfig,
    httpClient,
    tokenStore,
    providerConfig: {
      timeout: 10000,
      retryCount: 3
    }
  });
}

/**
 * Google OAuth용 AuthManager 생성
 */
export function createGoogleAuthManager(): AuthManager {
  // 환경변수 확인
  checkEnvironmentVariables();
  
  const apiConfig = getApiConfig();
  const httpClient = new RealHttpClient();
  const tokenStore = new WebTokenStore();
  const googleConfig = getGoogleConfig();

  return new AuthManager({
    providerType: 'google',
    platform: 'web', // 🌐 웹 플랫폼 명시
    apiConfig,
    httpClient,
    tokenStore,
    providerConfig: {
      googleClientId: googleConfig.googleClientId,
      timeout: googleConfig.timeout,
      retryCount: googleConfig.retryCount
    }
  });
}

/**
 * 기본 AuthManager 인스턴스 가져오기 (이메일 인증)
 * 싱글톤 패턴으로 관리
 */
export function getAuthManager(): AuthManager {
  if (!authManagerInstance) {
    // 현재 provider 타입에 따라 적절한 AuthManager 생성
    if (currentProviderType === 'google') {
      authManagerInstance = createGoogleAuthManager();
    } else {
      authManagerInstance = createEmailAuthManager();
    }
  }
  return authManagerInstance;
}

/**
 * AuthManager 인스턴스 재생성 (provider 변경시 사용)
 */
export function resetAuthManager(type: 'email' | 'google' = 'email'): AuthManager {
  currentProviderType = type; // 현재 provider type 업데이트
  localStorage.setItem('current_provider_type', type); // localStorage에 저장
  
  if (type === 'google') {
    authManagerInstance = createGoogleAuthManager();
  } else {
    authManagerInstance = createEmailAuthManager();
  }
  
  return authManagerInstance;
}

/**
 * 현재 provider type 가져오기
 */
export function getCurrentProviderType(): 'email' | 'google' {
  return currentProviderType;
}

/**
 * 인증 상태 확인 헬퍼 (백엔드 validate API 호출 없이 로컬에서만 확인)
 */
export async function checkAuthStatus(): Promise<{
  isAuthenticated: boolean;
  hasToken: boolean;
  isTokenExpired: boolean;
}> {
  const authManager = getAuthManager();
  
  try {
    // validate API 호출 없이 토큰 정보만 확인
    const tokenResult = await authManager.getToken();
    
    // hasToken과 isTokenExpired는 tokenStore에서 직접 확인
    const hasToken = tokenResult.success && !!tokenResult.data;
    
    // 토큰 만료 확인 (토큰이 있을 때만)
    let isTokenExpired = true;
    if (hasToken && tokenResult.data && tokenResult.data.accessToken) {
      // JWT에서 직접 만료 확인
      const jwtExpired = isJWTExpired(tokenResult.data.accessToken);
      
      if (jwtExpired !== null) {
        isTokenExpired = jwtExpired;
      } else {
        // JWT 파싱 실패시 expiredAt 폴백 사용
        if (tokenResult.data.expiredAt) {
          isTokenExpired = Date.now() > tokenResult.data.expiredAt;
        } else {
          isTokenExpired = false; // 둘 다 없으면 만료되지 않은 것으로 간주
        }
      }
    }
    
    // 토큰이 있고 만료되지 않았으면 인증된 것으로 간주
    const isAuthenticated = hasToken && !isTokenExpired;
    
    return {
      isAuthenticated,
      hasToken,
      isTokenExpired
    };
  } catch (error) {
    console.error('❌ 인증 상태 확인 실패:', error);
    return {
      isAuthenticated: false,
      hasToken: false,
      isTokenExpired: true
    };
  }
}
