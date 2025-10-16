import { BUTTON_STYLES, CARD_STYLES } from '../../../../styles';

interface TokenManagementSectionProps {
  handleRefreshToken: () => Promise<void>;
  handleTokenValidation: () => Promise<void>;
  isRefreshing: boolean;
}

const TokenManagementSection = ({ 
  handleRefreshToken, 
  handleTokenValidation, 
  isRefreshing 
}: TokenManagementSectionProps) => {
  return (
    <div className={CARD_STYLES.withHeader}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">🔧 수동 토큰 관리</h3>
      <div className="flex flex-col gap-3">
        <button 
          onClick={handleRefreshToken} 
          disabled={isRefreshing}
          className={`w-full p-3 ${BUTTON_STYLES.primary}`}
        >
          {isRefreshing ? '⏳ 갱신 중...' : '🔄 즉시 토큰 갱신'}
        </button>
        <button 
          onClick={handleTokenValidation}
          className={`w-full p-3 ${BUTTON_STYLES.primary}`}
        >
          ✅ 토큰 검증
        </button>
      </div>
    </div>
  );
};

export default TokenManagementSection;

