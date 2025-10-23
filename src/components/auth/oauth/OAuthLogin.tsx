import type { OAuthProvider } from '../../../config/oauth';
import { getOAuthConfig } from '../../../config/oauth';
import { MessageAlert } from '../../ui';
import { useOAuth } from '../../../hooks';

interface OAuthLoginProps {
  provider: OAuthProvider;
}

const OAuthLogin = ({ provider }: OAuthLoginProps) => {
  const { isLoading, message, handleOAuthLogin } = useOAuth(provider);
  const config = getOAuthConfig(provider);

  return (
    <div className="h-full flex flex-col bg-white w-full border-l border-r border-gray-200">
      {/* 헤더 */}
      <div className="px-4 py-16 pb-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.displayName}</h2>
        <p className="text-sm text-gray-600">{config.name} 계정으로 빠르게 로그인하세요</p>
      </div>

      <div className="flex-1 px-8 pb-4 flex flex-col w-full">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col w-full">
            {/* 메시지 표시 */}
            <MessageAlert message={message} />

            <button
              onClick={handleOAuthLogin}
              disabled={isLoading}
              className={`w-full p-4 ${config.buttonColor} ${config.textColor} rounded-xl text-base font-semibold hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {isLoading ? `${config.name} 인증 중...` : config.displayName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthLogin;
