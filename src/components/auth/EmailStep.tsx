import { INPUT_STYLES, BUTTON_STYLES } from '../../styles';

interface EmailStepProps {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestVerification: () => void;
  isLoading: boolean;
  isLinkMode?: boolean;
}

/**
 * 이메일 입력 단계 컴포넌트
 */
export const EmailStep = ({
  email,
  onEmailChange,
  onRequestVerification,
  isLoading,
  isLinkMode = false
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
              className={`${INPUT_STYLES.default} mb-12`}
            />
            
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

