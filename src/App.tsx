import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { checkAuthStatus, getAuthManager, getCurrentProviderType } from './auth/authManager';
import { initializeTokenRefreshService } from './auth/TokenRefreshService';
import LoginSelector from './components/LoginSelector';
import EmailLogin from './components/EmailLogin';
import GoogleLogin from './components/GoogleLogin';
import Dashboard from './components/Dashboard';
import GoogleCallback from './components/GoogleCallback';
import './App.css';

// 전역 OAuth 처리 상태 (React Strict Mode 대응)
let globalOAuthProcessing = false;

// Main App 컴포넌트 (Router 내부)
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 초기 인증 상태 확인 및 OAuth 콜백 처리
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
      
      try {
        await checkInitialAuthStatus();
        await handleOAuthCallback();
      } finally {
        isProcessing = false;
      }
    };
    
    runOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // OAuth 콜백 처리 (localStorage에서 인증 코드 확인)
  const handleOAuthCallback = async () => {
    // Google OAuth 콜백 경로에서는 실행하지 않음
    if (location.pathname === '/auth/google/callback') {
      return;
    }
    
    // 이미 처리 중인지 확인 (중복 실행 방지 - localStorage + 전역 변수)
    const isOAuthProcessing = localStorage.getItem('oauth_processing');
    if (isOAuthProcessing === 'true' || globalOAuthProcessing) {
      return;
    }
    
    // Google OAuth 코드 확인
    const googleAuthCode = localStorage.getItem('google_auth_code');
    
    // OAuth 진행 상태 정리
    const oauthInProgress = localStorage.getItem('oauth_in_progress');
    if (oauthInProgress === 'true') {
      // OAuth 진행 상태 정리
      localStorage.removeItem('oauth_in_progress');
      localStorage.removeItem('oauth_provider');
    }
    
    const codeVerifier = localStorage.getItem('google_oauth_code_verifier');
    
    if (googleAuthCode && codeVerifier) {
      // 처리 중 플래그 설정 (이중 보안)
      localStorage.setItem('oauth_processing', 'true');
      globalOAuthProcessing = true;
      // 스플래시는 숨기되, 전역 로딩 화면은 사용하지 않음
      setShowSplash(false);
      
      try {
        // Google AuthManager 설정 및 로그인 처리
        const { resetAuthManager } = await import('./auth/authManager');
        const authManager = resetAuthManager('google');
        
        // redirectUri는 백엔드에서 환경변수 사용하도록 전송하지 않음
        const result = await authManager.login({
          provider: 'google',
          authCode: googleAuthCode,
          codeVerifier: codeVerifier
          // redirectUri 제거 - 백엔드에서 환경변수 사용
        });
        
        if (result.success) {
          setIsAuthenticated(true);
          // 로그인 성공 시 토큰 갱신 서비스 시작
          initializeTokenRefreshService();
          setShowSplash(false);
          navigate('/dashboard');
        } else {
          console.error('Google 로그인 실패:', result.message);
        }
      } catch (error) {
        console.error('OAuth 콜백 처리 중 오류:', error);
      } finally {
        // 사용한 인증 코드 및 PKCE 파라미터 삭제
        localStorage.removeItem('google_auth_code');
        localStorage.removeItem('google_oauth_code_verifier');
        localStorage.removeItem('google_oauth_state');
        localStorage.removeItem('oauth_processing');
        globalOAuthProcessing = false;
        // 전역 로딩 해제 불필요 (전역 로딩을 사용하지 않음)
      }
    } else if (googleAuthCode && !codeVerifier) {
      console.warn('authCode는 있지만 codeVerifier가 없습니다. PKCE 플로우가 제대로 작동하지 않았을 수 있습니다.');
      localStorage.removeItem('google_auth_code');
    }
  };

  const checkInitialAuthStatus = async () => {
    try {
      setIsLoading(true);
      const status = await checkAuthStatus();
      setIsAuthenticated(status.isAuthenticated);
      
      if (status.isAuthenticated) {
        // 인증된 상태이면 토큰 갱신 서비스 시작
        initializeTokenRefreshService();
        setShowSplash(false);
        // 인증된 상태이면 대시보드로 리다이렉트
        navigate('/dashboard');
      } else {
        // 인증되지 않은 상태이면 스플래시 화면을 숨김 (로그인 페이지 접근 허용)
        setShowSplash(false);
      }
    } catch (error) {
      console.error('❌ 초기 인증 상태 확인 실패:', error);
      setIsAuthenticated(false);
      // 에러 발생 시에도 스플래시 화면을 숨김 (로그인 페이지 접근 허용)
      setShowSplash(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartApp = () => {
    setShowSplash(false);
    navigate('/start');
  };

  const handleBackToSplash = () => {
    setShowSplash(true);
    navigate('/');
  };

  const handleLoginSuccess = async () => {
    // 로그인 성공, 인증 상태 업데이트
    setIsAuthenticated(true);
    // 로그인 성공 시 토큰 갱신 서비스 시작
    initializeTokenRefreshService();
    navigate('/dashboard');
    
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
        // 구글 로그인: 프론트엔드에서만 로그아웃 처리
        const tokenStore = authManager['tokenStore'];
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
        localStorage.removeItem('current_provider_type');
        
        // 인증 상태 업데이트 및 스플래시 화면으로 돌아가기
        setIsAuthenticated(false);
        setShowSplash(true);
        alert('✅ 로그아웃되었습니다.');
        navigate('/');
        
      } else {
        // 이메일 로그인: 백엔드 API 호출
        const result = await authManager.logout({ 
          provider: currentProvider
        });
        
        if (result.success) {
          // 이메일 로그아웃 시에도 provider type 정리
          localStorage.removeItem('current_provider_type');
          setIsAuthenticated(false);
          setShowSplash(true);
          alert('✅ 로그아웃되었습니다.');
          navigate('/');
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
        navigate('/');
      } else {
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-white border-l border-r border-gray-200 shadow-xl">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="text-gray-900 mb-4 text-xl font-semibold">인증 상태 확인 중...</h3>
          <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // 스플래시 화면 표시 조건
  if (showSplash || location.pathname === '/') {
    return (
      <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-white border-l border-r border-gray-200 shadow-xl">
        <div className="min-h-screen flex flex-col justify-center items-center p-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Login</h3>
          <button 
            className="w-full max-w-md p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200"
            onClick={handleStartApp}
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-white border-l border-r border-gray-200 shadow-xl">
      {/* 인증 상태 헤더 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-center relative">
        {/* 뒤로가기 버튼 - 시작하기 페이지가 아닐 때만 표시 */}
        {location.pathname !== '/start' && (
          <button 
            className="absolute left-4 bg-transparent border-0 text-2xl cursor-pointer text-gray-600 hover:text-gray-900"
            onClick={() => navigate('/start')}
          >
            ←
          </button>
        )}
        
        {/* 인증 상태 - 항상 중앙 정렬 */}
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${
          isAuthenticated 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isAuthenticated ? '🟢 인증됨' : '🔴 미인증'}
        </span>
      </div>

      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/start" element={<LoginSelector onBack={handleBackToSplash} />} />
          <Route path="/login/email" element={<EmailLogin onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/login/google" element={<GoogleLogin />} />
          <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
        </Routes>
      </main>
    </div>
  );
}

// Router로 감싸는 최상위 App 컴포넌트
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;