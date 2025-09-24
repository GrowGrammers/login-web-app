import { getAuthManager, getCurrentProviderType } from './authManager';
import { getExpirationFromJWT, getTimeUntilExpiryFromJWT } from '../utils/jwtUtils';

interface TokenRefreshConfig {
  refreshThresholdMinutes: number; // 만료 몇 분 전에 갱신할지
  checkIntervalSeconds: number; // 몇 초마다 토큰을 체크할지
}

export class TokenRefreshService {
  private intervalId: number | null = null;
  private config: TokenRefreshConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: TokenRefreshConfig = {
    refreshThresholdMinutes: 5, // 5분 전에 갱신
    checkIntervalSeconds: 60    // 1분마다 체크
  }) {
    this.config = config;
  }

  /**
   * 토큰 모니터링 시작
   */
  start(): void {
    if (this.intervalId) {
      // 이미 실행 중이면 조용히 무시 (정상적인 동작)
      return;
    }

    this.intervalId = window.setInterval(() => {
      this.checkAndRefreshToken();
    }, this.config.checkIntervalSeconds * 1000);

    // 즉시 한 번 체크
    this.checkAndRefreshToken();
  }

  /**
   * 토큰 모니터링 중지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 토큰 체크 및 필요시 갱신
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();

      if (!tokenResult.success || !tokenResult.data) {
        // 토큰이 없으면 체크하지 않음
        return;
      }

      const token = tokenResult.data;
      
      // 만료 시간이 없으면 갱신하지 않음
      if (!token.expiredAt) {
        return;
      }

      const now = Date.now();
      const expireTime = token.expiredAt;
      const thresholdTime = this.config.refreshThresholdMinutes * 60 * 1000; // 임계값을 밀리초로 변환

      // 만료 임계값에 도달했는지 확인
      if (expireTime - now <= thresholdTime) {
        await this.refreshToken();
      }
    } catch (error) {
      console.error('[TokenRefreshService] 토큰 체크 중 오류:', error);
    }
  }

  /**
   * 토큰 갱신 (중복 요청 방지)
   * @param forceRefresh 강제 갱신 여부 (만료 시간과 관계없이 갱신)
   */
  async refreshToken(forceRefresh: boolean = false): Promise<boolean> {
    // 이미 갱신 중이면 기존 Promise 반환
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise;
    }

    // 강제 갱신이 아닌 경우 토큰 만료 임계값 확인
    if (!forceRefresh) {
      const shouldRefresh = await this.shouldRefreshToken();
      if (!shouldRefresh) {
        return true; // 갱신이 필요하지 않음
      }
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 토큰 갱신이 필요한지 확인
   */
  private async shouldRefreshToken(): Promise<boolean> {
    try {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();

      if (!tokenResult.success || !tokenResult.data || !tokenResult.data.accessToken) {
        return false; // 토큰이 없으면 갱신하지 않음
      }

      const token = tokenResult.data;
      
      // JWT에서 만료 시간 추출
      const expireTime = getExpirationFromJWT(token.accessToken);
      
      if (!expireTime) {
        // JWT 파싱 실패시 expiredAt 폴백 사용
        if (!token.expiredAt) {
          return false; // 만료 시간 정보가 없으면 갱신하지 않음
        }
        const now = Date.now();
        const thresholdTime = this.config.refreshThresholdMinutes * 60 * 1000;
        return token.expiredAt - now <= thresholdTime;
      }

      const now = Date.now();
      const thresholdTime = this.config.refreshThresholdMinutes * 60 * 1000;

      // 만료 임계값에 도달했는지 확인
      return expireTime - now <= thresholdTime;
    } catch (error) {
      console.error('[TokenRefreshService] 토큰 갱신 필요성 확인 중 오류:', error);
      return false;
    }
  }

  /**
   * 실제 토큰 갱신 수행
   */
  private async performRefresh(): Promise<boolean> {
    try {
      const authManager = getAuthManager();
      
      // 웹에서는 refreshToken을 쿠키로 관리하므로 현재 provider 타입으로 갱신
      const currentProvider = getCurrentProviderType();
      const refreshResult = await authManager.refreshToken({ 
        provider: currentProvider
      });

      if (refreshResult.success) {
        return true;
      } else {
        console.error('[TokenRefreshService] 토큰 갱신 실패:', refreshResult.error);
        
        // 갱신 실패 시 로그아웃 처리
        await this.handleRefreshFailure();
        return false;
      }
    } catch (error) {
      console.error('[TokenRefreshService] 토큰 갱신 중 오류:', error);
      await this.handleRefreshFailure();
      return false;
    }
  }

  /**
   * 토큰 갱신 실패 시 처리
   */
  private async handleRefreshFailure(): Promise<void> {
    try {
      const authManager = getAuthManager();
      
      // 토큰 삭제
      await authManager.clear();
      
      // 로그인 페이지로 리다이렉트
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[TokenRefreshService] 갱신 실패 처리 중 오류:', error);
    }
  }

  /**
   * 수동 토큰 갱신 (UI에서 호출 가능)
   */
  async manualRefresh(): Promise<boolean> {
    return await this.refreshToken(true); // 강제 갱신
  }

  /**
   * 토큰 만료까지 남은 시간 확인 (분 단위)
   */
  async getTimeUntilExpiry(): Promise<number | null> {
    try {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();

      if (!tokenResult.success || !tokenResult.data?.accessToken) {
        return null;
      }

      const token = tokenResult.data;
      
      // JWT에서 직접 시간 계산
      const remainingTime = getTimeUntilExpiryFromJWT(token.accessToken);
      
      if (remainingTime !== null) {
        return remainingTime;
      }
      
      // JWT 파싱 실패시 expiredAt 폴백 사용
      if (!token.expiredAt) {
        return null;
      }

      const now = Date.now();
      const expireTime = token.expiredAt;
      const remainingMs = expireTime - now;

      return Math.max(0, Math.floor(remainingMs / (60 * 1000))); // 분 단위로 반환
    } catch (error) {
      console.error('[TokenRefreshService] 만료 시간 계산 중 오류:', error);
      return null;
    }
  }
}

// 전역 인스턴스
let tokenRefreshServiceInstance: TokenRefreshService | null = null;
let isInitialized = false; // 초기화 상태 추적

/**
 * 토큰 갱신 서비스 인스턴스 가져오기 (싱글톤)
 */
export function getTokenRefreshService(): TokenRefreshService {
  if (!tokenRefreshServiceInstance) {
    tokenRefreshServiceInstance = new TokenRefreshService();
  }
  return tokenRefreshServiceInstance;
}

/**
 * 토큰 갱신 서비스 초기화 (앱 시작 시 호출)
 * 중복 호출 방지로 한 번만 초기화됨
 */
export function initializeTokenRefreshService(): void {
  if (isInitialized) {
    // 이미 초기화되었으면 조용히 무시
    return;
  }
  
  const service = getTokenRefreshService();
  service.start();
  isInitialized = true;
  
  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    service.stop();
    isInitialized = false; // 재초기화 가능하도록 리셋
  });
}
