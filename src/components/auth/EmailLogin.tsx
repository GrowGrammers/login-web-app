import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { resetAuthManager } from '../../auth/authManager';
import { BottomSheet } from '../layout';
import { EmailInquiryContent } from '../ui';
import { EmailStep } from './EmailStep';
import { VerificationStep } from './VerificationStep';
import { useTimer, useVerificationDigits, useEmailVerification } from '../../hooks';

interface EmailLoginProps {
  onLoginSuccess: () => void;
  onStepChange?: (step: 'email' | 'verification') => void;
  isLinkMode?: boolean;
}

export interface EmailLoginRef {
  resetForm: () => void;
}

const VERIFICATION_TIME_SECONDS = 300; // 5분

const EmailLogin = forwardRef<EmailLoginRef, EmailLoginProps>(
  ({ onLoginSuccess, onStepChange, isLinkMode = false }, ref) => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'email' | 'verification'>('email');
    const [isVerificationRequested, setIsVerificationRequested] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

    // 커스텀 훅들 사용
    const {
      timeLeft,
      isTimerExpired,
      startTimer,
      stopTimer,
      formatTime
    } = useTimer(VERIFICATION_TIME_SECONDS);

    const {
      digits,
      fullCode,
      handleDigitChange,
      handleDigitKeyDown,
      handleDigitPaste,
      resetDigits
    } = useVerificationDigits(6);

    const {
      message,
      isLoading,
      requestEmailVerification,
      verifyEmailLogin
    } = useEmailVerification({
      isLinkMode,
      onSuccess: onLoginSuccess,
      onTimerStart: () => {
        setIsVerificationRequested(true);
        startTimer(VERIFICATION_TIME_SECONDS);
      }
    });

    // AuthManager 초기화
    useEffect(() => {
      if (!isLinkMode) {
        resetAuthManager('email');
      }
      setStep('email');
      setEmail('');
      stopTimer();
    }, [isLinkMode, stopTimer]);

    // step 변경 시 부모 컴포넌트에 알림
    useEffect(() => {
      onStepChange?.(step);
    }, [step, onStepChange]);

    // 이메일 입력 핸들러
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    };

    // 인증번호 요청 핸들러
    const handleRequestVerification = async () => {
      // 버튼을 누르자마자 바로 인증번호 입력 화면으로 이동
      setStep('verification');
      setIsVerificationRequested(false);
      resetDigits();

      const success = await requestEmailVerification(email);
      
      // 실패하면 다시 이메일 입력 단계로 돌아감
      if (!success) {
        setStep('email');
      }
    };

    // 인증번호 검증 핸들러
    const handleVerify = async () => {
      if (fullCode.length !== 6 || isTimerExpired || isLoading) {
        return;
      }

      const success = await verifyEmailLogin(email, fullCode);
      
      // 만료된 경우 필드 초기화
      if (!success && message.includes('만료')) {
        resetDigits();
        stopTimer();
      }
    };

    // Bottom Sheet 핸들러들
    const handleEmailInquiry = () => {
      setIsBottomSheetOpen(true);
    };

    const handleCloseBottomSheet = () => {
      setIsBottomSheetOpen(false);
    };

    const handleResendVerification = async () => {
      setIsBottomSheetOpen(false);
      resetDigits();
      await requestEmailVerification(email);
    };

    // 폼 리셋
    const resetForm = () => {
      setStep('email');
      setEmail('');
      resetDigits();
      stopTimer();
      setIsVerificationRequested(false);
    };

    // 외부에서 resetForm 함수를 호출할 수 있도록 함
    useImperativeHandle(ref, () => ({
      resetForm
    }));

    return (
      <div className="h-full flex flex-col bg-white w-full border-l border-r border-gray-200">
        {step === 'email' ? (
          <EmailStep
            email={email}
            onEmailChange={handleEmailChange}
            onRequestVerification={handleRequestVerification}
            isLoading={isLoading}
            isLinkMode={isLinkMode}
          />
        ) : (
          <VerificationStep
            email={email}
            digits={digits}
            onDigitChange={handleDigitChange}
            onDigitKeyDown={handleDigitKeyDown}
            onDigitPaste={handleDigitPaste}
            onVerify={handleVerify}
            onInquiryClick={handleEmailInquiry}
            message={message}
            timeLeft={timeLeft}
            isTimerExpired={isTimerExpired}
            isVerificationRequested={isVerificationRequested}
            isLoading={isLoading}
            formatTime={formatTime}
          />
        )}

        {/* Bottom Sheet */}
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={handleCloseBottomSheet}
          title="확인해보세요."
        >
          <EmailInquiryContent
            onResend={handleResendVerification}
            isLoading={isLoading}
          />
        </BottomSheet>
      </div>
    );
  }
);

EmailLogin.displayName = 'EmailLogin';

export default EmailLogin;
