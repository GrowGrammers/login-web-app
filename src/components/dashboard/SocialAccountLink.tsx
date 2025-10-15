import { getCurrentProviderType } from '../../auth/authManager';
import { CARD_STYLES } from '../../styles';

interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    id: 'email',
    name: '이메일',
    icon: '📧',
    color: 'text-gray-700'
  },
  {
    id: 'naver',
    name: '네이버',
    icon: '/naver_ic.png',
    color: 'text-green-600'
  },
  {
    id: 'kakao',
    name: '카카오',
    icon: '/kakao_ic.png',
    color: 'text-yellow-600'
  },
  {
    id: 'google',
    name: '구글',
    icon: '/google_ic.svg',
    color: 'text-blue-600'
  }
];

interface ToggleSwitchProps {
  isOn: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const ToggleSwitch = ({ isOn, disabled, onClick }: ToggleSwitchProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-200 ease-in-out
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        ${isOn ? 'bg-blue-500' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out
          ${isOn ? 'translate-x-8' : 'translate-x-1'}
        `}
      />
      <span className={`
        absolute text-[10px] font-semibold transition-opacity duration-200
        ${isOn ? 'left-2 text-white opacity-100' : 'right-2 text-gray-600 opacity-100'}
      `}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  );
};

const SocialAccountLink = () => {
  const currentProvider = getCurrentProviderType();

  const handleToggle = (providerId: string) => {
    // TODO: 연동 로직 구현 예정
    console.log(`Toggle ${providerId}`);
  };

  const isProviderLinked = (providerId: string) => {
    // 현재는 로그인한 provider만 연동된 것으로 표시
    return providerId === currentProvider;
  };

  return (
    <div className={CARD_STYLES.withHeader}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        🔗 로그인 방식 연동
      </h3>
      <div className="space-y-3">
        {SOCIAL_PROVIDERS.map((provider) => {
          const isLinked = isProviderLinked(provider.id);
          const isCurrent = provider.id === currentProvider;

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {provider.icon.startsWith('/') ? (
                  <img 
                    src={provider.icon} 
                    alt={provider.name} 
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <span className="text-sm">{provider.icon}</span>
                )}
                <span className={`${provider.color}`}>
                  {provider.name}
                </span>
              </div>
              <ToggleSwitch
                isOn={isLinked}
                disabled={isCurrent}
                onClick={() => !isCurrent && handleToggle(provider.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialAccountLink;

