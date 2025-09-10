import { useState, useEffect } from 'react';
import { getAuthManager, resetAuthManager } from '../auth/authManager';

interface EmailLoginProps {
  onLoginSuccess: () => void;
}

const EmailLogin = ({ onLoginSuccess }: EmailLoginProps) => {
  const [formData, setFormData] = useState({
    email: '',
    verifyCode: ''
  });
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [message, setMessage] = useState('');

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
    resetAuthManager('email');
    setStep('email');
    setMessage('');
    setFormData({ email: '', verifyCode: '' });
    console.log('🔄 AuthManager 초기화: email');
  }, []);

  const requestEmailVerification = async () => {
    if (!formData.email) {
      setMessage('❌ 이메일을 입력해주세요.');
      return;
    }

    // 버튼을 누르자마자 바로 인증번호 입력 화면으로 이동
    setStep('verification');
    setMessage('✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요.');
    setIsLoading(true);

    try {
      const authManager = getAuthManager();
      const result = await authManager.requestEmailVerification({
        email: formData.email
      });

      if (result.success) {
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

  const resetForm = () => {
    setStep('email');
    setFormData({ email: '', verifyCode: '' });
    setVerificationDigits(['', '', '', '', '', '']);
    setMessage('');
  };


  return (
    <div className="min-h-screen flex flex-col bg-white w-full border-l border-r border-gray-200 shadow-xl">

      {/* 헤더 - 인증번호 입력 단계에서는 숨김 */}
      {step === 'email' && (
        <div className="px-4 py-16 pb-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일로 계속하기</h2>
          <p className="text-sm text-gray-600">이메일을 등록하거나 가입하세요</p>
        </div>
      )}

      <div className="flex-1 px-8 pb-8 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-8">
          {step === 'email' ? (
            <div className="flex flex-col w-full">
              <input
                type="email"
                name="email"
                placeholder="이메일 주소"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full p-4 border border-gray-200 rounded-xl text-base mb-6 bg-gray-50 focus:outline-none focus:border-gray-900 focus:bg-white transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              
              {/* 메시지 표시 */}
              {message && (
                <div className={`p-4 rounded-xl mb-4 font-medium text-sm ${
                  message.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <button
                onClick={requestEmailVerification}
                disabled={isLoading || !formData.email}
                className="w-full p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? '인증번호 발송 중...' : '인증번호 받기'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 flex flex-col w-full">
              <div className="flex flex-col gap-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">인증번호 입력</h3>
                  <p className="text-sm text-gray-600 mb-0">({formData.email})로 인증번호를 보냈습니다</p>
                  <button 
                    onClick={resetForm} 
                    className="bg-transparent border-0 text-gray-600 text-sm cursor-pointer underline hover:text-gray-900 mt-2"
                  >
                    수정
                  </button>
                </div>
                
                <div className="flex justify-center gap-2 mb-0">
                  {verificationDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`digit-${index}`}
                      type="text"
                      className="w-12 h-16 border-2 border-gray-200 rounded-xl text-center text-2xl font-semibold bg-gray-50 transition-all duration-200 focus:outline-none focus:border-gray-900 focus:bg-white focus:shadow-lg disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
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
                
                <div className="text-base text-gray-600 mb-0 text-right pr-4">
                  5:00
                </div>

                {/* 메시지 표시 */}
                {message && (
                  <div className={`p-4 rounded-xl mb-4 font-medium text-sm ${
                    message.includes('✅') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="m-0">
                  <p className="text-sm text-gray-600 mb-0 underline">이메일이 안 오나요?</p>
                </div>

                <button
                  onClick={handleEmailLogin}
                  disabled={isLoading || formData.verifyCode.length !== 6}
                  className="w-full p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? '로그인 중...' : '계속하기'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 개발 정보 */}
        <div className="mt-auto p-4 bg-gray-100 rounded-lg border-l-4 border-gray-500">
          <h4 className="mb-2 text-gray-900 text-sm">🛠️ 개발 정보</h4>
          <p className="my-1 text-xs text-gray-600"><strong>Provider:</strong> email</p>
          <p className="my-1 text-xs text-gray-600"><strong>Step:</strong> {step}</p>
        </div>
      </div>
    </div>
  );
};

export default EmailLogin;
