import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { OAuthProvider } from './providers/index';
import { getOAuthConfig } from './providers/index';

interface OAuthCallbackProps {
  provider: OAuthProvider;
}

const OAuthCallback = ({ provider }: OAuthCallbackProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = getOAuthConfig(provider);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // React StrictMode 중복 실행 방지
        const isProcessing = localStorage.getItem(config.storageKeys.callbackProcessing);
        if (isProcessing === 'true') {
          return;
        }
        
        // 처리 중 플래그 설정
        localStorage.setItem(config.storageKeys.callbackProcessing, 'true');
        
        // 올바른 콜백 경로인지 확인
        const expectedPath = `/auth/${provider}/callback`;
        if (location.pathname !== expectedPath) {
          localStorage.removeItem(config.storageKeys.callbackProcessing);
          return;
        }

        // URL 파라미터를 search와 hash 모두에서 확인
        let urlParams: URLSearchParams;
        let code: string | null = null;
        let state: string | null = null;
        let error: string | null = null;

        // search 파라미터 먼저 확인
        if (location.search) {
          urlParams = new URLSearchParams(location.search);
          code = urlParams.get('code');
          state = urlParams.get('state');
          error = urlParams.get('error');
        }

        // search에서 찾지 못했으면 hash에서 확인
        if (!code && !error && location.hash) {
          const hashParams = location.hash.substring(1);
          urlParams = new URLSearchParams(hashParams);
          code = urlParams.get('code');
          state = urlParams.get('state');
          error = urlParams.get('error');
        }
        
        if (code) {
          // 🔒 보안: State 파라미터 검증 (CSRF 방지)
          const savedState = localStorage.getItem(config.storageKeys.state);
          if (state !== savedState) {
            console.error(`❌ ${config.name} OAuth state 검증 실패. CSRF 공격 가능성.`);
            localStorage.removeItem(config.storageKeys.callbackProcessing);
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
            return;
          }
          
          // OAuth 진행 중인지 확인 (일반 로그인 또는 연동 모드)
          const oauthInProgress = localStorage.getItem('oauth_in_progress');
          const oauthProvider = localStorage.getItem('oauth_provider');
          const isLinkingMode = localStorage.getItem('is_linking_mode');
          const linkingProvider = localStorage.getItem('linking_provider');
          
          // 일반 로그인 모드 체크
          const isNormalLogin = oauthInProgress === 'true' && oauthProvider === provider;
          // 연동 모드 체크
          const isLinking = isLinkingMode === 'true' && linkingProvider === provider;
          
          if (!isNormalLogin && !isLinking) {
            console.warn(`⚠️ ${config.name} OAuth가 진행 중이 아닙니다. 메인 페이지로 이동합니다.`);
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
            return;
          }
          
          if (isNormalLogin || isLinking) {
            // 인가 코드 재사용 방지: 이미 처리된 코드인지 확인
            const existingCode = localStorage.getItem(config.storageKeys.authCode);
            if (existingCode === code) {
              console.warn(`⚠️ 이미 처리된 ${config.name} 인가 코드입니다. 중복 처리 방지`);
              localStorage.removeItem('oauth_in_progress');
              localStorage.removeItem('oauth_provider');
              localStorage.removeItem('is_linking_mode');
              localStorage.removeItem('linking_provider');
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 1000);
              return;
            }
            
            // localStorage에 인증 코드 저장하고 메인 페이지로 리다이렉트
            localStorage.setItem(config.storageKeys.authCode, code);
            
            // 일반 로그인 모드 플래그 제거
            if (isNormalLogin) {
              localStorage.removeItem('oauth_in_progress');
              localStorage.removeItem('oauth_provider');
            }
            // 연동 모드 플래그는 oauthCallbackUtils에서 제거하므로 여기서는 유지
            
            // 인가 코드 사용 플래그 설정 (재사용 방지)
            localStorage.setItem(config.storageKeys.codeUsed, 'false');
            
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 1000);
          } else if (window.opener) {
            // 팝업 모드 (기존 로직)
            try {
              window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                code: code
              }, window.location.origin);
              
              setTimeout(() => {
                window.close();
              }, 1000);
            } catch (postError) {
              console.error('postMessage 전송 실패:', postError);
            }
          } else {
            // 일반 페이지 모드
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 1000);
          }
        } else if (error) {
          console.error(`${config.name} OAuth 에러:`, error);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          console.error('인증 코드나 에러 정보가 없습니다.');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        }
      } catch (e) {
        console.error(`${config.name} OAuth 콜백 처리 오류:`, e);
        localStorage.removeItem(config.storageKeys.callbackProcessing);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } finally {
        setTimeout(() => {
          localStorage.removeItem(config.storageKeys.callbackProcessing);
        }, 1000);
      }
    };

    handleOAuthCallback();
  }, [location.pathname, provider, config, navigate]);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      margin: 0,
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ color: '#666' }}>
          🔄 {config.name} 인증을 처리 중입니다...
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
