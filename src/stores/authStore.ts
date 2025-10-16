import { create } from 'zustand';
import { checkAuthStatus, getAuthManager } from '../auth/authManager';
import { getTokenRefreshService } from '../auth/TokenRefreshService';
import { getExpirationFromJWT } from '../utils/jwtUtils';

/**
 * 사용자 정보 타입
 * 
 * 보안 참고:
 * - localStorage 저장은 authStore의 setUserInfo/clearUserInfo를 통해서만 수행
 * - XSS 공격 시 PII 유출 위험이 있으므로 최소 필드만 저장 권장
 * - 향후 암호화나 다른 저장소로 변경 시 이 store만 수정하면 됨
 */
export interface UserInfo {
  id?: string;
  email: string;
  nickname?: string;
  provider: string;
  linkedProviders?: string[]; // 백엔드에서 받은 연동된 provider 목록
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  isLoading: boolean;
  timeUntilExpiry: number | null;
  tokenExpiredAt: number | null; // 토큰 만료 시간 (밀리초 타임스탬프)
  userInfo: UserInfo | null;

  // Actions
  setAuthStatus: (status: Partial<AuthState>) => void;
  refreshAuthStatus: () => Promise<void>;
  login: (userInfo?: UserInfo) => void;
  logout: () => void;
  updateTimeUntilExpiry: () => Promise<void>;
  updateTimeUntilExpiryFromTimestamp: () => void;
  startExpiryTimer: () => void;
  stopExpiryTimer: () => void;
  // UserInfo 관리 (localStorage 일원화)
  setUserInfo: (userInfo: UserInfo) => void;
  loadUserInfoFromStorage: () => UserInfo | null;
  clearUserInfo: () => void;
}

// 타이머 ID 저장
let expiryTimerInterval: number | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태
  isAuthenticated: false,
  isLoading: true,
  timeUntilExpiry: null,
  tokenExpiredAt: null,
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
          // JWT에서 만료 시간 가져오기 (밀리초 타임스탬프)
          const expiredAt = getExpirationFromJWT(tokenResult.data.accessToken);
          
          if (expiredAt !== null) {
            // 만료 시간 저장
            set({ tokenExpiredAt: expiredAt });
            
            // 남은 시간 계산 (분 단위)
            const remainingMs = expiredAt - Date.now();
            const remainingMinutes = Math.max(0, Math.floor(remainingMs / (60 * 1000)));
            set({ timeUntilExpiry: remainingMinutes });
          } else {
            // JWT 파싱 실패시 폴백
            const tokenRefreshService = getTokenRefreshService();
            const remaining = await tokenRefreshService.getTimeUntilExpiry();
            set({ timeUntilExpiry: remaining, tokenExpiredAt: null });
          }
        }

        // 사용자 정보 로드 (일원화된 메서드 사용)
        get().loadUserInfoFromStorage();
      } else {
        // 인증되지 않은 경우 상태 초기화
        set({ timeUntilExpiry: null, tokenExpiredAt: null });
        get().clearUserInfo();
      }
    } catch (error) {
      console.error('인증 상태 확인 중 오류:', error);
      set({ isAuthenticated: false, timeUntilExpiry: null, tokenExpiredAt: null });
      get().clearUserInfo();
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
      timeUntilExpiry: null,
      tokenExpiredAt: null,
      isLoading: false
    });

    // 로그아웃 시 타이머 중지
    get().stopExpiryTimer();

    // UserInfo 및 localStorage 정리 (일원화된 메서드 사용)
    get().clearUserInfo();
  },

  // 토큰 만료 시간 업데이트 (JWT에서 만료 시간을 가져와 저장)
  updateTimeUntilExpiry: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return;

    try {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();

      if (tokenResult.success && tokenResult.data?.accessToken) {
        // JWT에서 만료 시간 가져오기 (밀리초 타임스탬프)
        const expiredAt = getExpirationFromJWT(tokenResult.data.accessToken);
        
        if (expiredAt !== null) {
          // 만료 시간 저장
          set({ tokenExpiredAt: expiredAt });
          
          // 남은 시간 계산 (분 단위)
          const remainingMs = expiredAt - Date.now();
          const remainingMinutes = Math.max(0, Math.floor(remainingMs / (60 * 1000)));
          set({ timeUntilExpiry: remainingMinutes });
        } else {
          // JWT 파싱 실패시 폴백
          const tokenRefreshService = getTokenRefreshService();
          const remaining = await tokenRefreshService.getTimeUntilExpiry();
          set({ timeUntilExpiry: remaining, tokenExpiredAt: null });
        }
      }
    } catch (error) {
      console.error('토큰 만료 시간 업데이트 중 오류:', error);
    }
  },

  // 타임스탬프로부터 남은 시간 계산 (30초마다 호출)
  updateTimeUntilExpiryFromTimestamp: () => {
    const { tokenExpiredAt, isAuthenticated } = get();
    if (!isAuthenticated || !tokenExpiredAt) return;

    const remainingMs = tokenExpiredAt - Date.now();
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / (60 * 1000)));
    set({ timeUntilExpiry: remainingMinutes });
  },

  // 만료 시간 타이머 시작
  startExpiryTimer: () => {
    // 기존 타이머가 있으면 중지
    if (expiryTimerInterval) {
      clearInterval(expiryTimerInterval);
    }

    // 즉시 한 번 실행 (JWT에서 만료 시간 가져오기)
    get().updateTimeUntilExpiry();

    // 30초마다 남은 시간 업데이트 (분 단위 표시에 적합한 주기)
    expiryTimerInterval = window.setInterval(() => {
      get().updateTimeUntilExpiryFromTimestamp();
    }, 30_000); // 30초마다 업데이트
  },

  // 만료 시간 타이머 중지
  stopExpiryTimer: () => {
    if (expiryTimerInterval) {
      clearInterval(expiryTimerInterval);
      expiryTimerInterval = null;
    }
  },

  /**
   * UserInfo 설정 및 localStorage 저장 (일원화된 진입점)
   * 
   * 보안: localStorage 접근을 이 메서드로 일원화하여
   * - 무분별한 PII 저장 방지
   * - 향후 암호화 적용 시 한 곳만 수정
   * - 감사/로깅 추가 용이
   */
  setUserInfo: (userInfo: UserInfo) => {
    set({ userInfo });
    try {
      localStorage.setItem('user_info', JSON.stringify(userInfo));
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
  },

  /**
   * localStorage에서 UserInfo 로드 (일원화된 진입점)
   * 
   * 보안: localStorage 읽기를 이 메서드로 일원화
   */
  loadUserInfoFromStorage: (): UserInfo | null => {
    try {
      const storedUserInfo = localStorage.getItem('user_info');
      if (storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        set({ userInfo: parsedUserInfo });
        return parsedUserInfo;
      }
    } catch (error) {
      console.error('localStorage 로드 실패:', error);
    }
    return null;
  },

  /**
   * UserInfo 및 localStorage 정리 (일원화된 진입점)
   * 
   * 보안: localStorage 삭제를 이 메서드로 일원화
   */
  clearUserInfo: () => {
    set({ userInfo: null });
    try {
      localStorage.removeItem('user_info');
    } catch (error) {
      console.error('localStorage 정리 실패:', error);
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

