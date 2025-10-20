import { useState, useEffect, useRef } from 'react';
import { getAuthManager, getCurrentProviderType } from '../../../auth/authManager';
import { getTokenRefreshService } from '../../../auth/TokenRefreshService';
import { isJWTExpired } from '../../../utils/jwtUtils';
import { useAuthStatus } from '../../../hooks';
import { useAuthStore } from '../../../stores/authStore';
import { BUTTON_STYLES, LOADING_STYLES } from '../../../styles';
import {
  SocialAccountLink,
  UserInfoSection,
  TokenInfoSection,
  AutoTokenRefreshSection,
  TokenManagementSection
} from './sections';

// HttpOnly 쿠키는 JavaScript에서 접근할 수 없으므로 쿠키 읽기 함수는 사용하지 않음

interface DashboardProps {
  onLogout: () => void;
}

interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  refreshTokenFromCookie?: string;
  expiredAt?: number;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const { isAuthenticated, timeUntilExpiry, tokenExpiredAt, userInfo } = useAuthStatus();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLoadingUserData = useRef(false); // 중복 API 호출 방지

  useEffect(() => {
    // 인증된 상태에서만 사용자 데이터 로드
    if (isAuthenticated) {
      loadUserData();
    } else {
      // 인증되지 않은 상태면 로딩 중단
      setIsLoading(false);
    }
    
    // 토큰 만료 시간은 useAuthStatus 훅에서 관리
  }, [isAuthenticated]);

  const loadUserData = async () => {
    // 이미 로딩 중이면 중복 호출 방지 (React Strict Mode 대응)
    if (isLoadingUserData.current) {
      return;
    }

    try {
      isLoadingUserData.current = true;
      setIsLoading(true);
      const authManager = getAuthManager();
      
      // 토큰 정보 가져오기
      const tokenResult = await authManager.getToken();
      
      if (tokenResult.success && tokenResult.data) {
        setTokenInfo(tokenResult.data);
        
        // 토큰 만료 시간은 useAuthStatus 훅에서 자동 관리됨
      } else {
        setTokenInfo(null);
      }

      // 사용자 정보 가져오기 (캐시된 데이터 먼저 확인)
      try {
        // 일원화된 메서드로 캐시된 데이터 확인 (localStorage 접근 일원화)
        const cachedUserInfo = useAuthStore.getState().loadUserInfoFromStorage();
        if (cachedUserInfo) {
          // 캐시된 데이터가 있으면 API 호출하지 않음 (중복 요청 방지)
          return;
        }
        
        // 캐시에 없을 때만 API 호출 (한 번만)
        const userResult = await authManager.getCurrentUserInfo();
        
        if (userResult.success && userResult.data) {
          // 일원화된 메서드로 저장 (localStorage 접근 일원화)
          useAuthStore.getState().setUserInfo(userResult.data);
        } else {
          // AuthManager 실패 시 쿠키 기반으로 직접 API 호출 (한 번만)
          try {
            const userInfoResponse = await fetch('/api/v1/auth/members/user-info', {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'X-Client-Type': 'web'
              },
              credentials: 'include' // 쿠키 포함
            });

            if (userInfoResponse.ok) {
              const userInfoData = await userInfoResponse.json();
              
              // data 부분만 사용자 정보로 설정
              const actualUserInfo = userInfoData.success && userInfoData.data ? userInfoData.data : userInfoData;
              // 일원화된 메서드로 저장 (localStorage 접근 일원화)
              useAuthStore.getState().setUserInfo(actualUserInfo);
            } else {
              throw new Error(`HTTP ${userInfoResponse.status}`);
            }
          } catch (directApiError) {
            console.warn('⚠️ 쿠키 기반 사용자 정보 가져오기도 실패, 더미 데이터 사용:', directApiError);
            // 더미 사용자 정보 설정
            const dummyUserInfo = {
              id: 'demo-user',
              email: 'demo@example.com',
              nickname: '데모 사용자',
              provider: 'unknown'
            };
            // 일원화된 메서드로 저장 (localStorage 접근 일원화)
            useAuthStore.getState().setUserInfo(dummyUserInfo);
          }
        }
      } catch (userError) {
        console.warn('⚠️ 사용자 정보 API 오류, 더미 데이터 사용:', userError);
        // 더미 사용자 정보 설정
        const dummyUserInfo = {
          id: 'demo-user',
          email: 'demo@example.com',
          nickname: '데모 사용자',
          provider: 'unknown'
        };
        // 일원화된 메서드로 저장 (localStorage 접근 일원화)
        useAuthStore.getState().setUserInfo(dummyUserInfo);
      }
    } catch (error) {
      console.error('❌ 사용자 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
      isLoadingUserData.current = false;
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsRefreshing(true);
      
      // 토큰 갱신 서비스를 통한 수동 갱신
      const tokenRefreshService = getTokenRefreshService();
      const success = await tokenRefreshService.manualRefresh();

      if (success) {
        alert('✅ 토큰이 성공적으로 갱신되었습니다.');
        
        // 토큰 갱신 후 잠시 대기 (서버에서 토큰이 완전히 갱신될 때까지)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 토큰 정보 강제 새로고침 (여러 번 시도)
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms 대기
          
          const authManager = getAuthManager();
          const tokenResult = await authManager.getToken();
          
          if (tokenResult.success && tokenResult.data) {
            setTokenInfo(tokenResult.data);
            
            // 토큰 만료 시간은 useAuthStatus 훅에서 자동 관리됨
            break; // 성공하면 루프 종료
          }
          
          retryCount++;
        }
        
        await loadUserData(); // 데이터 새로고침
      } else {
        alert('❌ 토큰 갱신에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 토큰 갱신 중 오류:', error);
      alert('❌ 토큰 갱신 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTokenValidation = async () => {
    try {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();
      
      if (!tokenResult.success || !tokenResult.data) {
        alert('❌ 토큰이 없습니다.');
        return;
      }

      // 로컬에서만 토큰 검증 (백엔드 호출 없음)
      const hasToken = tokenResult.success && !!tokenResult.data;
      let isTokenExpired = true;
      
      if (hasToken && tokenResult.data && tokenResult.data.accessToken) {
        // JWT에서 직접 만료 확인
        const jwtExpired = isJWTExpired(tokenResult.data.accessToken);
        
        if (jwtExpired !== null) {
          isTokenExpired = jwtExpired;
        } else {
          // JWT 파싱 실패시 expiredAt 폴백 사용
          if (tokenResult.data.expiredAt) {
            isTokenExpired = Date.now() > tokenResult.data.expiredAt;
          } else {
            isTokenExpired = false;
          }
        }
      }
      
      const isValid = hasToken && !isTokenExpired;
      alert(isValid ? '✅ 토큰이 유효합니다.' : '❌ 토큰이 무효합니다.');
      
    } catch (error) {
      console.error('❌ 토큰 검증 중 오류:', error);
      alert('❌ 토큰 검증 중 오류가 발생했습니다.');
    }
  };


  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="text-gray-900 mb-4 text-xl font-semibold">👤 사용자 정보 로드 중...</h3>
          <div className={LOADING_STYLES.default}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 bg-gray-50 border-b border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">👋 환영합니다!</h2>
        <div className="flex gap-3 flex-wrap justify-center">
          <button 
            onClick={onLogout} 
            className={BUTTON_STYLES.primary}
          >
            로그아웃 ({getCurrentProviderType()})
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <UserInfoSection userInfo={userInfo} loadUserData={loadUserData} />
        <SocialAccountLink />
        <TokenInfoSection 
          tokenInfo={tokenInfo} 
          tokenExpiredAt={tokenExpiredAt} 
          timeUntilExpiry={timeUntilExpiry} 
        />
        <AutoTokenRefreshSection />
        <TokenManagementSection 
          handleRefreshToken={handleRefreshToken}
          handleTokenValidation={handleTokenValidation}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
};

export default Dashboard;
