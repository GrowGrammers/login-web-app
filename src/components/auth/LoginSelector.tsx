import { useNavigate } from 'react-router-dom';
import { AuthStatusBadge } from '../ui';

interface LoginSelectorProps {
  onBack?: () => void;
  isAuthenticated?: boolean;
}

const LoginSelector = ({ onBack, isAuthenticated }: LoginSelectorProps) => {
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
    <div className="h-full fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col">
      {/* 인증 상태 헤더 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-center relative z-40 max-w-xl mx-auto w-full">
        <AuthStatusBadge isAuthenticated={isAuthenticated || false} />
      </div>
      
      {/* 바텀시트를 하단에 고정 */}
      <div className="flex-1 flex flex-col justify-end relative">
        {/* 중간 영역 배경과 border line - max-w-xl 영역으로 제한 */}
        <div className="absolute inset-0 flex justify-center">
          <div className="w-full max-w-xl bg-gradient-to-br from-gray-50 to-gray-200 border-t border-gray-200 shadow-lg"></div>
        </div>
        
        <div className="relative z-20 bg-white rounded-t-3xl pt-8 px-8 pb-4 max-h-[70vh] flex flex-col gap-4 shadow-2xl max-w-xl mx-auto w-full">
        {/* X 버튼 - 스플래시 화면으로 이동 */}
        <button 
          className="absolute top-4 right-4 bg-gray-500 border-0 text-2xl cursor-pointer text-white z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-600 hover:scale-110"
          onClick={onBack}
        >
          ×
        </button>
        
        {/* 제목과 설명 텍스트 */}
        <div className="text-left mb-6 mt-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">시작하기</h3>
          <p className="text-base text-gray-600 leading-relaxed overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>업체가 요구하는 문구를 작성하는 영역입니다. 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 최대 2줄까지 노출 </p>
        </div>
        
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
        
        <div className="flex gap-4">
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
          className="text-right text-gray-600 text-sm mb-6 cursor-pointer hover:text-gray-800 transition-colors duration-200"
          onClick={() => alert('계정 찾기 추후 구현 예정')}
        >
          계정이 기억나지 않으세요?
        </p>
        
        <p className="text-center text-gray-500 text-xs leading-tight mt-2 mb-2">
          계속하면 [서비스명]의 <strong 
            className="text-gray-600 underline cursor-pointer hover:text-gray-800 transition-colors duration-200"
            onClick={() => window.open('https://amazing-jelly-42b.notion.site/27fbb18df73c80aabc58dbf959588677?source=copy_link', '_blank')}
          >이용 약관</strong>에 동의하는 것 입니다.
        </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;
