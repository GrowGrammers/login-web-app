import { create } from 'zustand';
import { checkAuthStatus, getAuthManager } from '../auth/authManager';
import { getTokenRefreshService } from '../auth/TokenRefreshService';
import { getTimeUntilExpiryFromJWT } from '../utils/jwtUtils';

/**
 * 사용자 정보 타입
 */
export interface UserInfo {
  id?: string;
  email: string;
  nickname?: string;
  provider: string;
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  isLoading: boolean;
  timeUntilExpiry: number | null;
  userInfo: UserInfo | null;

  // Actions
  setAuthStatus: (status: Partial<AuthState>) => void;
  refreshAuthStatus: () => Promise<void>;
  login: (userInfo?: UserInfo) => void;
  logout: () => void;
  updateTimeUntilExpiry: () => Promise<void>;
  startExpiryTimer: () => void;
  stopExpiryTimer: () => void;
}

// 타이머 ID 저장
let expiryTimerInterval: number | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태
  isAuthenticated: false,
  isLoading: true,
  timeUntilExpiry: null,
  userInfo: null,

  // 상태 업데이트
  setAuthStatus: (status) => set(status),

  // 인증 상태 새로고침
  refreshAuthStatus: async () => {
    try {
      set({ isLoading: true });
      const authStatus = await checkAuthStatus();
      set({ isAuthenticated: authStatus.isAuthenticated });

      if (authStatus.isAuthenticated) {
        // 토큰 만료 시간 추적
        const authManager = getAuthManager();
        const tokenResult = await authManager.getToken();

        if (tokenResult.success && tokenResult.data?.accessToken) {
          // JWT에서 직접 남은 시간 계산
          const remainingFromJWT = getTimeUntilExpiryFromJWT(tokenResult.data.accessToken);
          if (remainingFromJWT !== null) {
            set({ timeUntilExpiry: remainingFromJWT });
          } else {
            // JWT 파싱 실패시 폴백
            const tokenRefreshService = getTokenRefreshService();
            const remaining = await tokenRefreshService.getTimeUntilExpiry();
            set({ timeUntilExpiry: remaining });
          }
        }

        // 사용자 정보 로드 (localStorage에서)
        const storedUserInfo = localStorage.getItem('user_info');
        if (storedUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(storedUserInfo);
            set({ userInfo: parsedUserInfo });
          } catch (error) {
            console.error('사용자 정보 파싱 실패:', error);
          }
        }
      } else {
        // 인증되지 않은 경우 상태 초기화
        set({ timeUntilExpiry: null, userInfo: null });
      }
    } catch (error) {
      console.error('인증 상태 확인 중 오류:', error);
      set({ isAuthenticated: false, timeUntilExpiry: null, userInfo: null });
    } finally {
      set({ isLoading: false });
    }
  },

  // 로그인 처리
  login: (userInfo) => {
    set({
      isAuthenticated: true,
      isLoading: false,
      userInfo: userInfo || null
    });

    // 로그인 후 타이머 시작
    get().startExpiryTimer();
  },

  // 로그아웃 처리
  logout: () => {
    set({
      isAuthenticated: false,
      userInfo: null,
      timeUntilExpiry: null,
      isLoading: false
    });

    // 로그아웃 시 타이머 중지
    get().stopExpiryTimer();

    // localStorage 정리
    localStorage.removeItem('user_info');
  },

  // 토큰 만료 시간 업데이트
  updateTimeUntilExpiry: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return;

    try {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();

      if (tokenResult.success && tokenResult.data?.accessToken) {
        const remainingFromJWT = getTimeUntilExpiryFromJWT(tokenResult.data.accessToken);
        if (remainingFromJWT !== null) {
          set({ timeUntilExpiry: remainingFromJWT });
        } else {
          const tokenRefreshService = getTokenRefreshService();
          const remaining = await tokenRefreshService.getTimeUntilExpiry();
          set({ timeUntilExpiry: remaining });
        }
      }
    } catch (error) {
      console.error('토큰 만료 시간 업데이트 중 오류:', error);
    }
  },

  // 만료 시간 타이머 시작
  startExpiryTimer: () => {
    // 기존 타이머가 있으면 중지
    if (expiryTimerInterval) {
      clearInterval(expiryTimerInterval);
    }

    // 30초마다 토큰 만료 시간 업데이트
    expiryTimerInterval = window.setInterval(() => {
      get().updateTimeUntilExpiry();
    }, 30000);

    // 즉시 한 번 실행
    get().updateTimeUntilExpiry();
  },

  // 만료 시간 타이머 중지
  stopExpiryTimer: () => {
    if (expiryTimerInterval) {
      clearInterval(expiryTimerInterval);
      expiryTimerInterval = null;
    }
  }
}));

// 앱 시작 시 인증 상태 확인
export const initializeAuthStore = async () => {
  await useAuthStore.getState().refreshAuthStatus();
  
  // 인증된 상태면 타이머 시작
  if (useAuthStore.getState().isAuthenticated) {
    useAuthStore.getState().startExpiryTimer();
  }
};

// 페이지 언로드 시 타이머 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useAuthStore.getState().stopExpiryTimer();
  });
}

