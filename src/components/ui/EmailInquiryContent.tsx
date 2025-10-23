import { BUTTON_STYLES } from '../../styles';

interface EmailInquiryContentProps {
  onResend: () => void;
  isLoading: boolean;
}

/**
 * 이메일 인증번호 문의 Bottom Sheet 내용 컴포넌트
 */
export const EmailInquiryContent = ({
  onResend,
  isLoading
}: EmailInquiryContentProps) => {
  return (
    <>
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
        onClick={onResend}
        disabled={isLoading}
        className={BUTTON_STYLES.large}
      >
        {isLoading ? '인증번호 발송 중...' : '인증번호 다시 받기'}
      </button>
    </>
  );
};

