import { useState, useEffect } from 'react';
import { getAuthManager, getCurrentProviderType } from '../auth/authManager';
import { getTokenRefreshService } from '../auth/TokenRefreshService';
import { isJWTExpired, getExpirationFromJWT } from '../utils/jwtUtils';

// HttpOnly 쿠키는 JavaScript에서 접근할 수 없으므로 쿠키 읽기 함수는 사용하지 않음

interface DashboardProps {
  onLogout: () => void;
}

interface UserInfo {
  id?: string;
  email: string;
  nickname?: string;
  provider: string;
}

interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  refreshTokenFromCookie?: string;
  expiredAt?: number;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    loadUserData();
    
    // 토큰 만료 시간 추적 타이머
    const interval = setInterval(async () => {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();
      
      if (tokenResult.success && tokenResult.data?.accessToken) {
        // JWT에서 직접 남은 시간 계산
        const { getTimeUntilExpiryFromJWT } = await import('../utils/jwtUtils');
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
    }, 30000); // 30초마다 확인
    
    // 즉시 한 번 실행
    (async () => {
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();
      
      if (tokenResult.success && tokenResult.data?.accessToken) {
        // JWT에서 직접 남은 시간 계산
        const { getTimeUntilExpiryFromJWT } = await import('../utils/jwtUtils');
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
    })();
    
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const authManager = getAuthManager();
      
      // 토큰 정보 가져오기
      const tokenResult = await authManager.getToken();
      
      if (tokenResult.success && tokenResult.data) {
        setTokenInfo(tokenResult.data);
        
        // JWT에서 직접 남은 시간 계산하여 즉시 업데이트
        const { getTimeUntilExpiryFromJWT } = await import('../utils/jwtUtils');
        const remainingFromJWT = getTimeUntilExpiryFromJWT(tokenResult.data.accessToken);
        if (remainingFromJWT !== null) {
          setTimeUntilExpiry(remainingFromJWT);
        } else {
          // JWT 파싱 실패시 폴백
          const tokenRefreshService = getTokenRefreshService();
          const remaining = await tokenRefreshService.getTimeUntilExpiry();
          setTimeUntilExpiry(remaining);
        }
      } else {
        setTokenInfo(null);
        setTimeUntilExpiry(null);
      }

      // 사용자 정보 가져오기 (localStorage에서 먼저 확인)
      try {
        // localStorage에서 사용자 정보 확인
        const storedUserInfo = localStorage.getItem('user_info');
        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfo(parsedUserInfo);
          // 캐시된 데이터가 있으면 API 호출하지 않음 (중복 요청 방지)
          return;
        }
        
        // localStorage에 없을 때만 API 호출 (한 번만)
        const userResult = await authManager.getCurrentUserInfo();
        
        if (userResult.success && userResult.data) {
          setUserInfo(userResult.data);
          // localStorage에 저장
          localStorage.setItem('user_info', JSON.stringify(userResult.data));
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
              const userInfo = await userInfoResponse.json();
              
              // data 부분만 사용자 정보로 설정
              const actualUserInfo = userInfo.success && userInfo.data ? userInfo.data : userInfo;
              setUserInfo(actualUserInfo);
              localStorage.setItem('user_info', JSON.stringify(actualUserInfo));
            } else {
              throw new Error(`HTTP ${userInfoResponse.status}`);
            }
          } catch (directApiError) {
            console.warn('⚠️ 쿠키 기반 사용자 정보 가져오기도 실패, 더미 데이터 사용:', directApiError);
            const currentProvider = getCurrentProviderType();
            // 더미 사용자 정보 설정
            const dummyUserInfo = {
              id: 'demo-user',
              email: currentProvider === 'google' ? 'demo@gmail.com' : 
                     currentProvider === 'kakao' ? 'demo@kakao.com' : 'demo@example.com',
              nickname: currentProvider === 'google' ? 'Google 데모 사용자' : 
                       currentProvider === 'kakao' ? 'Kakao 데모 사용자' : '이메일 데모 사용자',
              provider: getCurrentProviderType()
            };
            setUserInfo(dummyUserInfo);
            localStorage.setItem('user_info', JSON.stringify(dummyUserInfo));
          }
        }
      } catch (userError) {
        console.warn('⚠️ 사용자 정보 API 오류, 더미 데이터 사용:', userError);
        const currentProvider = getCurrentProviderType();
        // 더미 사용자 정보 설정
        const dummyUserInfo = {
          id: 'demo-user',
          email: currentProvider === 'google' ? 'demo@gmail.com' : 
                 currentProvider === 'kakao' ? 'demo@kakao.com' : 'demo@example.com',
          nickname: currentProvider === 'google' ? 'Google 데모 사용자' : 
                   currentProvider === 'kakao' ? 'Kakao 데모 사용자' : '이메일 데모 사용자',
          provider: getCurrentProviderType()
        };
        setUserInfo(dummyUserInfo);
        localStorage.setItem('user_info', JSON.stringify(dummyUserInfo));
      }
    } catch (error) {
      console.error('❌ 사용자 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
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
            
            // JWT에서 직접 남은 시간 계산하여 즉시 업데이트
            const { getTimeUntilExpiryFromJWT } = await import('../utils/jwtUtils');
            const remainingFromJWT = getTimeUntilExpiryFromJWT(tokenResult.data.accessToken);
            
            if (remainingFromJWT !== null) {
              setTimeUntilExpiry(remainingFromJWT);
              break; // 성공하면 루프 종료
            }
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
          <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
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
            className="px-4 py-2 bg-gray-900 text-white border border-gray-900 rounded-lg font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 hover:bg-gray-700"
          >
            로그아웃 ({getCurrentProviderType()})
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        {/* 사용자 정보 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">👤 사용자 정보</h3>
          {userInfo ? (
            <div>
              {userInfo.id === 'demo-user' && (
                <div className="bg-yellow-50 text-yellow-800 p-2 rounded-md mb-4 text-xs text-center">
                  <small>🔧 백엔드 미완성으로 더미 데이터를 표시합니다</small>
                </div>
              )}
              <p className="my-3 text-sm flex justify-between items-center">
                <strong className="text-gray-900 font-semibold min-w-[80px]">이메일:</strong> 
                {userInfo.email}
              </p>
              <p className="my-3 text-sm flex justify-between items-center">
                <strong className="text-gray-900 font-semibold min-w-[80px]">닉네임:</strong> 
                {userInfo.nickname || '설정되지 않음'}
              </p>
              <p className="my-3 text-sm flex justify-between items-center">
                <strong className="text-gray-900 font-semibold min-w-[80px]">Provider:</strong> 
                {getCurrentProviderType()}
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-600 p-8">
              <p>⚠️ 사용자 정보를 불러올 수 없습니다.</p>
              <button 
                onClick={loadUserData} 
                className="p-3 px-4 bg-gray-900 text-white rounded-lg cursor-pointer text-sm font-medium mt-4 hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200"
              >
                🔄 다시 시도
              </button>
            </div>
          )}
        </div>

        {/* 토큰 정보 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">🔑 토큰 정보</h3>
          {tokenInfo ? (
            <div>
              <p className="my-3 text-sm flex justify-between items-center">
                <strong className="text-gray-900 font-semibold min-w-[80px]">Access Token:</strong> 
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono max-w-[200px] overflow-hidden text-ellipsis">
                  {tokenInfo.accessToken !== '토큰 없음' ? tokenInfo.accessToken.substring(0, 20) + '...' : '토큰 없음'}
                </code>
              </p>
              <p className="my-3 text-sm flex justify-between items-center">
                <strong className="text-gray-900 font-semibold min-w-[80px]">Refresh Token (쿠키):</strong> 
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                  🍪 HttpOnly 쿠키 (JS 접근 불가, 네트워크 탭에서 확인됨)
                </span>
              </p>
              {tokenInfo.accessToken && (() => {
                // JWT에서 만료 시간 추출 (기존 로직과 동일)
                const expiredAt = getExpirationFromJWT(tokenInfo.accessToken);
                return expiredAt ? (
                  <p className="my-3 text-sm flex justify-between items-center">
                    <strong className="text-gray-900 font-semibold min-w-[80px]">만료 시간:</strong> 
                    {new Date(expiredAt).toLocaleString()}
                  </p>
                ) : null;
              })()}
              {timeUntilExpiry !== null && (
                <p className="my-3 text-sm flex justify-between items-center">
                  <strong className="text-gray-900 font-semibold min-w-[80px]">남은 시간:</strong> 
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    timeUntilExpiry <= 5 
                      ? 'bg-red-100 text-red-800' 
                      : timeUntilExpiry <= 10
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {timeUntilExpiry <= 0 ? '만료됨' : `${timeUntilExpiry}분 남음`}
                  </span>
                </p>
              )}
              <div className="text-xs text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg">
                <small>💡 refreshToken은 보안상 HttpOnly 쿠키로 설정되어 JavaScript에서 접근할 수 없습니다. 이는 정상적인 보안 정책입니다.</small>
              </div>
            </div>
          ) : (
            <p>⚠️ 토큰 정보를 불러올 수 없습니다.</p>
          )}
        </div>

        {/* 자동 토큰 갱신 상태 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">🤖 자동 토큰 갱신</h3>
          <div className="text-sm text-gray-600 space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <strong className="text-green-800">활성화됨</strong>
              </div>
              <ul className="text-xs text-green-700 space-y-1 ml-4">
                <li>• 토큰 만료 5분 전에 자동 갱신</li>
                <li>• 1분마다 토큰 상태 확인</li>
                <li>• API 요청 전 자동 토큰 검증</li>
                <li>• 갱신 실패 시 자동 로그아웃</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 토큰 관리 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">🔧 수동 토큰 관리</h3>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRefreshToken} 
              disabled={isRefreshing}
              className="w-full p-3 bg-gray-900 text-white rounded-lg cursor-pointer font-medium hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isRefreshing ? '⏳ 갱신 중...' : '🔄 즉시 토큰 갱신'}
            </button>
            <button 
              onClick={handleTokenValidation}
              className="w-full p-3 bg-gray-900 text-white rounded-lg cursor-pointer font-medium hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200"
            >
              ✅ 토큰 검증
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
