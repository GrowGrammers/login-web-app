import { useState, useEffect } from 'react';
import { getAuthManager, getCurrentProviderType } from '../auth/authManager';

// HttpOnly 쿠키는 JavaScript에서 접근할 수 없으므로 쿠키 읽기 함수는 사용하지 않음

interface DashboardProps {
  onLogout: () => void;
}

interface UserInfo {
  id: string;
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

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const authManager = getAuthManager();
      
      // 토큰 정보 가져오기
      const tokenResult = await authManager.getToken();
      
      if (tokenResult.success && tokenResult.data) {
        setTokenInfo(tokenResult.data);
      } else {
        setTokenInfo(null);
      }

      // 사용자 정보 가져오기 (백엔드 미완성으로 인한 임시 처리)
      try {
        const userResult = await authManager.getCurrentUserInfo();
        if (userResult.success && userResult.data) {
          setUserInfo(userResult.data);
        } else {
          console.warn('⚠️ 사용자 정보 조회 실패, 더미 데이터 사용:', userResult.message);
          const currentProvider = getCurrentProviderType();
          // 더미 사용자 정보 설정
          setUserInfo({
            id: 'demo-user',
            email: currentProvider === 'google' ? 'demo@gmail.com' : 'demo@example.com',
            nickname: currentProvider === 'google' ? 'Google 데모 사용자' : '이메일 데모 사용자',
            provider: currentProvider
          });
        }
      } catch (userError) {
        console.warn('⚠️ 사용자 정보 API 오류, 더미 데이터 사용:', userError);
        const currentProvider = getCurrentProviderType();
        // 더미 사용자 정보 설정
        setUserInfo({
          id: 'demo-user',
          email: currentProvider === 'google' ? 'demo@gmail.com' : 'demo@example.com',
          nickname: currentProvider === 'google' ? 'Google 데모 사용자' : '이메일 데모 사용자',
          provider: currentProvider
        });
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
      const authManager = getAuthManager();
      const currentProvider = getCurrentProviderType();
      
      // 토큰 갱신 시작
      
      const result = await authManager.refreshToken({
        provider: currentProvider
        // 웹 환경에서는 deviceId 불필요 (모바일용 필드)
        // 웹에서는 refreshToken을 쿠키에서 자동으로 가져옴
      });

      if (result.success) {
        alert('✅ 토큰이 성공적으로 갱신되었습니다.');
        await loadUserData(); // 데이터 새로고침
      } else {
        console.error('❌ 토큰 갱신 실패:', result.error);
        alert('❌ 토큰 갱신에 실패했습니다: ' + result.message);
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
      
      if (hasToken && tokenResult.data) {
        if (tokenResult.data.expiredAt) {
          isTokenExpired = Date.now() > tokenResult.data.expiredAt;
        } else {
          isTokenExpired = false;
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
      <div className="dashboard">
        <div className="loading">
          <h3>👤 사용자 정보 로드 중...</h3>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">👋 환영합니다!</h2>
        <div className="logout-buttons">
          <button onClick={onLogout} className="logout-btn primary">
            로그아웃 ({getCurrentProviderType()})
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* 사용자 정보 */}
        <div className="info-section">
          <h3>👤 사용자 정보</h3>
          {userInfo ? (
            <div className="user-info">
              {userInfo.id === 'demo-user' && (
                <div className="demo-notice">
                  <small>🔧 백엔드 미완성으로 더미 데이터를 표시합니다</small>
                </div>
              )}
              <p><strong>ID:</strong> {userInfo.id}</p>
              <p><strong>이메일:</strong> {userInfo.email}</p>
              <p><strong>닉네임:</strong> {userInfo.nickname || '설정되지 않음'}</p>
              <p><strong>Provider:</strong> {userInfo.provider}</p>
            </div>
          ) : (
            <div className="no-data">
              <p>⚠️ 사용자 정보를 불러올 수 없습니다.</p>
              <button onClick={loadUserData} className="retry-btn">
                🔄 다시 시도
              </button>
            </div>
          )}
        </div>

        {/* 토큰 정보 */}
        <div className="info-section">
          <h3>🔑 토큰 정보</h3>
          {tokenInfo ? (
            <div className="token-info">
              <p><strong>Access Token:</strong> 
                <code>{tokenInfo.accessToken !== '토큰 없음' ? tokenInfo.accessToken.substring(0, 20) + '...' : '토큰 없음'}</code>
              </p>
              <p><strong>Refresh Token (쿠키):</strong> 
                <span className="cookie-info">🍪 HttpOnly 쿠키 (JS 접근 불가, 네트워크 탭에서 확인됨)</span>
              </p>
              {tokenInfo.expiredAt && (
                <p><strong>만료 시간:</strong> 
                  {new Date(tokenInfo.expiredAt).toLocaleString()}
                </p>
              )}
              <div className="token-notice">
                <small>💡 refreshToken은 보안상 HttpOnly 쿠키로 설정되어 JavaScript에서 접근할 수 없습니다. 이는 정상적인 보안 정책입니다.</small>
              </div>
            </div>
          ) : (
            <p>⚠️ 토큰 정보를 불러올 수 없습니다.</p>
          )}
        </div>

        {/* 토큰 관리 */}
        <div className="token-actions">
          <h3>🔧 토큰 관리</h3>
          <div className="action-buttons">
            <button 
              onClick={handleRefreshToken} 
              disabled={isRefreshing}
              className="action-btn"
            >
              {isRefreshing ? '⏳ 갱신 중...' : '🔄 토큰 갱신'}
            </button>
            <button 
              onClick={handleTokenValidation}
              className="action-btn"
            >
              ✅ 토큰 검증
            </button>
            <button 
              onClick={loadUserData}
              className="action-btn"
            >
              🔄 데이터 새로고침
            </button>
            <button 
              onClick={() => {
                console.log('🔍 수동 디버깅:');
                console.log('- document.cookie:', document.cookie);
                console.log('- localStorage keys:', Object.keys(localStorage));
                console.log('- login_web_app_tokens:', localStorage.getItem('login_web_app_tokens'));
                
                // 모든 쿠키 이름 확인
                const allCookies = document.cookie.split(';');
                const cookieNames = allCookies.map(c => c.trim().split('=')[0]);
                console.log('- 모든 쿠키 이름들:', cookieNames);
                
                alert('콘솔을 확인하세요!');
              }}
              className="action-btn"
            >
              🔍 디버깅 정보
            </button>
          </div>
        </div>

        {/* API 테스트 */}
        <div className="api-test">
          <h3>🧪 API 테스트</h3>
          <p>실제 백엔드와 연동하여 토큰 기반 인증을 테스트할 수 있습니다.</p>
          <div className="test-info">
            <p>✅ 웹 플랫폼 (쿠키 기반 Refresh Token)</p>
            <p>✅ X-Client-Type: web 헤더 자동 설정</p>
            <p>✅ credentials: 'include'로 쿠키 전송</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
