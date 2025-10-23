import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const ProtectedRoute = ({ isAuthenticated, children }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 인증되지 않은 경우 즉시 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      // replace를 사용하여 히스토리에 보호된 페이지를 남기지 않음
      navigate('/start', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 인증되지 않은 경우 리다이렉트 전까지 임시 UI 표시
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-white border-l border-r border-gray-200 shadow-xl">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
          </div>
          <h3 className="text-gray-900 mb-4 text-xl font-semibold">인증 확인 중...</h3>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
