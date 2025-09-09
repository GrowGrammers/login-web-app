import { useState, useEffect } from 'react';
import { getAuthManager, resetAuthManager } from '../auth/authManager';

// PKCE 헬퍼 함수들
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[byte % 66]
  ).join('');
}

function generateCodeVerifier(): string {
  return generateRandomString(128);
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Base64URL 인코딩
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

interface LoginFormProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  selectedMethod?: 'email' | 'social' | 'phone' | null;
}

const LoginForm = ({ onLoginSuccess, onBack, selectedMethod }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    verifyCode: ''
  });
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [message, setMessage] = useState('');
  
  // selectedMethod에 따라 authProvider 설정
  const authProvider: 'email' | 'google' = selectedMethod === 'social' ? 'google' : 'email';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 인증번호 개별 입력 처리
  const handleDigitChange = (index: number, value: string) => {
    // 숫자만 허용
    if (value && !/^\d$/.test(value)) return;
    
    const newDigits = [...verificationDigits];
    newDigits[index] = value;
    setVerificationDigits(newDigits);
    
    // 자동으로 다음 필드로 이동
    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
    
    // verifyCode 업데이트
    setFormData({
      ...formData,
      verifyCode: newDigits.join('')
    });
  };

  // 백스페이스 처리
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationDigits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  // 붙여넣기 처리
  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, ''); // 숫자만 추출
    
    if (pastedData.length === 6) {
      const newDigits = pastedData.split('').slice(0, 6);
      setVerificationDigits(newDigits);
      setFormData({
        ...formData,
        verifyCode: newDigits.join('')
      });
      
      // 마지막 필드로 포커스 이동
      const lastInput = document.getElementById('digit-5');
      lastInput?.focus();
    }
  };

  // AuthManager 초기화
  useEffect(() => {
    resetAuthManager(authProvider);
    setStep('email');
    setMessage('');
    setFormData({ email: '', verifyCode: '' });
    console.log('🔄 AuthManager 초기화:', authProvider);
  }, [authProvider]);

  const requestEmailVerification = async () => {
    if (!formData.email) {
      setMessage('❌ 이메일을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      const authManager = getAuthManager();
      const result = await authManager.requestEmailVerification({
        email: formData.email
      });

      if (result.success) {
        setStep('verification');
        setMessage('✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요.');
        console.log('✅ 이메일 인증번호 요청 성공');
      } else {
        setMessage(`❌ ${result.message}`);
        console.error('❌ 이메일 인증번호 요청 실패:', result.error);
      }
    } catch (error) {
      setMessage('❌ 네트워크 오류가 발생했습니다.');
      console.error('❌ 이메일 인증번호 요청 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!formData.email || !formData.verifyCode) {
      setMessage('❌ 이메일과 인증번호를 모두 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      const authManager = getAuthManager();
      const result = await authManager.login({
        provider: 'email',
        email: formData.email,
        verifyCode: formData.verifyCode
      });

      if (result.success) {
        setMessage('✅ 로그인 성공!');
        console.log('✅ 로그인 성공:', result.data);
        setTimeout(() => onLoginSuccess(), 1000);
      } else {
        setMessage(`❌ ${result.message}`);
        console.error('❌ 로그인 실패:', result.error);
      }
    } catch (error) {
      setMessage('❌ 로그인 중 오류가 발생했습니다.');
      console.error('❌ 로그인 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth는 현재 창에서 처리되므로 postMessage 핸들러 불필요

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setMessage('🔄 Google OAuth 페이지로 이동합니다...');
      
      // 환경변수에서 Google OAuth 설정 가져오기
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; 
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
      
      // 환경변수 검증
      if (!clientId) {
        throw new Error('Google Client ID가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      }
      
      console.log('🔑 Google Client ID:', clientId);
      console.log('🔄 Redirect URI (프론트엔드용):', redirectUri);
      console.log('🌍 Environment:', import.meta.env.MODE);
      
      // PKCE 파라미터 생성
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      
      console.log('🔐 PKCE Parameters:', {
        codeVerifier: codeVerifier.substring(0, 10) + '...',
        codeChallenge: codeChallenge.substring(0, 10) + '...',
        state: state.substring(0, 10) + '...'
      });
      
      // PKCE 파라미터를 localStorage에 저장
      localStorage.setItem('google_oauth_code_verifier', codeVerifier);
      localStorage.setItem('google_oauth_state', state);
      
      // Google OAuth URL 생성 (PKCE 포함)
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent('email profile openid')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256&` +
        `state=${encodeURIComponent(state)}`;
      
      console.log('🔗 Google OAuth URL (PKCE 포함):', googleAuthUrl);
      
      // 팝업 대신 현재 창에서 OAuth 진행
      console.log('🔄 현재 창에서 Google OAuth로 이동...');
      setMessage('🔄 Google 인증 페이지로 이동합니다...');
      
      // 현재 상태를 localStorage에 저장
      localStorage.setItem('oauth_in_progress', 'true');
      localStorage.setItem('oauth_provider', 'google');
      
      // 현재 창에서 Google OAuth 페이지로 이동
      window.location.href = googleAuthUrl;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setMessage(`❌ ${errorMessage}`);
      console.error('❌ Google 로그인 중 오류:', error);
      setIsLoading(false);
    }
  };


  const resetForm = () => {
    setStep('email');
    setFormData({ email: '', verifyCode: '' });
    setVerificationDigits(['', '', '', '', '', '']);
    setMessage('');
  };

  return (
    <div className="login-form">
      {/* 뒤로 가기 버튼 */}
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
      )}

      {/* 헤더 */}
      <div className="login-header">
        {authProvider === 'email' ? (
          <>
            <h2>이메일로 계속하기</h2>
            <p>이메일을 등록하거나 가입하세요</p>
          </>
        ) : (
          <>
            <h2>Google로 계속하기</h2>
            <p>Google 계정으로 빠르게 로그인하세요</p>
          </>
        )}
      </div>

      <div className="form-content">

        {authProvider === 'email' ? (
          // 이메일 로그인 폼
          <div className="email-login">
            {step === 'email' ? (
              <div className="step">
                <input
                  type="email"
                  name="email"
                  placeholder="이메일 주소"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                
                {/* 메시지 표시 */}
                {message && (
                  <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <button
                  onClick={requestEmailVerification}
                  disabled={isLoading || !formData.email}
                  className="primary-btn"
                >
                  {isLoading ? '인증번호 발송 중...' : '인증번호 받기'}
                </button>
              </div>
            ) : (
              <div className="step verification-step">
                <div className="verification-header">
                  <h3>인증번호 입력</h3>
                  <p>({formData.email})로 인증번호를 보냈습니다</p>
                  <button onClick={resetForm} className="edit-email-btn">수정</button>
                </div>
                
                <div className="verification-input-container">
                  {verificationDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`digit-${index}`}
                      type="text"
                      className="verification-digit"
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                      onPaste={index === 0 ? handleDigitPaste : undefined}
                      disabled={isLoading}
                      maxLength={1}
                      inputMode="numeric"
                    />
                  ))}
                </div>
                
                <div className="verification-timer">
                  5:00
                </div>

                {/* 메시지 표시 */}
                {message && (
                  <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <div className="verification-options">
                  <p className="resend-text">이메일이 안 오나요?</p>
                  
                  <div className="resend-button-container">
                    <button className="resend-btn">
                      From Messages
                      <br />
                      <strong>123 456</strong>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleEmailLogin}
                  disabled={isLoading || formData.verifyCode.length !== 6}
                  className="primary-btn verification-submit"
                >
                  {isLoading ? '로그인 중...' : '계속하기'}
                </button>
              </div>
            )}
          </div>
        ) : (
          // Google 로그인
          <div className="google-login">
            {/* 메시지 표시 */}
            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="google-btn"
            >
              {isLoading ? 'Google 인증 중...' : 'Google로 계속하기'}
            </button>
          </div>
        )}

        {/* 개발 정보 (더 간소화) */}
        <div className="dev-info">
          <h4>🛠️ 개발 정보</h4>
          <p><strong>Provider:</strong> {authProvider}</p>
          <p><strong>Step:</strong> {step}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
