import { useState, useEffect } from 'react';
import { checkAuthStatus, getAuthManager, getCurrentProviderType } from './auth/authManager';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import GoogleCallback from './components/GoogleCallback';
import './App.css';

// 전역 OAuth 처리 상태 (React Strict Mode 대응)
let globalOAuthProcessing = false;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'social' | 'phone' | null>(null);
  // 인증 상태는 isAuthenticated로만 관리 (간소화)

  // 현재 경로 확인
  const currentPath = window.location.pathname;
  
  // 초기 인증 상태 확인 및 OAuth 콜백 처리 (hooks는 조건부 return 전에)
  useEffect(() => {
    let hasRun = false;
    let isProcessing = false; // OAuth 처리 중 플래그 추가
    
    const runOnce = async () => {
      if (hasRun || isProcessing) {
          // 중복 실행 방지
        return;
      }
      hasRun = true;
      isProcessing = true;
      
      // 앱 초기화 시작
      
      try {
        await checkInitialAuthStatus();
        await handleOAuthCallback();
      } finally {
        isProcessing = false;
        // 앱 초기화 완료
      }
    };
    
    runOnce();
  }, []);

  // Google OAuth 콜백 페이지 라우팅 (hooks 후에 처리)
  if (currentPath === '/auth/google/callback') {
    return <GoogleCallback />;
  }

  // OAuth 콜백 처리 (localStorage에서 인증 코드 확인)
  const handleOAuthCallback = async () => {
    // 이미 처리 중인지 확인 (중복 실행 방지 - localStorage + 전역 변수)
    const isOAuthProcessing = localStorage.getItem('oauth_processing');
    if (isOAuthProcessing === 'true' || globalOAuthProcessing) {
      // OAuth 이미 처리 중, 중복 실행 방지
      return;
    }
    
    // OAuth 진행 상태 정리
    const oauthInProgress = localStorage.getItem('oauth_in_progress');
    if (oauthInProgress === 'true') {
      // OAuth 진행 상태 정리
      localStorage.removeItem('oauth_in_progress');
      localStorage.removeItem('oauth_provider');
    }
    
    const googleAuthCode = localStorage.getItem('google_auth_code');
    const codeVerifier = localStorage.getItem('google_oauth_code_verifier');
    
    if (googleAuthCode && codeVerifier) {
      // 처리 중 플래그 설정 (이중 보안)
      localStorage.setItem('oauth_processing', 'true');
      globalOAuthProcessing = true;
      // Google OAuth 콜백 처리 시작
      
      try {
        // Google AuthManager 설정 및 로그인 처리
        const { resetAuthManager } = await import('./auth/authManager');
        const authManager = resetAuthManager('google');
        
        // 백엔드에 전달할 redirectUri를 명시적으로 설정
        const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
        
        // 로그인 파라미터 설정
        
        const result = await authManager.login({
          provider: 'google',
          authCode: googleAuthCode,
          codeVerifier: codeVerifier,
          redirectUri: redirectUri // 프론트엔드에서 사용한 redirectUri를 백엔드에 전달
        });
        
        if (result.success) {
          setIsAuthenticated(true);
          setShowSplash(false);
          setShowMethodSelector(false);
        } else {
          console.error('❌ Google 로그인 실패:', result.message);
        }
      } catch (error) {
        console.error('❌ OAuth 콜백 처리 중 오류:', error);
      } finally {
        // 사용한 인증 코드 및 PKCE 파라미터 삭제
        localStorage.removeItem('google_auth_code');
        localStorage.removeItem('google_oauth_code_verifier');
        localStorage.removeItem('google_oauth_state');
        localStorage.removeItem('oauth_processing'); // 처리 완료 플래그 제거
        globalOAuthProcessing = false; // 전역 플래그도 리셋
        // OAuth 콜백 처리 정리 완료
      }
    } else if (googleAuthCode && !codeVerifier) {
      console.warn('⚠️ authCode는 있지만 codeVerifier가 없습니다. PKCE 플로우가 제대로 작동하지 않았을 수 있습니다.');
      localStorage.removeItem('google_auth_code'); // 불완전한 데이터 정리
    }
  };

  const checkInitialAuthStatus = async () => {
    try {
      setIsLoading(true);
      const status = await checkAuthStatus();
      setIsAuthenticated(status.isAuthenticated);
      
      // console.log('🔍 인증 상태 확인:', {
      //   isAuthenticated: status.isAuthenticated,
      //   hasToken: status.hasToken,
      //   isTokenExpired: status.isTokenExpired
      // });
    } catch (error) {
      console.error('❌ 초기 인증 상태 확인 실패:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartApp = () => {
    setShowSplash(false);
    setShowMethodSelector(true);
  };

  const handleMethodSelect = (method: 'email' | 'social' | 'phone') => {
    if (method === 'phone') {
      alert('📱 전화번호 로그인은 현재 구현 예정입니다. 조금만 기다려주세요!');
      return;
    }
    
    setSelectedMethod(method);
    setShowMethodSelector(false);
  };

  const handleBackToMethodSelector = () => {
    setSelectedMethod(null);
    setShowMethodSelector(true);
  };

  const handleBackToSplash = () => {
    setShowSplash(true);
    setShowMethodSelector(false);
    setSelectedMethod(null);
  };

  const handleLoginSuccess = async () => {
      // 로그인 성공, 인증 상태 업데이트
    
    // 먼저 즉시 인증 상태를 true로 설정
    setIsAuthenticated(true);
    
    // 잠시 후 토큰 상태를 확인하여 UI 업데이트
    setTimeout(async () => {
      await checkInitialAuthStatus();
    }, 500);
  };

  const handleLogout = async () => {
    try {
      const authManager = getAuthManager();
      const currentProvider = getCurrentProviderType();
      
      if (currentProvider === 'google') {
        // 구글 로그인: 프론트엔드에서만 로그아웃 처리 (백엔드 API 호출 없음)
        
        // 로컬 토큰 스토어에서 토큰 삭제
        const tokenStore = authManager['tokenStore']; // private 속성에 접근
        if (tokenStore && typeof tokenStore.removeToken === 'function') {
          await tokenStore.removeToken();
        }
        
        // 쿠키에서 토큰들 삭제
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // OAuth 관련 localStorage 정리
        localStorage.removeItem('google_auth_code');
        localStorage.removeItem('google_oauth_code_verifier');
        localStorage.removeItem('google_oauth_state');
        localStorage.removeItem('oauth_processing');
        localStorage.removeItem('oauth_in_progress');
        localStorage.removeItem('oauth_provider');
        
        // 인증 상태 업데이트 및 스플래시 화면으로 돌아가기
        setIsAuthenticated(false);
        setShowSplash(true);
        setShowMethodSelector(false);
        setSelectedMethod(null);
        
      } else {
        // 이메일 로그인: 백엔드 API 호출
        const result = await authManager.logout({ 
          provider: currentProvider
        });
        
        if (result.success) {
          setIsAuthenticated(false);
          setShowSplash(true);
          setShowMethodSelector(false);
          setSelectedMethod(null);
        } else {
          console.error('❌ 로그아웃 실패:', result.message);
          alert('로그아웃에 실패했습니다: ' + result.message);
        }
      }
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error);
      if (getCurrentProviderType() === 'google') {
        // 구글 로그인의 경우 오류가 있어도 스플래시 화면으로 돌아가기
        setIsAuthenticated(false);
        setShowSplash(true);
        setShowMethodSelector(false);
        setSelectedMethod(null);
      } else {
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  // 스플래시 화면 표시
  if (showSplash) {
    return (
      <div className="app">
        <div className="splash-screen">
          <h1>🚀 Login Demo</h1>
          <p>auth-core를 사용한 실제 백엔드 연동 로그인 시스템을 체험해보세요</p>
          <button className="start-btn" onClick={handleStartApp}>
            시작하기
          </button>
        </div>
      </div>
    );
  }

  // 로그인 방법 선택 화면
  if (showMethodSelector) {
    return (
      <div className="app">
        <button className="close-btn" onClick={handleBackToSplash}>
          ×
        </button>
        
        <div className="method-selector">
          <div className="method-header">
            <h2>시작하기</h2>
            <p>업체가 요구하는 문구를 작성하는 영역입니다. 최대 2줄까지 노출 최대 2줄까지 노출.....</p>
          </div>
          
          <div className="method-options">
            <button 
              className="method-btn primary-method"
              onClick={() => handleMethodSelect('phone')}
            >
              <div className="method-info">
                <h3>전화번호로 계속하기</h3>
              </div>
            </button>
            
            <button 
              className="method-btn secondary-method"
              onClick={() => handleMethodSelect('email')}
            >
              <div className="method-info">
                <h3>이메일로 계속하기</h3>
              </div>
            </button>
            
            <div className="social-divider">
              <span>또는</span>
            </div>
            
            <div className="social-buttons">
              <button 
                className="social-btn facebook"
                onClick={() => handleMethodSelect('social')}
              >
                <div className="social-icon">📘</div>
              </button>
              
              <button 
                className="social-btn apple"
                onClick={() => handleMethodSelect('social')}
              >
                <div className="social-icon">🍎</div>
              </button>
              
              <button 
                className="social-btn google"
                onClick={() => handleMethodSelect('social')}
              >
                <div className="social-icon">🔍</div>
              </button>
            </div>
            
            <p className="terms-text">
              계정이 기억나지 않으세요?
            </p>
            
            <p className="privacy-text">
              계속하기 [서비스약관]의 <strong>이용 약관</strong>에 동의하는 것 입니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <h3>인증 상태 확인 중...</h3>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 인증 상태 헤더 */}
      <div className="auth-header">
        <span className={`status-indicator ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`}>
          {isAuthenticated ? '🟢 인증됨' : '🔴 미인증'}
        </span>
      </div>

      <main className="app-main">
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <LoginForm 
            onLoginSuccess={handleLoginSuccess} 
            onBack={handleBackToMethodSelector}
            selectedMethod={selectedMethod}
          />
        )}
      </main>
    </div>
  );
}

export default App;