import EmailLogin from './EmailLogin';
import GoogleLogin from './GoogleLogin';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  selectedMethod?: 'email' | 'social' | 'phone' | null;
}

const LoginForm = ({ onLoginSuccess, onBack, selectedMethod }: LoginFormProps) => {
  // selectedMethod에 따라 authProvider 설정
  const authProvider: 'email' | 'google' = selectedMethod === 'social' ? 'google' : 'email';

  return (
    <div className="login-form">
      {/* 뒤로 가기 버튼 */}
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
      )}

      {/* 로그인 방식에 따라 해당 컴포넌트 렌더링 */}
      {authProvider === 'email' ? (
        <EmailLogin onLoginSuccess={onLoginSuccess} />
      ) : (
        <GoogleLogin />
      )}
    </div>
  );
};

export default LoginForm;
