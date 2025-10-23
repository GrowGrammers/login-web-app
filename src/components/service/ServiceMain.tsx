import { useNavigate } from 'react-router-dom';
import { useAuthStatus, useLogout } from '../../hooks';

const ServiceMain = () => {
  const navigate = useNavigate();
  const { isAuthenticated, refreshAuthStatus } = useAuthStatus();
  const { logout } = useLogout();

  const handleLogout = async () => {
    try {
      // useLogout 훅 사용 - 모든 로그아웃 로직이 훅 안에 통합됨
      const result = await logout();
      
      if (result.success) {
        // Zustand 스토어 상태 업데이트 (전역 상태 즉시 반영)
        await refreshAuthStatus();
        alert('✅ 로그아웃되었습니다.');
        navigate('/start');
      } else {
        console.error('❌ 로그아웃 실패:', result.message);
        alert('로그아웃에 실패했습니다: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoToLogin = () => {
    navigate('/start');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white p-8 md:p-12">
        {/* 로고/아이콘 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            서비스 메인 페이지
          </h1>
          <p className="text-gray-600 text-lg">
            로그인 모듈 테스트용 임시 페이지입니다
          </p>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">

                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="whitespace-nowrap">실제 서비스 메인 페이지가 구현되면 이 페이지는 제거됩니다.</span><br />
                  <span className="whitespace-nowrap">로그인 모듈의 흐름을 테스트하기 위한 임시 페이지입니다.</span>
                </p>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full p-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 text-base"
            >
              회원정보 확인
            </button>
            <button
              onClick={handleLogout}
              className="w-full p-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 text-base"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full p-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 text-base"
            >
              로그인하러 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceMain;

