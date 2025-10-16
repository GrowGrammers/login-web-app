import { useLocation, useNavigate } from 'react-router-dom';
import { AuthStatusBadge, BackButton } from '../ui';

interface AuthHeaderProps {
  isAuthenticated: boolean;
  emailLoginStep: 'email' | 'verification';
  emailLoginRef: React.RefObject<{ resetForm: () => void } | null>;
}

const AuthHeader = ({ isAuthenticated, emailLoginStep, emailLoginRef }: AuthHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-center relative">
      {/* 뒤로가기 버튼 - 시작하기 페이지가 아닐 때만 표시 */}
      {location.pathname !== '/start' && (
        <BackButton 
          className="absolute left-4"
          onClick={() => {
            // 이메일 로그인 페이지에서 인증번호 입력 단계인 경우 이메일 입력 단계로 이동
            if (location.pathname === '/login/email' && emailLoginStep === 'verification') {
              emailLoginRef.current?.resetForm();
            } else {
              navigate('/start');
            }
          }}
        />
      )}
      
      {/* 인증 상태 - 항상 중앙 정렬 */}
      <AuthStatusBadge isAuthenticated={isAuthenticated} />
    </div>
  );
};

export default AuthHeader;
