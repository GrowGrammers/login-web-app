import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthManager, createEmailAuthManager } from '../auth/authManager';
import { validateEmailWithAlert } from '../utils/emailValidationUtils';
import { WebTokenStore } from '../auth/WebTokenStore';
import { getApiConfig } from '../config/auth.config';

interface UseEmailVerificationOptions {
  isLinkMode?: boolean;
  onSuccess?: () => void;
  onTimerStart?: () => void;
}

interface UseEmailVerificationReturn {
  message: string;
  isLoading: boolean;
  requestEmailVerification: (email: string) => Promise<boolean>;
  verifyEmailLogin: (email: string, verifyCode: string) => Promise<boolean>;
}

/**
 * 이메일 인증 요청 및 로그인 로직을 관리하는 커스텀 훅
 */
export const useEmailVerification = ({
  isLinkMode = false,
  onSuccess,
  onTimerStart
}: UseEmailVerificationOptions = {}): UseEmailVerificationReturn => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 이메일 인증번호 요청
   */
  const requestEmailVerification = useCallback(async (email: string): Promise<boolean> => {
    // 이메일 유효성 검사
    if (!validateEmailWithAlert(email)) {
      return false;
    }

    setMessage('이메일을 보내고 있습니다...');
    setIsLoading(true);

    try {
      // 이메일 인증 요청은 항상 EmailAuthManager를 사용
      const authManager = createEmailAuthManager();
      const result = await authManager.requestEmailVerification({ email });

      if (result.success) {
        setMessage('✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요.');
        onTimerStart?.();
        return true;
      } else {
        setMessage(`❌ ${result.message}`);
        console.error('❌ 이메일 인증번호 요청 실패:', result.error);
        return false;
      }
    } catch (error) {
      setMessage('❌ 네트워크 오류가 발생했습니다.');
      console.error('❌ 이메일 인증번호 요청 중 오류:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onTimerStart]);

  /**
   * 이메일 로그인 또는 연동 처리
   */
  const verifyEmailLogin = useCallback(async (email: string, verifyCode: string): Promise<boolean> => {
    if (!email || !verifyCode) {
      setMessage('❌ 이메일과 인증번호를 모두 입력해주세요.');
      return false;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      if (isLinkMode) {
        // 연동 모드: /api/v1/auth/link/email-login으로 JWT 헤더와 함께 요청
        const tokenStore = new WebTokenStore();
        const tokenResult = await tokenStore.getToken();
        
        if (!tokenResult.success || !tokenResult.data) {
          setMessage('❌ 로그인 토큰을 찾을 수 없습니다.');
          return false;
        }
        
        const accessToken = tokenResult.data.accessToken;
        const apiConfig = getApiConfig();
        const apiBaseUrl = apiConfig.apiBaseUrl;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const endpoints = apiConfig.endpoints as any;
        const linkEndpoint = endpoints.emailLink || '/api/v1/auth/link/email-login';
        
        const response = await fetch(`${apiBaseUrl}${linkEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'X-Client-Type': 'web'
          },
          credentials: 'include',
          body: JSON.stringify({ email, verifyCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setMessage('✅ 이메일 연동 성공!');
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate('/dashboard?linked=email');
          return true;
        } else {
          // EMAIL_EXPIRED 에러 처리
          if (data.message?.includes('이메일 인증 시간이 만료되었습니다') || response.status === 410) {
            setMessage('❌ 인증번호가 만료되었습니다. 새로운 인증번호를 받아주세요.');
            return false;
          } else {
            setMessage(`❌ ${data.message || '연동에 실패했습니다.'}`);
            console.error('❌ 이메일 연동 실패:', data);
            return false;
          }
        }
      } else {
        // 일반 로그인 모드
        const authManager = getAuthManager();
        const result = await authManager.login({
          provider: 'email',
          email,
          verifyCode
        });

        if (result.success) {
          setMessage('✅ 로그인 성공!');
          
          // 로그인 성공 후 토큰이 저장될 때까지 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 토큰이 제대로 저장되었는지 확인
          const tokenStore = new WebTokenStore();
          const tokenResult = await tokenStore.getToken();
          if (!tokenResult.success || !tokenResult.data?.accessToken) {
            console.warn('⚠️ 토큰이 저장되지 않았습니다. RealHttpClient에서 처리되었는지 확인하세요.');
          }
          
          onSuccess?.();
          return true;
        } else {
          // EMAIL_EXPIRED 에러 처리
          if (result.message?.includes('이메일 인증 시간이 만료되었습니다')) {
            setMessage('❌ 인증번호가 만료되었습니다. 새로운 인증번호를 받아주세요.');
            return false;
          } else {
            setMessage(`❌ ${result.message}`);
            console.error('❌ 로그인 실패:', result.error);
            return false;
          }
        }
      }
    } catch (error) {
      setMessage(isLinkMode ? '❌ 연동 중 오류가 발생했습니다.' : '❌ 로그인 중 오류가 발생했습니다.');
      console.error(isLinkMode ? '❌ 연동 중 오류:' : '❌ 로그인 중 오류:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLinkMode, navigate, onSuccess]);

  return {
    message,
    isLoading,
    requestEmailVerification,
    verifyEmailLogin
  };
};

