import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { checkAuthStatus, getAuthManager, getCurrentProviderType } from './auth/authManager';
import { handleOAuthLogout, handleEmailLogout, isOAuthProvider } from './utils/logoutUtils';
import { processOAuthProvider, isOAuthCallbackPath, cleanupOAuthProgress } from './utils/oauthCallbackUtils';
import { initializeTokenRefreshService } from './auth/TokenRefreshService';

    /**
     * 이메일 로그인 후 사용자 정보 가져오기
     */
    async function fetchUserInfoAfterEmailLogin(): Promise<void> {
      try {
        // 토큰이 저장될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('❌ 이메일 로그인 후처리 중 오류:', error);
      }
    }
import LoginSelector from './components/LoginSelector';
import EmailLogin, { type EmailLoginRef } from './components/EmailLogin';
import GoogleLogin from './components/oauth/GoogleLogin';
import KakaoLogin from './components/oauth/KakaoLogin';
import NaverLogin from './components/oauth/NaverLogin';
import LoginComplete from './components/LoginComplete';
import Dashboard from './components/Dashboard';
import GoogleCallback from './components/oauth/GoogleCallback';
import KakaoCallback from './components/oauth/KakaoCallback';
import NaverCallback from './components/oauth/NaverCallback';
import './App.css';

// 전역 OAuth 처리 상태 (React Strict Mode 대응)
const globalOAuthProcessing = { value: false };

// Main App 컴포넌트 (Router 내부)
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [emailLoginStep, setEmailLoginStep] = useState<'email' | 'verification'>('email');
  const emailLoginRef = useRef<EmailLoginRef>(null);
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
    // OAuth 콜백 경로에서는 실행하지 않음
    if (isOAuthCallbackPath(location.pathname)) {
      return;
    }
    
    // 이미 처리 중인지 확인 (중복 실행 방지 - localStorage + 전역 변수)
    const isOAuthProcessing = localStorage.getItem('oauth_processing');
    if (isOAuthProcessing === 'true' || globalOAuthProcessing.value) {
      return;
    }
    
    // OAuth 코드 확인 (Google, Kakao, Naver)
    const googleAuthCode = localStorage.getItem('google_auth_code');
    const kakaoAuthCode = localStorage.getItem('kakao_auth_code');
    const naverAuthCode = localStorage.getItem('naver_auth_code');
    
    // OAuth 진행 상태 정리
    cleanupOAuthProgress();
    
    // OAuth 제공자별 처리
    const oauthProviders = [
      { provider: 'google' as const, authCode: googleAuthCode },
      { provider: 'kakao' as const, authCode: kakaoAuthCode },
      { provider: 'naver' as const, authCode: naverAuthCode }
    ];
    
    for (const { provider, authCode } of oauthProviders) {
      if (authCode) {
        await processOAuthProvider(
          provider,
          authCode,
          setShowSplash,
          setIsAuthenticated,
          initializeTokenRefreshService,
          navigate,
          globalOAuthProcessing
        );
        break; // 한 번에 하나의 제공자만 처리
      }
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
        // 이미 로그인 완료 페이지나 대시보드에 있으면 리다이렉트하지 않음
        if (location.pathname !== '/login/complete' && location.pathname !== '/dashboard') {
          navigate('/login/complete');
        }
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
    
    // 사용자 정보 가져오기 시도 (이메일 로그인의 경우)
    const currentProvider = getCurrentProviderType();
    if (currentProvider === 'email') {
      await fetchUserInfoAfterEmailLogin();
    }
    
    navigate('/login/complete');
    
    // 잠시 후 토큰 상태를 확인하여 UI 업데이트
    setTimeout(async () => {
      await checkInitialAuthStatus();
    }, 500);
  };

  const handleLogout = async () => {
    try {
      const authManager = getAuthManager();
      const currentProvider = getCurrentProviderType();
      
      // 모든 로그인 방식 통일: 백엔드 API 호출
      let result;
      if (isOAuthProvider(currentProvider)) {
        // OAuth 로그인: API 호출 방식으로 통일
        result = await handleOAuthLogout(currentProvider, authManager);
      } else {
        // 이메일 로그인: 기존 방식 유지
        result = await handleEmailLogout(authManager, currentProvider);
      }
      
      if (result.success) {
        setIsAuthenticated(false);
        setShowSplash(true);
        alert('✅ 로그아웃되었습니다.');
        navigate('/');
      } else {
        console.error('❌ 로그아웃 실패:', result.message);
        alert('로그아웃에 실패했습니다: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
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
        <div className="min-h-screen flex flex-col justify-end items-center p-8">
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

  // 보호된 라우트인지 확인
  const isProtectedRoute = (path: string) => {
    return path === '/login/complete' || path === '/login/connect';
  };

  // 보호된 라우트에 접근 시 인증되지 않은 경우 리다이렉트
  if (isProtectedRoute(location.pathname) && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-white border-l border-r border-gray-200 shadow-xl">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="text-gray-900 mb-4 text-xl font-semibold">로그인이 필요합니다</h3>
          <p className="text-gray-600 mb-6">이 페이지에 접근하려면 먼저 로그인해주세요.</p>
          <button 
            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => navigate('/start')}
          >
            로그인하러 가기
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
            onClick={() => {
              // 이메일 로그인 페이지에서 인증번호 입력 단계인 경우 이메일 입력 단계로 이동
              if (location.pathname === '/login/email' && emailLoginStep === 'verification') {
                emailLoginRef.current?.resetForm();
              } else {
                navigate('/start');
              }
            }}
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
          <Route path="/start" element={<LoginSelector onBack={handleBackToSplash} isAuthenticated={isAuthenticated} />} />
          <Route path="/login/email" element={<EmailLogin ref={emailLoginRef} onLoginSuccess={handleLoginSuccess} onStepChange={setEmailLoginStep} />} />
          <Route path="/login/google" element={<GoogleLogin />} />
          <Route path="/login/kakao" element={<KakaoLogin />} />
          <Route path="/login/naver" element={<NaverLogin />} />
          <Route path="/login/complete" element={<LoginComplete />} />
          <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/auth/naver/callback" element={<NaverCallback />} />
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