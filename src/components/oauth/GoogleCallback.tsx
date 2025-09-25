import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleCallback = () => {
  const location = useLocation();
  
  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // React StrictMode 중복 실행 방지
        const isProcessing = localStorage.getItem('google_callback_processing');
        if (isProcessing === 'true') {
          return;
        }
        
        // 처리 중 플래그 설정
        localStorage.setItem('google_callback_processing', 'true');
        
        // 올바른 콜백 경로인지 확인 (React Router의 location 사용)
        if (location.pathname !== '/auth/google/callback') {
          localStorage.removeItem('google_callback_processing');
          return;
        }

      // URL 파라미터를 search와 hash 모두에서 확인
      let urlParams: URLSearchParams;
      let code: string | null = null;
      let error: string | null = null;
      let returnedState: string | null = null;

      // search 파라미터 먼저 확인
      if (window.location.search) {
        urlParams = new URLSearchParams(window.location.search);
        code = urlParams.get('code');
        error = urlParams.get('error');
        returnedState = urlParams.get('state');
      }

      // search에서 찾지 못했으면 hash에서 확인
      if (!code && !error && window.location.hash) {
        // hash에서 # 제거하고 파라미터 파싱
        const hashParams = window.location.hash.substring(1);
        urlParams = new URLSearchParams(hashParams);
        code = urlParams.get('code');
        error = urlParams.get('error');
        returnedState = urlParams.get('state');
      }
      
      if (code) {
        // OAuth 진행 중인지 확인
        const oauthInProgress = localStorage.getItem('oauth_in_progress');
        const oauthProvider = localStorage.getItem('oauth_provider');
        const storedState = localStorage.getItem('google_oauth_state');
        
        // State 검증 (보안 강화)
        if (returnedState && storedState) {
          const decodedReturnedState = decodeURIComponent(returnedState);
          const normalizedStoredState = storedState;
          
          if (decodedReturnedState !== normalizedStoredState && returnedState !== normalizedStoredState) {
            if (import.meta.env.MODE !== 'development') {
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
              return;
            }
          }
        } else {
          if (import.meta.env.MODE !== 'development') {
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }
        }
        
        if (oauthInProgress === 'true' && oauthProvider === 'google') {
          // 인가 코드 재사용 방지: 이미 처리된 코드인지 확인
          const existingCode = localStorage.getItem('google_auth_code');
          if (existingCode === code) {
            console.warn('⚠️ 이미 처리된 인가 코드입니다. 중복 처리 방지');
            localStorage.removeItem('oauth_in_progress');
            localStorage.removeItem('oauth_provider');
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
            return;
          }
          
          // localStorage에 인증 코드 저장하고 메인 페이지로 리다이렉트
          localStorage.setItem('google_auth_code', code);
          localStorage.removeItem('oauth_in_progress');
          localStorage.removeItem('oauth_provider');
          
          // 인가 코드 사용 플래그 설정 (재사용 방지)
          localStorage.setItem('google_code_used', 'false');
          
          setTimeout(() => {
            window.location.href = '/';
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
            window.location.href = '/';
          }, 1000);
        }
      } else if (error) {
        console.error('OAuth 에러:', error);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        console.error('인증 코드나 에러 정보가 없습니다.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
      } catch (e) {
        console.error('OAuth 콜백 처리 오류:', e);
        localStorage.removeItem('google_callback_processing');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } finally {
        setTimeout(() => {
          localStorage.removeItem('google_callback_processing');
        }, 1000);
      }
    };

    handleOAuthCallback();
  }, [location.pathname]);

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
          🔄 Google 인증을 처리 중입니다...
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
