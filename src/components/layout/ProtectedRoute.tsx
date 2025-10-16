import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const ProtectedRoute = ({ isAuthenticated, children }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-white border-l border-r border-gray-200 shadow-xl">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="text-gray-900 mb-4 text-xl font-semibold">로그인이 필요합니다</h3>
          <p className="text-gray-600 mb-6">이 페이지에 접근하려면 먼저 로그인해주세요.</p>
          <button 
            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => navigate('/start')}
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
