import type { ApiConfig } from 'growgrammers-auth-core';

// 환경별 API 설정
const API_CONFIGS = {
  development: {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '', // 환경변수 또는 Vite 프록시 사용
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
      googleLogout: '/api/v1/auth/google/logout', //소셜 로그아웃 통일 (클라에서 토큰 삭제)
      googleRefresh: '/api/v1/auth/members/refresh', //토큰 갱신 통일 (소셜+이메일)
      googleValidate: '/api/v1/auth/google/validate',
      googleUserinfo: '/api/v1/auth/members/user-info', //유저 정보 조회 통일 (소셜+이메일)

      // Kakao OAuth 엔드포인트
      kakaoLogin: '/api/v1/auth/kakao/login',
      kakaoLogout: '/api/v1/auth/kakao/logout',
      kakaoRefresh: '/api/v1/auth/members/refresh',
      kakaoValidate: '/api/v1/auth/kakao/validate',
      kakaoUserinfo: '/api/v1/auth/members/user-info',

      // Naver OAuth 엔드포인트
      naverLogin: '/api/v1/auth/naver/login',
      naverLogout: '/api/v1/auth/naver/logout',
      naverRefresh: '/api/v1/auth/members/refresh',
      naverValidate: '/api/v1/auth/naver/validate',
      naverUserinfo: '/api/v1/auth/members/user-info'
    }
  },
  production: {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ,
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
      googleUserinfo: '/api/v1/auth/members/user-info',

      // Kakao OAuth 엔드포인트
      kakaoLogin: '/api/v1/auth/kakao/login',
      kakaoLogout: '/api/v1/auth/kakao/logout',
      kakaoRefresh: '/api/v1/auth/members/refresh',
      kakaoValidate: '/api/v1/auth/kakao/validate',
      kakaoUserinfo: '/api/v1/auth/members/user-info',

      // Naver OAuth 엔드포인트
      naverLogin: '/api/v1/auth/naver/login',
      naverLogout: '/api/v1/auth/naver/logout',
      naverRefresh: '/api/v1/auth/members/refresh',
      naverValidate: '/api/v1/auth/naver/validate',
      naverUserinfo: '/api/v1/auth/members/user-info'
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
 * 필수 환경변수 확인 (빌드 타임 체크)
 */
export function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_KAKAO_CLIENT_ID',
    'VITE_NAVER_CLIENT_ID'
  ];

  const missingVars = requiredVars.filter((v) => !import.meta.env[v as keyof ImportMetaEnv]);

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

/**
 * Kakao 관련 설정 가져오기
 */
export function getKakaoConfig() {
  return {
    kakaoClientId: import.meta.env.VITE_KAKAO_CLIENT_ID,
    timeout: API_CONFIGS[getCurrentEnvironment()].timeout,
    retryCount: API_CONFIGS[getCurrentEnvironment()].retryCount
  } as const;
}

/**
 * Naver 관련 설정 가져오기
 */
export function getNaverConfig() {
  return {
    naverClientId: import.meta.env.VITE_NAVER_CLIENT_ID,
    timeout: API_CONFIGS[getCurrentEnvironment()].timeout,
    retryCount: API_CONFIGS[getCurrentEnvironment()].retryCount
  } as const;
}