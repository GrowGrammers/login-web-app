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
      me: '/api/v1/auth/user-info',
      health: '/api/v1/health',

      // Google OAuth 엔드포인트
      googleLogin: '/api/v1/auth/google/login',
      googleLogout: '/api/v1/auth/google/logout',
      googleRefresh: '/api/v1/auth/google/refresh',
      googleValidate: '/api/v1/auth/google/validate',
      googleUserinfo: '/api/v1/auth/google/userinfo'
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
      me: '/api/v1/auth/user-info',
      health: '/api/v1/health',

      // Google OAuth 엔드포인트
      googleLogin: '/api/v1/auth/google/login',
      googleLogout: '/api/v1/auth/google/logout',
      googleRefresh: '/api/v1/auth/google/refresh',
      googleValidate: '/api/v1/auth/google/validate',
      googleUserinfo: '/api/v1/auth/google/userinfo'
    }
  }
} as const;

// 현재 환경 감지
const getCurrentEnvironment = (): 'development' | 'production' => {
  if (import.meta.env.MODE === 'production') {
    return 'production';
  }
  return 'development';
};

// 현재 환경의 API 설정 가져오기
export const getApiConfig = (): ApiConfig => {
  const env = getCurrentEnvironment();
  const config = API_CONFIGS[env];
  
  console.log(`🔧 API 설정 로드됨 (${env}):`, {
    baseUrl: config.apiBaseUrl,
    timeout: config.timeout
  });
  
  return config;
};

// Google OAuth 설정 (환경변수에서 로드)
export const getGoogleConfig = () => ({
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
  // redirectUri는 백엔드에서 환경변수로 관리
  timeout: 10000,
  retryCount: 3
});

// 개발용 환경변수 확인
export const checkEnvironmentVariables = () => {
  const required = ['VITE_GOOGLE_CLIENT_ID'];
  const frontend_optional = ['VITE_GOOGLE_REDIRECT_URI']; // 프론트엔드에서만 사용 (Google OAuth URL 생성용)
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️ 누락된 환경변수:', missing);
    console.log('💡 .env 파일에 다음 변수들을 추가하세요:');
    missing.forEach(key => {
      console.log(`${key}=your_value_here`);
    });
  }
  
  if (frontend_optional.some(key => !import.meta.env[key])) {
    console.info('💡 선택적 환경변수 (프론트엔드 전용, 기본값 사용 중):', 
      frontend_optional.filter(key => !import.meta.env[key]));
  }
  
  return missing.length === 0;
};