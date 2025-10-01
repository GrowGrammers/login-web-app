import { useNavigate } from 'react-router-dom';

const LoginComplete = () => {
  const navigate = useNavigate();

  const handleConnectNow = () => {
    alert('계정 연동 추후 구현 예정입니다.');
  };

  const handleLater = () => {

    
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('navigate 오류:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white w-full border-l border-r border-gray-200 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 체크마크 이미지 */}
        <div className="w-24 h-24 flex items-center justify-center mb-8">
          <img 
            src="/Successmark.png" 
            alt="가입완료" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          가입완료
        </h2>

        {/* 안내 텍스트 */}
        <p className="text-gray-600 text-center mb-12 leading-relaxed">
          계정 분실에 대비해, 전화번호나 소셜 계정을<br />
          지금 연동해두는 걸 추천드려요.
        </p>

        {/* 버튼들 */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleConnectNow}
            className="w-full p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            style={{ zIndex: 10, position: 'relative' }}
          >
            지금 연동하러 가기
          </button>
          
          <button
            onClick={handleLater}
            className="w-full p-4 bg-gray-100 text-gray-700 rounded-xl text-base font-semibold hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            style={{ zIndex: 10, position: 'relative' }}
          >
            다음에 할게요 (회원 정보 확인)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginComplete;
