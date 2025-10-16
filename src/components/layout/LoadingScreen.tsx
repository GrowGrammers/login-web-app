const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col w-full bg-white border-l border-r border-gray-200 shadow-xl">
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-gray-900 mb-4 text-xl font-semibold">인증 상태 확인 중...</h3>
        <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
