import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthManager, getCurrentProviderType } from '../../../../auth/authManager';
import { useAuthStore } from '../../../../stores/authStore';
import { CARD_STYLES } from '../../../../styles';

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
  const location = useLocation();
  const navigate = useNavigate();
  const currentProvider = getCurrentProviderType();
  const userInfo = useAuthStore((state) => state.userInfo);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const hasShownAlert = useRef(false); // 중복 alert 방지 (React Strict Mode 대응)

  // 백엔드에서 받은 회원정보로 연동된 provider 목록 업데이트
  useEffect(() => {
    if (userInfo && userInfo.linkedProviders) {
      // 백엔드에서 linkedProviders 배열을 제공하면 그대로 사용
      setLinkedProviders(userInfo.linkedProviders);
    } else {
      // linkedProviders가 없으면 현재 로그인한 provider만 연동된 것으로 처리
      setLinkedProviders([currentProvider]);
    }
  }, [userInfo, currentProvider]);

  // 연동 완료 확인 및 회원정보 갱신
  useEffect(() => {
    // URL에서 연동 완료 확인 (OAuth 콜백에서 대시보드로 왔을 때)
    const params = new URLSearchParams(location.search);
    const justLinked = params.get('linked');
    
    if (justLinked && !hasShownAlert.current) {
      hasShownAlert.current = true; // 중복 실행 방지
      
      // URL 파라미터 제거
      window.history.replaceState({}, '', '/dashboard');
      
      // 연동된 provider에 따라 한글 이름 표시
      const providerNames: Record<string, string> = {
        email: '이메일',
        google: '구글',
        kakao: '카카오',
        naver: '네이버'
      };
      const providerName = providerNames[justLinked] || justLinked;
      
      alert(`✅ ${providerName} 연동이 완료되었습니다!`);
      
      // 연동 완료 후 사용자 정보 다시 가져오기 (연동된 provider 목록 업데이트)
      const fetchUserInfo = async () => {
        const authManager = getAuthManager();
        const result = await authManager.getCurrentUserInfo();
        if (result.success && result.data) {
          useAuthStore.getState().setUserInfo(result.data);
        }
      };
      fetchUserInfo();
    }
  }, [location.search]); // React Router의 location.search 사용

  const handleToggle = async (providerId: string) => {
    if (isLinking) return; // 이미 연동 중이면 무시

    const isCurrentlyLinked = linkedProviders.includes(providerId);
    
    if (isCurrentlyLinked) {
      // 연동 해제 로직 (추후 구현)
      console.log(`연동 해제: ${providerId}`);
    } else {
      // 연동 로직
      await linkProvider(providerId);
    }
  };

  const linkProvider = async (providerId: string) => {
    try {
      setIsLinking(providerId);
      
      // 현재 JWT 토큰 가져오기
      const authManager = getAuthManager();
      const tokenResult = await authManager.getToken();
      
      if (!tokenResult.success || !tokenResult.data) {
        alert('❌ 로그인 토큰을 찾을 수 없습니다.');
        return;
      }

      // OAuth 연동의 경우 새 창에서 로그인 진행
      if (['naver', 'kakao', 'google'].includes(providerId)) {
        await handleOAuthLink(providerId);
      } else if (providerId === 'email') {
        await handleEmailLink();
      }

    } catch (error) {
      console.error('❌ 연동 중 오류:', error);
      alert('❌ 연동 중 오류가 발생했습니다.');
    } finally {
      setIsLinking(null);
    }
  };


  const handleOAuthLink = async (providerId: string) => {
    try {
      // 공통 OAuth 플로우 시작 (연동 모드)
      const { initiateOAuthFlow } = await import('../../../../utils/oauthUtils');
      await initiateOAuthFlow(providerId as 'google' | 'kakao' | 'naver', 'link');
    } catch (error) {
      console.error('❌ OAuth 연동 시작 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`❌ OAuth 연동 설정 중 오류가 발생했습니다.\n\n${errorMessage}`);
    }
  };

  const handleEmailLink = async () => {
    // 이메일 연동 페이지로 이동
    navigate('/link/email');
  };

  const isProviderLinked = (providerId: string) => {
    return linkedProviders.includes(providerId);
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
          const isLinkingThis = isLinking === provider.id;

          return (
            <div
              key={provider.id}
              className="my-3 text-sm flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {provider.icon.startsWith('/') ? (
                  <img 
                    src={provider.icon} 
                    alt={provider.name} 
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <span className="text-lg">{provider.icon}</span>
                )}
                <span className={`${provider.color}`}>
                  {provider.name}
                  {isLinkingThis && <span className="text-xs text-blue-600 ml-2">연동 중...</span>}
                </span>
              </div>
              <ToggleSwitch
                isOn={isLinked}
                disabled={isCurrent || isLinkingThis}
                onClick={() => !isCurrent && !isLinkingThis && handleToggle(provider.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialAccountLink;

