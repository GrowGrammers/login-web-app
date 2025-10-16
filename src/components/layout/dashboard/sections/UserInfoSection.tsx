import { BUTTON_STYLES, CARD_STYLES } from '../../../../styles';

interface UserInfo {
  id?: string;
  email: string;
  nickname?: string;
  provider: string;
}

interface UserInfoSectionProps {
  userInfo: UserInfo | null;
  loadUserData: () => Promise<void>;
}

const UserInfoSection = ({ userInfo, loadUserData }: UserInfoSectionProps) => {
  return (
    <div className={CARD_STYLES.withHeader}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">👤 사용자 정보</h3>
      {userInfo ? (
        <div>
          {userInfo.id === 'demo-user' && (
            <div className="bg-yellow-50 text-yellow-800 p-2 rounded-md mb-4 text-xs text-center">
              <small>🔧 백엔드 미완성으로 더미 데이터를 표시합니다</small>
            </div>
          )}
          <p className="my-3 text-sm flex justify-between items-center">
            <strong className="text-gray-900 font-semibold min-w-[80px]">이메일:</strong> 
            {userInfo.email}
          </p>
          <p className="my-3 text-sm flex justify-between items-center">
            <strong className="text-gray-900 font-semibold min-w-[80px]">닉네임:</strong> 
            {userInfo.nickname || '설정되지 않음'}
          </p>
        </div>
      ) : (
        <div className="text-center text-gray-600 p-8">
          <p>⚠️ 사용자 정보를 불러올 수 없습니다.</p>
          <button 
            onClick={loadUserData} 
            className={`${BUTTON_STYLES.small} mt-4`}
          >
            🔄 다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

export default UserInfoSection;

