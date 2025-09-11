import type { ApiConfig } from 'auth-core';

// 환경별 API 설정
const API_CONFIGS = {
  development: {
    apiBaseUrl: '', // Vite 프록시 사용
    timeout: 10000,
    retryCount: 3,
    endpoints: {
      // 이메일 인증 엔드포인트 (실제 백엔드 API 경로와 일치)
      requestVerification: '/api/v1/auth/email/request',
      verifyEmail: '/api/v1/auth/email/verify',
      login: '/api/v1/auth/members/email-login',
      logout: '/api/v1/auth/members/logout',
      refresh: '/api/v1/auth/members/refresh',
      validate: '/api/v1/auth/validate-token',
      me: '/api/v1/auth/members/user-info',
      health: '/api/v1/health',

      // Google OAuth 엔드포인트
      googleLogin: '/api/v1/auth/google/login',
      googleLogout: '/api/v1/auth/google/logout',
      googleRefresh: '/api/v1/auth/members/refresh',
      googleValidate: '/api/v1/auth/google/validate',
      googleUserinfo: '/api/v1/auth/members/user-info'
    }
  },
  production: {
    apiBaseUrl: 'https://your-production-api.com',
    timeout: 15000,
    retryCount: 3,
    endpoints: {
      // 이메일 인증 엔드포인트 (실제 백엔드 API 경로와 일치)
      requestVerification: '/api/v1/auth/email/request',
      verifyEmail: '/api/v1/auth/email/verify',
      login: '/api/v1/auth/members/email-login',
      logout: '/api/v1/auth/members/logout',
      refresh: '/api/v1/auth/members/refresh',
      validate: '/api/v1/auth/validate-token',
      me: '/api/v1/auth/members/user-info',
      health: '/api/v1/health',

      // Google OAuth 엔드포인트
      googleLogin: '/api/v1/auth/google/login',
      googleLogout: '/api/v1/auth/google/logout',
      googleRefresh: '/api/v1/auth/members/refresh',
      googleValidate: '/api/v1/auth/google/validate',
      googleUserinfo: '/api/v1/auth/members/user-info'
    }
  }
} as const;

// 현재 환경 감지
const getCurrentEnvironment = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'development' as const;
  }
  return 'production' as const;
};

/**
 * API 설정 가져오기
 */
export function getApiConfig(): ApiConfig {
  const env = getCurrentEnvironment();
  const config = API_CONFIGS[env];
  return {
    apiBaseUrl: config.apiBaseUrl,
    timeout: config.timeout,
    retryCount: config.retryCount,
    endpoints: { ...config.endpoints }
  };
}

/**
 * Google OAuth 관련 환경변수 확인 (빌드 타임 체크)
 */
export function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_GOOGLE_CLIENT_ID'
  ];

  const missingVars = requiredVars.filter((v) => !import.meta.env[v as 'VITE_GOOGLE_CLIENT_ID']);

  if (missingVars.length > 0) {
    console.warn('⚠️ 누락된 환경변수:', missingVars.join(', '));
  }
}

/**
 * Google 관련 설정 가져오기
 */
export function getGoogleConfig() {
  return {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    timeout: API_CONFIGS[getCurrentEnvironment()].timeout,
    retryCount: API_CONFIGS[getCurrentEnvironment()].retryCount
  } as const;
}