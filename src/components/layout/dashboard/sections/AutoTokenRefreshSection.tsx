import { CARD_STYLES } from '../../../../styles';

const AutoTokenRefreshSection = () => {
  return (
    <div className={CARD_STYLES.withHeader}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">🤖 자동 토큰 갱신</h3>
      <div className="text-sm text-gray-600 space-y-3">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <strong className="text-green-800">활성화됨</strong>
          </div>
          <ul className="text-xs text-green-700 space-y-1 ml-4">
            <li>• 토큰 만료 5분 전에 자동 갱신</li>
            <li>• 30초 마다 토큰 상태 확인</li>
            <li>• API 요청 전 자동 토큰 검증</li>
            <li>• 갱신 실패 시 자동 로그아웃</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AutoTokenRefreshSection;

