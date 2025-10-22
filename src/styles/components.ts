/**
 * 컴포넌트별 스타일 클래스 정의
 */

// 버튼 스타일
export const BUTTON_STYLES = {
  // 기본 버튼
  primary: `
    px-4 py-2 bg-gray-900 text-white border border-gray-900 rounded-lg 
    font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 
    hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed 
    disabled:transform-none
  `,
  
  // 보조 버튼
  secondary: `
    px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg 
    font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 
    hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed 
    disabled:transform-none
  `,
  
  // 위험 버튼
  danger: `
    px-4 py-2 bg-red-600 text-white border border-red-600 rounded-lg 
    font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 
    hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed 
    disabled:transform-none
  `,
  
  // 경고 버튼
  warning: `
    px-4 py-2 bg-orange-500 text-white border border-orange-500 rounded-lg 
    font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 
    hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed 
    disabled:transform-none
  `,
  
  // 큰 버튼
  large: `
    w-full p-4 bg-gray-900 text-white rounded-xl text-base font-semibold 
    hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `,
  
  // 큰 경고 버튼
  largeWarning: `
    w-full p-4 bg-orange-500 text-white rounded-xl text-base font-semibold 
    hover:bg-orange-600 hover:-translate-y-0.5 transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `,
  
  // 작은 버튼
  small: `
    px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium 
    hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `,
} as const;

// 입력 필드 스타일
export const INPUT_STYLES = {
  // 기본 입력 필드
  default: `
    w-full p-4 border border-gray-200 rounded-xl text-base 
    bg-gray-50 focus:outline-none focus:border-gray-900 focus:bg-white 
    transition-colors duration-200 disabled:bg-gray-100 
    disabled:cursor-not-allowed disabled:text-gray-500
  `,
  
  // 인증번호 입력 필드
  verification: `
    w-10 h-14 sm:w-14 sm:h-16 sm:text-xl md:w-16 md:h-20 
    border-2 border-gray-200 rounded-xl text-center text-lg 
    sm:text-lg md:text-2xl font-semibold bg-gray-50 
    transition-all duration-200 focus:outline-none focus:border-gray-900 
    focus:bg-white focus:shadow-lg disabled:bg-gray-100 
    disabled:cursor-not-allowed disabled:text-gray-500 flex-shrink-0
  `,
  
  // 에러 상태 입력 필드
  error: `
    w-full p-4 border border-red-300 rounded-xl text-base 
    bg-red-50 focus:outline-none focus:border-red-500 focus:bg-white 
    transition-colors duration-200
  `,
} as const;

// 카드 스타일
export const CARD_STYLES = {
  // 기본 카드
  default: `
    bg-white border border-gray-200 rounded-xl p-6
  `,
  
  // 헤더가 있는 카드
  withHeader: `
    bg-white border border-gray-200 rounded-xl p-6 mb-4
  `,
  
  // 호버 효과가 있는 카드
  hover: `
    bg-white border border-gray-200 rounded-xl p-6 
    hover:shadow-lg transition-shadow duration-200 cursor-pointer
  `,
} as const;

// 배지 스타일
export const BADGE_STYLES = {
  // 성공 배지
  success: `
    px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800
  `,
  
  // 에러 배지
  error: `
    px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800
  `,
  
  // 경고 배지
  warning: `
    px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800
  `,
  
  // 정보 배지
  info: `
    px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800
  `,
  
  // 회색 배지
  neutral: `
    px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800
  `,
} as const;

// 메시지 스타일
export const MESSAGE_STYLES = {
  // 성공 메시지
  success: `
    p-4 rounded-xl mb-4 font-medium text-sm bg-green-50 text-green-800 
    border border-green-200
  `,
  
  // 에러 메시지
  error: `
    p-4 rounded-xl mb-4 font-medium text-sm bg-red-50 text-red-800 
    border border-red-200
  `,
  
  // 경고 메시지
  warning: `
    p-4 rounded-xl mb-4 font-medium text-sm bg-yellow-50 text-yellow-800 
    border border-yellow-200
  `,
  
  // 정보 메시지
  info: `
    p-4 rounded-xl mb-4 font-medium text-sm bg-blue-50 text-blue-800 
    border border-blue-200
  `,
} as const;

// 로딩 스피너 스타일
export const LOADING_STYLES = {
  // 기본 스피너
  default: `
    w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin
  `,
  
  // 큰 스피너
  large: `
    w-12 h-12 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin
  `,
  
  // 작은 스피너
  small: `
    w-4 h-4 border-2 border-gray-100 border-t-gray-900 rounded-full animate-spin
  `,
} as const;

// 레이아웃 스타일
export const LAYOUT_STYLES = {
  // 페이지 컨테이너
  pageContainer: `
    min-h-screen bg-gray-50 flex flex-col
  `,
  
  // 콘텐츠 컨테이너
  contentContainer: `
    flex-1 p-6 max-w-3xl mx-auto w-full
  `,
  
  // 헤더
  header: `
    p-6 bg-gray-50 border-b border-gray-200 text-center
  `,
  
  // 푸터
  footer: `
    p-6 bg-white border-t border-gray-200 text-center text-sm text-gray-600
  `,
} as const;

// 유틸리티 클래스
export const UTILITY_STYLES = {
  // 텍스트 색상
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  },
  
  // 배경 색상
  background: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    muted: 'bg-gray-100',
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
  },
  
  // 간격
  spacing: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
  
  // 그림자
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
} as const;
