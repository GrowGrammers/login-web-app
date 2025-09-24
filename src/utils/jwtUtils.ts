import { jwtDecode } from 'jwt-decode';

/**
 * JWT 토큰에서 만료 시간을 추출
 * @param token JWT 토큰 문자열
 * @returns 만료 시간 (밀리초) 또는 null
 */
export function getExpirationFromJWT(token: string): number | null {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    return decoded.exp ? decoded.exp * 1000 : null; // exp는 초 단위, 밀리초로 변환
  } catch (error) {
    console.error('❌ JWT 파싱 실패:', error);
    return null;
  }
}

/**
 * JWT 토큰이 만료되었는지 확인
 * @param token JWT 토큰 문자열
 * @returns 만료 여부 (true: 만료됨, false: 유효함, null: 파싱 실패)
 */
export function isJWTExpired(token: string): boolean | null {
  const expiredAt = getExpirationFromJWT(token);
  if (expiredAt === null) return null;
  
  return Date.now() > expiredAt;
}

/**
 * JWT 토큰에서 만료까지 남은 시간을 계산 (분 단위)
 * @param token JWT 토큰 문자열
 * @returns 남은 시간 (분) 또는 null
 */
export function getTimeUntilExpiryFromJWT(token: string): number | null {
  const expiredAt = getExpirationFromJWT(token);
  if (expiredAt === null) return null;
  
  const remainingMs = expiredAt - Date.now();
  return Math.max(0, Math.floor(remainingMs / (60 * 1000))); // 분 단위로 반환
}
