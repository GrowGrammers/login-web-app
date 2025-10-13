import { useState, useEffect } from 'react';
import { checkAuthStatus, getAuthManager } from '../auth/authManager';
import { getTokenRefreshService } from '../auth/TokenRefreshService';
import { getTimeUntilExpiryFromJWT } from '../utils/jwtUtils';

interface UseAuthStatusReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  timeUntilExpiry: number | null;
  refreshAuthStatus: () => Promise<void>;
}

export const useAuthStatus = (): UseAuthStatusReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);

  const refreshAuthStatus = async () => {
    try {
      setIsLoading(true);
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus.isAuthenticated);
      
      if (authStatus.isAuthenticated) {
        // 토큰 만료 시간 추적
        const authManager = getAuthManager();
        const tokenResult = await authManager.getToken();
        
        if (tokenResult.success && tokenResult.data?.accessToken) {
          // JWT에서 직접 남은 시간 계산
          const remainingFromJWT = getTimeUntilExpiryFromJWT(tokenResult.data.accessToken);
          if (remainingFromJWT !== null) {
            setTimeUntilExpiry(remainingFromJWT);
          } else {
            // JWT 파싱 실패시 폴백
            const tokenRefreshService = getTokenRefreshService();
            const remaining = await tokenRefreshService.getTimeUntilExpiry();
            setTimeUntilExpiry(remaining);
          }
        }
      }
    } catch (error) {
      console.error('인증 상태 확인 중 오류:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuthStatus();
    
    // 토큰 만료 시간 추적 타이머
    const interval = setInterval(async () => {
      if (isAuthenticated) {
        const authManager = getAuthManager();
        const tokenResult = await authManager.getToken();
        
        if (tokenResult.success && tokenResult.data?.accessToken) {
          const remainingFromJWT = getTimeUntilExpiryFromJWT(tokenResult.data.accessToken);
          if (remainingFromJWT !== null) {
            setTimeUntilExpiry(remainingFromJWT);
          } else {
            const tokenRefreshService = getTokenRefreshService();
            const remaining = await tokenRefreshService.getTimeUntilExpiry();
            setTimeUntilExpiry(remaining);
          }
        }
      }
    }, 30000); // 30초마다 확인
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    timeUntilExpiry,
    refreshAuthStatus
  };
};
