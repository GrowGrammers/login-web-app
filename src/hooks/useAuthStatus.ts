import { useAuthStore, type UserInfo } from '../stores/authStore';

interface UseAuthStatusReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  timeUntilExpiry: number | null;
  tokenExpiredAt: number | null;
  userInfo: UserInfo | null;
  refreshAuthStatus: () => Promise<void>;
  login: (userInfo?: UserInfo) => void;
  logout: () => void;
}

/**
 * 인증 상태 관리 훅 (Zustand 기반)
 * 이제 전역 상태를 사용하므로 모든 컴포넌트가 동일한 상태를 공유합니다.
 */
export const useAuthStatus = (): UseAuthStatusReturn => {
  const {
    isAuthenticated,
    isLoading,
    timeUntilExpiry,
    tokenExpiredAt,
    userInfo,
    refreshAuthStatus,
    login,
    logout
  } = useAuthStore();

  return {
    isAuthenticated,
    isLoading,
    timeUntilExpiry,
    tokenExpiredAt,
    userInfo,
    refreshAuthStatus,
    login,
    logout
  };
};
