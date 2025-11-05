/**
 * 429 에러 (Rate Limit) 처리 유틸리티
 * API 엔드포인트별로 다른 대기 시간 메시지를 반환
 */

/**
 * API 엔드포인트별 429 에러 메시지 설정
 */
const RATE_LIMIT_MESSAGES: Record<string, { waitMinutes: number; description: string }> = {
  // 인증코드보내기 - 3회 10분 🔴🔴🔴 가장 엄격 (비용 발생)
  '/auth/email/request': {
    waitMinutes: 10,
    description: '인증번호 요청'
  },
  
  // 인증코드확인 - 10회 5분 🔴🔴 무차별 대입 방지
  '/auth/email/verify': {
    waitMinutes: 5,
    description: '인증번호 확인'
  },
  
  // 이메일회원가입 / 로그인 - 5회 15분 🔴🔴 브루트포스 방지
  '/auth/members/email-login': {
    waitMinutes: 15,
    description: '이메일 로그인'
  },
  
  // 소셜로그인 - 10회 10분 🔴🔴 브루트포스 방지
  '/auth/google/login': {
    waitMinutes: 10,
    description: 'Google 로그인'
  },
  '/auth/kakao/login': {
    waitMinutes: 10,
    description: 'Kakao 로그인'
  },
  '/auth/naver/login': {
    waitMinutes: 10,
    description: 'Naver 로그인'
  },
  
  // 소셜, 이메일연동 - 5회 10분 🟡 이미 인증됨, 여러 계정
  '/auth/link/google': {
    waitMinutes: 10,
    description: 'Google 계정 연동'
  },
  '/auth/link/kakao': {
    waitMinutes: 10,
    description: 'Kakao 계정 연동'
  },
  '/auth/link/naver': {
    waitMinutes: 10,
    description: 'Naver 계정 연동'
  },
  '/auth/link/email-login': {
    waitMinutes: 10,
    description: '이메일 계정 연동'
  },
  
  // 리프레시 토큰 - 20회 1시간 🟡 정상 사용 4회, 여유분
  '/auth/members/refresh': {
    waitMinutes: 60,
    description: '토큰 갱신'
  },
  
  // 로그아웃 - 10회 1분 🟢 위험 낮음, 재시도 고려
  '/auth/members/logout': {
    waitMinutes: 1,
    description: '로그아웃'
  },
  
  // 내 정보 조회 - 30회 1분 🟢 조회성, SPA 동시 호출
  '/auth/members/user-info': {
    waitMinutes: 1,
    description: '사용자 정보 조회'
  }
};

/**
 * URL에서 API 엔드포인트 추출
 */
function extractEndpoint(url: string): string {
  try {
    // 전체 URL에서 경로 부분만 추출
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // URL 파싱 실패 시 전체 문자열에서 경로 부분 추출
    const match = url.match(/\/api\/v1\/[^\s?]+/);
    return match ? match[0] : url;
  }
}

/**
 * 429 에러 메시지 생성
 * @param url API 요청 URL
 * @param backendMessage 백엔드에서 보낸 메시지 (선택적)
 * @returns 사용자에게 표시할 에러 메시지
 */
export function getRateLimitErrorMessage(
  url: string,
  backendMessage?: string
): string {
  const endpoint = extractEndpoint(url);
  
  // 엔드포인트별 설정 찾기
  let rateLimitConfig: { waitMinutes: number; description: string } | undefined;
  
  // 정확한 매칭 먼저 시도
  if (RATE_LIMIT_MESSAGES[endpoint]) {
    rateLimitConfig = RATE_LIMIT_MESSAGES[endpoint];
  } else {
    // 부분 매칭 시도 (URL에 엔드포인트가 포함된 경우)
    for (const [key, config] of Object.entries(RATE_LIMIT_MESSAGES)) {
      if (endpoint.includes(key) || url.includes(key)) {
        rateLimitConfig = config;
        break;
      }
    }
  }
  
  // 설정이 있으면 해당 메시지 반환
  if (rateLimitConfig) {
    const { waitMinutes, description } = rateLimitConfig;
    return `❌ ${description} 횟수 제한을 초과했습니다. ${waitMinutes}분 후 다시 시도해주세요.`;
  }
  
  // 백엔드 메시지가 있으면 우선 사용
  if (backendMessage) {
    return `❌ ${backendMessage}`;
  }
  
  // 기본 메시지
  return '❌ 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * 429 에러인지 확인하고 메시지 생성
 * @param status HTTP 상태 코드
 * @param url API 요청 URL
 * @param backendMessage 백엔드에서 보낸 메시지 (선택적)
 * @returns 429 에러인 경우 메시지, 아니면 null
 */
export function handleRateLimitError(
  status: number,
  url: string,
  backendMessage?: string
): string | null {
  if (status === 429) {
    return getRateLimitErrorMessage(url, backendMessage);
  }
  return null;
}

/**
 * 메시지가 429 에러 메시지인지 확인
 * @param message 확인할 메시지
 * @returns 429 에러 메시지인지 여부
 */
export function isRateLimitErrorMessage(message: string): boolean {
  // 429 에러 메시지 패턴 확인
  const rateLimitPatterns = [
    '너무 많습니다',
    'too many',
    '429',
    'rate limit',
    'rate_limit',
    'rate_limit_exceeded',
    '제한을 초과',
    '분 후 다시 시도'
  ];
  
  return rateLimitPatterns.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}

