import { INPUT_STYLES, BUTTON_STYLES } from '../../styles';

interface EmailStepProps {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestVerification: () => void;
  isLoading: boolean;
  isLinkMode?: boolean;
  message?: string;
}

/**
 * 이메일 입력 단계 컴포넌트
 */
export const EmailStep = ({
  email,
  onEmailChange,
  onRequestVerification,
  isLoading,
  isLinkMode = false,
  message
}: EmailStepProps) => {
  return (
    <>
      {/* 헤더 */}
      <div className="px-8 py-16 pb-4 text-left">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isLinkMode ? '이메일 연동하기' : '이메일로 계속하기'}
        </h2>
        <p className="text-sm text-gray-600">
          {isLinkMode ? '이메일로 로그인 방식을 연동하세요' : '이메일로 로그인하거나 가입하세요'}
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="flex-1 px-8 pb-4 my-12 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col w-full">
            <input
              type="email"
              name="email"
              placeholder="이메일 주소"
              value={email}
              onChange={onEmailChange}
              disabled={isLoading}
              className={`${INPUT_STYLES.default} mb-4`}
            />
            
            {/* 입력창과 버튼 사이 고정 공간에 메시지 표시 */}
            <div className="relative mb-6 min-h-[1.5rem]">
              {message && (
                <div className={`absolute top-0 right-0 text-right text-xs whitespace-normal ${
                  message.includes('✅') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {message}
                </div>
              )}
            </div>
            
            <button
              onClick={onRequestVerification}
              disabled={isLoading || !email}
              className={BUTTON_STYLES.large}
            >
              {isLoading ? '인증번호 발송 중...' : '인증번호 받기'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

