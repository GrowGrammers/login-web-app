interface SplashScreenProps {
  onStartApp: () => void;
}

const SplashScreen = ({ onStartApp }: SplashScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-white border-l border-r border-gray-200 shadow-xl">
      <div className="min-h-screen flex flex-col justify-end items-center p-8">
        <button 
          className="w-full max-w-md p-4 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200"
          onClick={onStartApp}
        >
          시작하기
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
