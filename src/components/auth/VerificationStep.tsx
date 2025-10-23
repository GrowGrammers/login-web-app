import { VerificationCodeInput } from '../ui';

interface VerificationStepProps {
  email: string;
  digits: string[];
  onDigitChange: (index: number, value: string) => void;
  onDigitKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDigitPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onVerify: () => void;
  onInquiryClick: () => void;
  message: string;
  timeLeft: number;
  isTimerExpired: boolean;
  isVerificationRequested: boolean;
  isLoading: boolean;
  formatTime: (seconds: number) => string;
}

/**
 * 인증번호 입력 단계 컴포넌트
 */
export const VerificationStep = ({
  email,
  digits,
  onDigitChange,
  onDigitKeyDown,
  onDigitPaste,
  onVerify,
  onInquiryClick,
  message,
  timeLeft,
  isTimerExpired,
  isVerificationRequested,
  isLoading,
  formatTime
}: VerificationStepProps) => {
  return (
    <>
      {/* 헤더 */}
      <div className="px-8 py-16 pb-4 text-left">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">인증번호 입력</h2>
        <p className="text-sm text-gray-600">({email})로 인증번호를 보냈습니다</p>
      </div>

      {/* 인증번호 입력 영역 */}
      <div className="flex-1 px-8 pb-4 my-12 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-6">
          <div className="text-center flex flex-col w-full">
            <div className="flex flex-col gap-6">
              {/* 6자리 인증번호 입력 */}
              <VerificationCodeInput
                digits={digits}
                onDigitChange={onDigitChange}
                onDigitKeyDown={onDigitKeyDown}
                onDigitPaste={onDigitPaste}
                onEnterPress={onVerify}
                disabled={isLoading || isTimerExpired}
              />

              {/* 메시지 표시 - 타이머 만료 시에는 표시하지 않음 */}
              {message && !isTimerExpired && (
                <div className={`text-right text-xs ${
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

              {/* 타이머 만료 안내 - 타이머가 만료된 경우 항상 표시 */}
              {isTimerExpired && (
                <div className="text-right text-xs text-red-600">
                  <div>5분이 지나 인증번호가 만료되었어요.</div>
                  <div>아래 '인증번호가 안 오나요?'에서 다시 인증번호를 요청해주세요.</div>
                </div>
              )}

              {/* 문의 링크 */}
              <div className="mt-6">
                <p 
                  className="text-sm text-gray-600 mb-0 underline cursor-pointer hover:text-gray-900 transition-colors duration-200"
                  onClick={onInquiryClick}
                >
                  인증번호가 안 오나요?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

