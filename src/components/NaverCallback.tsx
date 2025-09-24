import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthManager, resetAuthManager } from '../auth/authManager';

const NaverCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('🔄 Naver 로그인 처리 중...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleNaverCallback = async () => {
      try {
        // URL에서 인증 코드와 상태 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // 에러 처리
        if (error) {
          throw new Error(`Naver OAuth 오류: ${error}`);
        }

        // 필수 파라미터 검증
        if (!code) {
          throw new Error('인증 코드가 없습니다.');
        }

        // 저장된 상태와 비교
        const savedState = localStorage.getItem('naver_oauth_state');
        if (state !== savedState) {
          throw new Error('상태 값이 일치하지 않습니다.');
        }

        // PKCE code verifier 가져오기
        const codeVerifier = localStorage.getItem('naver_oauth_code_verifier');
        if (!codeVerifier) {
          throw new Error('PKCE code verifier가 없습니다.');
        }

        setMessage('🔄 Naver 인증 코드를 서버로 전송 중...');

        // AuthManager 초기화
        resetAuthManager('naver');
        const authManager = getAuthManager();

        // Naver 로그인 요청
        const loginResult = await authManager.login({
          provider: 'naver',
          authCode: code,
          codeVerifier: codeVerifier
        });

        if (loginResult.success) {
          setMessage('✅ Naver 로그인 성공!');
          
          // 로그인 상태 저장
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('loginProvider', 'naver');
          
          // OAuth 관련 임시 데이터 정리
          localStorage.removeItem('naver_oauth_code_verifier');
          localStorage.removeItem('naver_oauth_state');
          localStorage.removeItem('oauth_in_progress');
          localStorage.removeItem('oauth_provider');
          
          // 1초 후 대시보드로 이동
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          // 서버 오류인 경우 더 구체적인 메시지 표시
          if (loginResult.message?.includes('서버 내부에 문제가 발생했습니다')) {
            setMessage('❌ 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          } else {
            setMessage(`❌ ${loginResult.message || 'Naver 로그인에 실패했습니다.'}`);
          }
          console.error('Naver 로그인 실패:', loginResult);
          setIsLoading(false);
          return;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        setMessage(`❌ ${errorMessage}`);
        console.error('❌ Naver 콜백 처리 중 오류:', error);
        setIsLoading(false);
      }
    };

    handleNaverCallback();
  }, [navigate]);

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
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ 
          color: message.includes('✅') ? '#059669' : message.includes('❌') ? '#dc2626' : '#666',
          marginBottom: isLoading ? '1rem' : '0'
        }}>
          {message}
        </div>
        
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #f3f4f6',
              borderTop: '2px solid #03c75a',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default NaverCallback;
