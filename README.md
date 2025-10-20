# 로그인 웹 데모


## 핵심 기능

### 다중 인증 방식 지원
- **이메일 인증**: 이메일 + 6자리 인증번호 로그인
- **소셜 로그인**: Google, Kakao, Naver OAuth 연동
- **계정 연동**: 기존 소셜 계정에 이메일 로그인 방식 추가

### 보안 기능
- JWT 토큰 기반 인증
- 자동 토큰 갱신 (Refresh Token)
- 토큰 만료 시간 실시간 모니터링
- HttpOnly 쿠키를 통한 안전한 토큰 저장


## 로컬 실행 방법

### 1. 프로젝트 클론 및 의존성 설치
```bash
git clone <repository-url>
cd login-web-app
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# API 서버 설정
VITE_API_BASE_URL=http://localhost:8080

# Google OAuth 설정
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Kakao OAuth 설정
VITE_KAKAO_CLIENT_ID=your_kakao_client_id_here

# Naver OAuth 설정
VITE_NAVER_CLIENT_ID=your_naver_client_id_here
```

### 3. 개발 서버 실행
```bash
npm run dev
```

애플리케이션이 `http://localhost:5173`에서 실행됩니다.

### 4. 백엔드 API 서버 실행
이 애플리케이션은 백엔드 API 서버가 필요합니다. 백엔드 서버를 `http://localhost:8080`에서 실행해주세요.

## 테스트 실행

```bash
# 단위 테스트 실행
npm run test

# 테스트 UI 실행
npm run test:ui

# 커버리지 리포트 생성
npm run test:coverage
```


## 📁 프로젝트 구조

```
src/
├── auth/                 # 인증 관련 모듈
│   ├── authManager.ts    # 인증 매니저
│   ├── TokenRefreshService.ts  # 토큰 갱신 서비스
│   └── WebTokenStore.ts  # 토큰 저장소
├── components/           # React 컴포넌트
│   ├── auth/            # 인증 관련 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── ui/              # 공통 UI 컴포넌트
├── hooks/               # 커스텀 훅
├── stores/              # 상태 관리 (Zustand)
├── utils/               # 유틸리티 함수
└── config/              # 설정 파일
```

## 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Testing**: Vitest, Testing Library
- **Authentication**: JWT, OAuth 2.0
- **HTTP Client**: Fetch API

## 주요 API 엔드포인트

- `POST /api/v1/auth/email/request` - 이메일 인증번호 요청
- `POST /api/v1/auth/email/verify` - 이메일 인증번호 검증
- `POST /api/v1/auth/members/email-login` - 이메일 로그인
- `POST /api/v1/auth/google/login` - Google OAuth 로그인
- `POST /api/v1/auth/kakao/login` - Kakao OAuth 로그인
- `POST /api/v1/auth/naver/login` - Naver OAuth 로그인
- `GET /api/v1/auth/members/user-info` - 사용자 정보 조회
- `POST /api/v1/auth/members/refresh` - 토큰 갱신

