import { useEffect } from 'react';

const GoogleCallback = () => {
  useEffect(() => {
    try {
      console.log('🚀 React 콜백 페이지 로드됨:', {
        url: window.location.href,
        origin: window.location.origin,
        hasOpener: !!window.opener
      });

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const returnedState = urlParams.get('state');
      
      console.log('📋 OAuth 콜백 처리:', { 
        code: code ? '받음' : '없음', 
        error,
        state: returnedState,
        fullCode: code,
        hasOpener: !!window.opener,
        origin: window.location.origin
      });
      
      if (code) {
        // OAuth 진행 중인지 확인
        const oauthInProgress = localStorage.getItem('oauth_in_progress');
        const oauthProvider = localStorage.getItem('oauth_provider');
        const storedState = localStorage.getItem('google_oauth_state');
        
        console.log('OAuth 상태 확인:', { 
          oauthInProgress, 
          oauthProvider,
          returnedState: returnedState,
          storedState: storedState,
          stateMatch: returnedState === storedState 
        });
        
        // State 검증 (보안 강화)
        if (returnedState && storedState) {
          // URL 디코딩된 값과 비교
          const decodedReturnedState = decodeURIComponent(returnedState);
          const normalizedStoredState = storedState;
          
          if (decodedReturnedState !== normalizedStoredState && returnedState !== normalizedStoredState) {
            console.error('❌ State 매개변수가 일치하지 않습니다. CSRF 공격 가능성', {
              returned: returnedState,
              stored: storedState,
              decodedReturned: decodedReturnedState,
              match1: decodedReturnedState === normalizedStoredState,
              match2: returnedState === normalizedStoredState
            });
            
            // 개발 환경에서는 경고만 표시하고 계속 진행
            if (import.meta.env.MODE === 'development') {
              console.warn('🚧 개발 환경: State 불일치를 허용하고 계속 진행합니다.');
            } else {
              // 프로덕션에서는 중단
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
              return;
            }
          } else {
            console.log('✅ State 검증 성공');
          }
        } else {
          console.warn('⚠️ State 매개변수가 없습니다:', { returnedState, storedState });
          
          // State가 아예 없는 경우도 개발 환경에서만 허용
          if (import.meta.env.MODE !== 'development') {
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }
        }
        
        if (oauthInProgress === 'true' && oauthProvider === 'google') {
          // localStorage에 인증 코드 저장하고 메인 페이지로 리다이렉트
          localStorage.setItem('google_auth_code', code);
          localStorage.removeItem('oauth_in_progress');
          localStorage.removeItem('oauth_provider');
          
          console.log('✅ 인증 코드를 localStorage에 저장하고 메인 페이지로 이동');
          
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else if (window.opener) {
          // 팝업 모드 (기존 로직)
          console.log('부모 창에 OAuth 성공 메시지 전송');
          try {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              code: code
            }, window.location.origin);
            
            setTimeout(() => {
              window.close();
            }, 1000);
          } catch (postError) {
            console.error('❌ postMessage 전송 실패:', postError);
          }
        } else {
          // 일반 페이지 모드
          console.log('일반 페이지에서 OAuth 처리, 메인 페이지로 이동');
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
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, []);

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
