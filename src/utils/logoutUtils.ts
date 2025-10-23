/**
 * @deprecated 이 파일은 더 이상 사용되지 않습니다.
 * 대신 hooks/useLogout.ts를 사용하세요.
 * 
 * 변경 이유:
 * - Utils는 순수 함수여야 하는데 이 파일은 Zustand Store를 직접 변경했습니다.
 * - 로그아웃 로직을 hooks/useLogout.ts로 이동하여 관심사를 명확히 분리했습니다.
 * 
 * 마이그레이션 가이드:
 * Before:
 *   import { handleOAuthLogout, handleEmailLogout } from '../utils/logoutUtils';
 *   const result = await handleOAuthLogout(provider, authManager);
 * 
 * After:
 *   import { useLogout } from '../hooks';
 *   const { logout } = useLogout();
 *   const result = await logout();
 */

// 하위 호환성을 위해 빈 파일로 유지
// 향후 버전에서 완전히 제거될 예정
