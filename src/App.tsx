import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getAuthManager, getCurrentProviderType } from './auth/authManager';
import { handleOAuthLogout, handleEmailLogout, isOAuthProvider } from './utils/logoutUtils';
import { processOAuthProvider, isOAuthCallbackPath, cleanupOAuthProgress } from './utils/oauthCallbackUtils';
import { initializeTokenRefreshService } from './auth/TokenRefreshService';
import { AuthStatusBadge, BackButton, PageContainer } from './components/ui';
import { useAuthStatus } from './hooks';

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
import { 
  LoginSelector,
  EmailLogin,
  GoogleLogin,
  KakaoLogin,
  NaverLogin,
  LoginComplete,
  GoogleCallback,
  KakaoCallback,
  NaverCallback
} from './components/auth';
import Dashboard from './components/dashboard/Dashboard';
import { ServiceMain } from './components/service';
import type { EmailLoginRef } from './components/auth/EmailLogin';
import './App.css';

// 전역 OAuth 처리 상태 (React Strict Mode 대응)
const globalOAuthProcessing = { value: false };

// Main App 컴포넌트 (Router 내부)
function AppContent() {
  const { isAuthenticated, isLoading, refreshAuthStatus } = useAuthStatus();
  const [showSplash, setShowSplash] = useState(true);
  const [emailLoginStep, setEmailLoginStep] = useState<'email' | 'verification'>('email');
  const emailLoginRef = useRef<EmailLoginRef>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // OAuth 콜백 처리
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
        try {
          await processOAuthProvider(
            provider,
            authCode,
            setShowSplash,
            refreshAuthStatus,
            initializeTokenRefreshService,
            navigate,
            globalOAuthProcessing
          );
        } catch (error) {
          console.error(`${provider} OAuth 처리 중 예상치 못한 오류:`, error);
          
          // 사용자에게 오류 알림 표시
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          alert(`❌ ${provider} 로그인 처리 중 오류 발생\n\n${errorMessage}\n\n다시 시도해주세요.`);
          
          // 로그인 페이지로 리다이렉트
          navigate('/start');
        }
        break; // 한 번에 하나의 제공자만 처리
      }
    }
  };

  // 인증 상태가 변경될 때 처리
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // 인증된 상태이면 토큰 갱신 서비스 시작
        initializeTokenRefreshService();
        setShowSplash(false);
        
        // 연동 모드인지 확인
        const isLinkingMode = localStorage.getItem('is_linking_mode');
        
        console.log(`🔄 App.tsx useEffect - 현재 경로: ${location.pathname}, 연동 모드: ${isLinkingMode}`);
        
        // 이미 로그인 완료 페이지나 대시보드, 서비스 메인, 연동 페이지, OAuth 콜백 페이지에 있으면 리다이렉트하지 않음
        if (location.pathname !== '/login/complete' && 
            location.pathname !== '/dashboard' && 
            location.pathname !== '/service' &&
            !location.pathname.startsWith('/link/') &&
            !location.pathname.startsWith('/auth/')) {
          // 연동 모드면 대시보드로, 아니면 로그인 완료 페이지로
          if (isLinkingMode === 'true') {
            console.log('📍 App.tsx → /dashboard로 리다이렉트');
            navigate('/dashboard');
          } else {
            console.log('📍 App.tsx → /login/complete로 리다이렉트');
            navigate('/login/complete');
          }
        } else {
          console.log('✋ App.tsx → 리다이렉트 안 함 (예외 경로)');
        }
      } else {
        // 인증되지 않은 상태이면 스플래시 화면을 숨김 (로그인 페이지 접근 허용)
        setShowSplash(false);
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const handleStartApp = () => {
    setShowSplash(false);
    navigate('/start');
  };

  const handleBackToSplash = () => {
    setShowSplash(true);
    navigate('/');
  };

  const handleLoginSuccess = async () => {
    // 로그인 성공 시 토큰 갱신 서비스 시작
    initializeTokenRefreshService();
    
    // 사용자 정보 가져오기 시도 (이메일 로그인의 경우)
    const currentProvider = getCurrentProviderType();
    if (currentProvider === 'email') {
      await fetchUserInfoAfterEmailLogin();
    }
    
    // Zustand 스토어 상태 업데이트 (전역 상태 즉시 반영)
    await refreshAuthStatus();
    
    navigate('/login/complete');
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
        // Zustand 스토어 상태 업데이트 (전역 상태 즉시 반영)
        await refreshAuthStatus();
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
    <PageContainer>
      {/* 인증 상태 헤더 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-center relative">
        {/* 뒤로가기 버튼 - 시작하기 페이지가 아닐 때만 표시 */}
        {location.pathname !== '/start' && (
          <BackButton 
            className="absolute left-4"
            onClick={() => {
              // 이메일 로그인 페이지에서 인증번호 입력 단계인 경우 이메일 입력 단계로 이동
              if (location.pathname === '/login/email' && emailLoginStep === 'verification') {
                emailLoginRef.current?.resetForm();
              } else {
                navigate('/start');
              }
            }}
          />
        )}
        
        {/* 인증 상태 - 항상 중앙 정렬 */}
        <AuthStatusBadge isAuthenticated={isAuthenticated} />
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
          <Route path="/service" element={<ServiceMain />} />
          <Route path="/link/google" element={<GoogleLogin />} />
          <Route path="/link/kakao" element={<KakaoLogin />} />
          <Route path="/link/naver" element={<NaverLogin />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/auth/naver/callback" element={<NaverCallback />} />
        </Routes>
      </main>
    </PageContainer>
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