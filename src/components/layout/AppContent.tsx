import { useState, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PageContainer } from '../ui';
import { useAuthStatus, useAuthHandlers, useOAuthHandlers, useNavigationHandlers } from '../../hooks';
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
} from '../auth';
import Dashboard from './dashboard/Dashboard';
import { ServiceMain } from '../service';
import SplashScreen from './SplashScreen';
import LoadingScreen from './LoadingScreen';
import ProtectedRoute from './ProtectedRoute';
import AuthHeader from './AuthHeader';
import type { EmailLoginRef } from '../auth/EmailLogin';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const [showSplash, setShowSplash] = useState(true);
  const [emailLoginStep, setEmailLoginStep] = useState<'email' | 'verification'>('email');
  const emailLoginRef = useRef<EmailLoginRef>(null);

  // 커스텀 훅들
  const { handleLoginSuccess, handleLogout } = useAuthHandlers();
  useOAuthHandlers(setShowSplash);
  const { handleStartApp, handleBackToSplash } = useNavigationHandlers(setShowSplash);

  // 로딩 화면
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 스플래시 화면 표시 조건
  if (showSplash || location.pathname === '/') {
    return <SplashScreen onStartApp={handleStartApp} />;
  }


  return (
    <PageContainer>
      {/* 인증 상태 헤더 */}
      <AuthHeader 
        isAuthenticated={isAuthenticated}
        emailLoginStep={emailLoginStep}
        emailLoginRef={emailLoginRef}
      />

      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<SplashScreen onStartApp={handleStartApp} />} />
          <Route path="/start" element={<LoginSelector onBack={handleBackToSplash} isAuthenticated={isAuthenticated} />} />
          <Route path="/login/email" element={<EmailLogin ref={emailLoginRef} onLoginSuccess={handleLoginSuccess} onStepChange={setEmailLoginStep} />} />
          <Route path="/login/google" element={<GoogleLogin />} />
          <Route path="/login/kakao" element={<KakaoLogin />} />
          <Route path="/login/naver" element={<NaverLogin />} />
          <Route 
            path="/login/complete" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <LoginComplete />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard onLogout={() => handleLogout(setShowSplash)} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/service" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ServiceMain />
              </ProtectedRoute>
            } 
          />
          <Route path="/link/email" element={<EmailLogin ref={emailLoginRef} onLoginSuccess={handleLoginSuccess} onStepChange={setEmailLoginStep} isLinkMode={true} />} />
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
};

export default AppContent;
