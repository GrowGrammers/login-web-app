/**
 * 이메일 유효성 검사 유틸리티 함수들
 */

/**
 * 이메일 유효성 검사 결과 타입
 */
export interface EmailValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 이메일 유효성 검사 함수
 * @param email 검사할 이메일 주소
 * @returns 유효성 검사 결과
 */
export function validateEmail(email: string): EmailValidationResult {
  // 1. 공백 또는 입력하지 않은 경우
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      errorMessage: '이메일을 입력해주세요.'
    };
  }

  const trimmedEmail = email.trim();

  // 2. 길이 검사 (255자 초과)
  if (trimmedEmail.length > 255) {
    return {
      isValid: false,
      errorMessage: '이메일 주소가 너무 깁니다. (최대 255자)'
    };
  }

  // 3. 기본 이메일 형식 검사 (최소 길이 및 @ 포함)
  if (trimmedEmail.length < 5 || !trimmedEmail.includes('@')) {
    return {
      isValid: false,
      errorMessage: '올바른 이메일 형식이 아닙니다.'
    };
  }

  // 4. @ 기호가 여러 개 있는 경우
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      errorMessage: '이메일 주소에 @ 기호는 하나만 포함되어야 합니다.'
    };
  }

  const [localPart, domainPart] = trimmedEmail.split('@');

  // 5. 로컬 부분(아이디) 검사
  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      errorMessage: '이메일 아이디를 입력해주세요.'
    };
  }

  // 6. 도메인 부분 검사
  if (!domainPart || domainPart.length === 0) {
    return {
      isValid: false,
      errorMessage: '이메일 도메인을 입력해주세요.'
    };
  }

  // 7. 앞뒤 점(.)이 있는 경우
  if (localPart.startsWith('.') || localPart.endsWith('.') || 
      domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return {
      isValid: false,
      errorMessage: '이메일 주소는 점(.)으로 시작하거나 끝날 수 없습니다.'
    };
  }

  // 8. 도메인에 점이 두 번 연속인 경우
  if (domainPart.includes('..')) {
    return {
      isValid: false,
      errorMessage: '도메인에 점(.)이 연속으로 올 수 없습니다.'
    };
  }

  // 9. 한글, 특수문자 포함 검사 (허용되지 않는 문자)
  const invalidCharsRegex = /[가-힣<>{}[\]\\|`~!@#$%^&*()+=\s]/;
  if (invalidCharsRegex.test(localPart) || invalidCharsRegex.test(domainPart)) {
    return {
      isValid: false,
      errorMessage: '이메일 주소에 한글, 공백, 특수문자(<, >, {, }, [, ], \\, |, `, ~, !, @, #, $, %, ^, &, *, (, ), +, =)는 사용할 수 없습니다.'
    };
  }

  // 10. 지나치게 짧은 경우 (예: a.@b.c)
  if (localPart.length < 2 || domainPart.length < 4) {
    return {
      isValid: false,
      errorMessage: '이메일 주소가 너무 짧습니다.'
    };
  }

  // 11. 도메인에 최소 하나의 점이 있어야 함
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      errorMessage: '도메인에는 최소 하나의 점(.)이 포함되어야 합니다.'
    };
  }

  // 12. 최종 이메일 형식 검사 (RFC 5322 기반 간소화된 정규식)
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      errorMessage: '올바른 이메일 형식이 아닙니다.'
    };
  }

  return {
    isValid: true
  };
}

/**
 * 이메일 유효성 검사 후 alert 표시
 * @param email 검사할 이메일 주소
 * @returns 유효성 검사 통과 여부
 */
export function validateEmailWithAlert(email: string): boolean {
  const result = validateEmail(email);
  
  if (!result.isValid) {
    alert('유효한 이메일 주소를 입력해주세요.');
    return false;
  }
  
  return true;
}
