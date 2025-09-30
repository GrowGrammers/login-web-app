import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { getAuthManager, resetAuthManager } from '../auth/authManager';
import BottomSheet from './BottomSheet';
import { validateEmailWithAlert } from '../utils/emailValidationUtils';

interface EmailLoginProps {
  onLoginSuccess: () => void;
  onStepChange?: (step: 'email' | 'verification') => void;
}

export interface EmailLoginRef {
  resetForm: () => void;
}

const EmailLogin = forwardRef<EmailLoginRef, EmailLoginProps>(({ onLoginSuccess, onStepChange }, ref) => {
  const [formData, setFormData] = useState({
    email: '',
    verifyCode: ''
  });
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [isVerificationRequested, setIsVerificationRequested] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

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

  // 타이머 시작
  const startTimer = () => {
    setTimeLeft(10); // 5분으로 리셋
    setIsTimerExpired(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerExpired(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 타이머 정리
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 시간 포맷팅 (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 이메일 문의 bottom sheet 열기
  const handleEmailInquiry = () => {
    setIsBottomSheetOpen(true);
  };

  // bottom sheet 닫기
  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false);
  };

  // 인증번호 다시 받기
  const handleResendVerification = async () => {
    setIsBottomSheetOpen(false);
    await requestEmailVerification();
  };

  // AuthManager 초기화
  useEffect(() => {
    resetAuthManager('email');
    setStep('email');
    setMessage('');
    setFormData({ email: '', verifyCode: '' });
    setTimeLeft(300);
    setIsTimerExpired(false);
    clearTimer();
  }, []);

  // step 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const requestEmailVerification = async () => {
    // 이메일 유효성 검사
    if (!validateEmailWithAlert(formData.email)) {
      return;
    }

    // 버튼을 누르자마자 바로 인증번호 입력 화면으로 이동
    setStep('verification');
    setMessage('이메일을 보내고 있습니다...');
    setIsLoading(true);
    setIsVerificationRequested(false); // 초기화
    
    // 인증번호 입력 필드 초기화
    setVerificationDigits(['', '', '', '', '', '']);
    setFormData(prev => ({ ...prev, verifyCode: '' }));

    try {
      const authManager = getAuthManager();
      const result = await authManager.requestEmailVerification({
        email: formData.email
      });

      if (result.success) {
        setMessage('✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요.');
        setIsVerificationRequested(true);
        startTimer(); // 성공했을 때만 타이머 시작
        //console.log('✅ 이메일 인증번호 요청 성공');
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
        
        // 로그인 성공 후 토큰이 저장될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 토큰이 제대로 저장되었는지 확인
        const { WebTokenStore } = await import('../auth/WebTokenStore');
        const tokenStore = new WebTokenStore();
        // RealHttpClient에서 이미 토큰을 저장했으므로 추가 처리 불필요
        // 토큰이 제대로 저장되었는지 확인만 함
        const tokenResult = await tokenStore.getToken();
        if (!tokenResult.success || !tokenResult.data?.accessToken) {
          console.warn('⚠️ 토큰이 저장되지 않았습니다. RealHttpClient에서 처리되었는지 확인하세요.');
        }
        
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

  const resetForm = () => {
    setStep('email');
    setFormData({ email: '', verifyCode: '' });
    setVerificationDigits(['', '', '', '', '', '']);
    setMessage('');
    clearTimer();
    setTimeLeft(300);
    setIsTimerExpired(false);
    setIsVerificationRequested(false);
  };

  // 외부에서 resetForm 함수를 호출할 수 있도록 함
  useImperativeHandle(ref, () => ({
    resetForm
  }));


  return (
    <div className="h-full flex flex-col bg-white w-full border-l border-r border-gray-200">

      {/* 헤더 - 모든 단계에서 표시 */}
      <div className="px-8 py-16 pb-4 text-left">
        {step === 'email' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일로 계속하기</h2>
            <p className="text-sm text-gray-600">이메일로 로그인하거나 가입하세요</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">인증번호 입력</h2>
            <p className="text-sm text-gray-600">({formData.email})로 인증번호를 보냈습니다</p>
          </>
        )}
      </div>

      <div className="flex-1 px-8 pb-4 my-12 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-6">
          {step === 'email' ? (
            <div className="flex flex-col w-full">
              <input
                type="email"
                name="email"
                placeholder="이메일 주소"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full p-4 border border-gray-200 rounded-xl text-base mb-12 bg-gray-50 focus:outline-none focus:border-gray-900 focus:bg-white transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              

              <button
                onClick={requestEmailVerification}
                disabled={isLoading || !formData.email}
                className="w-full p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? '인증번호 발송 중...' : '인증번호 받기'}
              </button>
            </div>
          ) : (
            <div className="text-center flex flex-col w-full">
              <div className="flex flex-col gap-6">
                
                <div className="flex justify-between gap-4 mb-4">
                  {verificationDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`digit-${index}`}
                      type="text"
                      className="w-16 h-20 border-2 border-gray-200 rounded-xl text-center text-2xl font-semibold bg-gray-50 transition-all duration-200 focus:outline-none focus:border-gray-900 focus:bg-white focus:shadow-lg disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
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
                

                  {/* 메시지 표시 - 타이머 만료 시 성공 메시지 숨김 */}
                {message && !isTimerExpired && (
                  <div className={`text-right text-sm ${
                    message.includes('✅') 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {message}
                  </div>
                )}
                
                {/* 타이머 - 인증번호 요청 성공 후에만 표시 */}
                {isVerificationRequested && !isTimerExpired && (
                  <div className="text-base text-gray-600 mb-0 text-right pr-4">
                    {formatTime(timeLeft)}
                  </div>
                )}

                {/* 타이머 만료 안내 */}
                {isTimerExpired && (
                  <div className="text-right text-sm text-red-600">
                    <div>5분이 지나 인증번호가 만료되었어요.</div>
                    <div>아래 '인증번호가 안 오나요?'에서 다시 인증번호를 요청해주세요.</div>
                  </div>
                )}


                <div className="m-0">
                  <p 
                    className="text-sm text-gray-600 mb-0 underline cursor-pointer hover:text-gray-900 transition-colors duration-200"
                    onClick={handleEmailInquiry}
                  >
                    인증번호가 안 오나요?
                  </p>
                </div>

                {isTimerExpired ? (
                  <button
                    onClick={requestEmailVerification}
                    disabled={isLoading}
                    className="w-full p-4 bg-orange-500 text-white rounded-xl text-base font-semibold hover:bg-orange-600 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    인증번호 다시 받기
                  </button>
                ) : (
                  <button
                    onClick={handleEmailLogin}
                    disabled={isLoading || formData.verifyCode.length !== 6}
                    className="w-full p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    계속하기
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleCloseBottomSheet}
        title="확인해보세요."
      >
        {/* Troubleshooting Steps */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">1</span>
            <p className="text-sm text-gray-700">스팸함(정크 메일함)을 확인해주세요.</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">2</span>
            <p className="text-sm text-gray-700">이메일 수신까지 최대 5분 정도 소요될 수 있습니다.</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">3</span>
            <p className="text-sm text-gray-700">이메일 주소를 다시 한 번 확인해주세요.</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">4</span>
            <p className="text-sm text-gray-700">여전히 수신되지 않는다면, [인증번호 다시 받기] 버튼을 눌러주세요.</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">5</span>
            <p className="text-sm text-gray-700">계속해서 수신되지 않는 경우, 고객센터에 문의해주세요.</p>
          </div>
        </div>

        {/* Resend Button */}
        <button
          onClick={handleResendVerification}
          disabled={isLoading}
          className="w-full p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '인증번호 발송 중...' : '인증번호 다시 받기'}
        </button>
      </BottomSheet>
    </div>
  );
});

EmailLogin.displayName = 'EmailLogin';

export default EmailLogin;
