import { useNavigate } from 'react-router-dom';

interface LoginSelectorProps {
  onBack?: () => void;
}

const LoginSelector = ({ onBack }: LoginSelectorProps) => {
  const navigate = useNavigate();

  const handleMethodSelect = (method: 'email' | 'google' | 'kakao' | 'naver' | 'phone') => {
    if (method === 'phone') {
      alert('전화번호 인증 로그인은 추후 구현 예정입니다.');
      return;
    }
    
    if (method === 'email') {
      navigate('/login/email');
    } else if (method === 'google') {
      navigate('/login/google');
    } else if (method === 'kakao') {
      navigate('/login/kakao');
    } else if (method === 'naver') {
      navigate('/login/naver');
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-br from-gray-50 to-gray-200">
      {/* X 버튼 - 스플래시 화면으로 이동 */}
      <button 
        className="absolute top-4 right-4 bg-white/90 border-0 text-2xl cursor-pointer text-gray-600 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-900 hover:scale-110"
        onClick={onBack}
      >
        ×
      </button>
      
      <div className="relative z-10 text-center mt-[20vh] mb-12 px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">시작하기</h2>
        <p className="text-base text-gray-600 leading-relaxed overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>업체가 요구하는 문구를 작성하는 영역입니다. 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 </p>
      </div>
      
      <div className="relative z-20 bg-white rounded-t-3xl p-8 mt-auto flex flex-col gap-4 ">
        {/* 바텀 시트 핸들 */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-9 h-1 bg-gray-300 rounded-full"></div>
        
        <button 
          className="w-full p-4 border-0 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center text-center font-semibold bg-gray-900 text-white hover:bg-gray-700 hover:-translate-y-0.5"
          onClick={() => handleMethodSelect('phone')}
        >
          <h3 className="text-base font-medium">전화번호로 계속하기</h3>
        </button>
        
        <button 
          className="w-full p-4 border-0 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center text-center font-medium bg-gray-200 text-gray-900 hover:bg-gray-300 hover:-translate-y-0.5"
          onClick={() => handleMethodSelect('email')}
        >
          <h3 className="text-base font-medium">이메일로 계속하기</h3>
        </button>
        
        <div className="flex gap-4 mb-8">
          <button 
            className="flex-1 h-16 border border-gray-200 rounded-2xl bg-white cursor-pointer transition-all duration-300 flex items-center justify-center shadow-sm hover:-translate-y-1 hover:shadow-md"
            onClick={() => handleMethodSelect('kakao')}
          >
            <img src="/kakao_ic.png" alt="Kakao" className="w-8 h-8" />
          </button>
          
          <button 
            className="flex-1 h-16 border border-gray-200 rounded-2xl bg-white cursor-pointer transition-all duration-300 flex items-center justify-center shadow-sm hover:-translate-y-1 hover:shadow-md"
            onClick={() => handleMethodSelect('naver')}
          >
            <img src="/naver_ic.png" alt="Naver" className="w-8 h-8" />
          </button>
          
          <button 
            className="flex-1 h-16 border border-gray-200 rounded-2xl bg-white cursor-pointer transition-all duration-300 flex items-center justify-center shadow-sm hover:-translate-y-1 hover:shadow-md"
            onClick={() => handleMethodSelect('google')}
          >
            <img src="/google_ic.svg" alt="Google" className="w-8 h-8" />
          </button>
        </div>
        
        <p 
          className="text-center text-gray-600 text-sm mt-4 mb-2 cursor-pointer hover:text-gray-800 transition-colors duration-200"
          onClick={() => alert('계정 찾기 추후 구현 예정')}
        >
          계정이 기억나지 않으세요?
        </p>
        
        <p className="text-center text-gray-500 text-xs leading-tight m-0">
          계속하면 [서비스명]의 <strong 
            className="text-gray-600 underline cursor-pointer hover:text-gray-800 transition-colors duration-200"
            onClick={() => alert('이용 약관 추후 구현 예정')}
          >이용 약관</strong>에 동의하는 것 입니다.
        </p>
      </div>
    </div>
  );
};

export default LoginSelector;
