import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('🔄 Kakao 로그인 처리 중...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        // URL에서 인증 코드와 상태 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // 에러 처리
        if (error) {
          throw new Error(`Kakao OAuth 오류: ${error}`);
        }

        // 필수 파라미터 검증
        if (!code) {
          throw new Error('인증 코드가 없습니다.');
        }

        // 저장된 상태와 비교
        const savedState = localStorage.getItem('kakao_oauth_state');
        if (state !== savedState) {
          throw new Error('상태 값이 일치하지 않습니다.');
        }

        // PKCE code verifier 가져오기
        const codeVerifier = localStorage.getItem('kakao_oauth_code_verifier');
        if (!codeVerifier) {
          throw new Error('PKCE code verifier가 없습니다.');
        }

        setMessage('✅ Kakao 인증 성공! 메인 페이지로 이동합니다...');

        // 인증 코드를 localStorage에 저장 (App.tsx에서 처리)
        localStorage.setItem('kakao_auth_code', code);
        
        // OAuth 관련 임시 데이터는 유지 (App.tsx에서 정리)
        
        // 1초 후 메인 페이지로 이동 (App.tsx에서 OAuth 콜백 처리)
        setTimeout(() => {
          navigate('/start');
        }, 1000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        setMessage(`❌ ${errorMessage}`);
        console.error('❌ Kakao 콜백 처리 중 오류:', error);
        setIsLoading(false);
      }
    };

    handleKakaoCallback();
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
              borderTop: '2px solid #fbbf24',
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

export default KakaoCallback;
