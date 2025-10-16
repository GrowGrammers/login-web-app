import { CARD_STYLES } from '../../../../styles';

interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  refreshTokenFromCookie?: string;
  expiredAt?: number;
}

interface TokenInfoSectionProps {
  tokenInfo: TokenInfo | null;
  tokenExpiredAt: number | null;
  timeUntilExpiry: number | null;
}

const TokenInfoSection = ({ tokenInfo, tokenExpiredAt, timeUntilExpiry }: TokenInfoSectionProps) => {
  return (
    <div className={CARD_STYLES.withHeader}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">🔑 토큰 정보</h3>
      {tokenInfo ? (
        <div>
          <p className="my-3 text-sm flex justify-between items-center">
            <strong className="text-gray-900 font-semibold min-w-[80px]">Access Token:</strong> 
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono max-w-[200px] overflow-hidden text-ellipsis">
              {tokenInfo.accessToken !== '토큰 없음' ? tokenInfo.accessToken.substring(0, 20) + '...' : '토큰 없음'}
            </code>
          </p>
          <p className="my-3 text-sm flex justify-between items-center">
            <strong className="text-gray-900 font-semibold min-w-[80px]">Refresh Token (쿠키):</strong> 
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
              🍪 HttpOnly 쿠키 (JS 접근 불가, 네트워크 탭에서 확인됨)
            </span>
          </p>
          {tokenExpiredAt && (
            <p className="my-3 text-sm flex justify-between items-center">
              <strong className="text-gray-900 font-semibold min-w-[80px]">만료 시간:</strong> 
              {new Date(tokenExpiredAt).toLocaleString()}
            </p>
          )}
          {timeUntilExpiry !== null && (
            <p className="my-3 text-sm flex justify-between items-center">
              <strong className="text-gray-900 font-semibold min-w-[80px]">남은 시간:</strong> 
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                timeUntilExpiry <= 5 
                  ? 'bg-red-100 text-red-800' 
                  : timeUntilExpiry <= 10
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {timeUntilExpiry <= 0 ? '만료됨' : `${timeUntilExpiry}분 남음`}
              </span>
            </p>
          )}
          <div className="text-xs text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg">
            <small>💡 refreshToken은 보안상 HttpOnly 쿠키로 설정되어 JavaScript에서 접근할 수 없습니다. 이는 정상적인 보안 정책입니다.</small>
          </div>
        </div>
      ) : (
        <p>⚠️ 토큰 정보를 불러올 수 없습니다.</p>
      )}
    </div>
  );
};

export default TokenInfoSection;

