import type { HttpClient, HttpRequestConfig, HttpResponse } from 'growgrammers-auth-core';
import { getTokenRefreshService } from './TokenRefreshService';
import { getExpirationFromJWT } from '../utils/jwtUtils';

// Helpers
function isFormData(v: unknown): v is FormData {
  return typeof FormData !== 'undefined' && v instanceof FormData;
}
function isBlob(v: unknown): v is Blob {
  return typeof Blob !== 'undefined' && v instanceof Blob;
}
function isArrayBufferLike(v: unknown): v is ArrayBuffer | ArrayBufferView {
  return v instanceof ArrayBuffer || ArrayBuffer.isView(v);
}
function isBodylessMethod(m?: string) {
  const method = (m ?? 'GET').toUpperCase();
  return method === 'GET' || method === 'HEAD';
}

/**
 * body는 항상 "객체(object/array)만" 허용
 * - object/array  → JSON.stringify 1회 + application/json
 * - FormData/Blob/ArrayBuffer → 그대로 전송(컨텐트 타입 자동/존중)
 * - 그 외(string/number/boolean 등) → 예외 throw
 */
function normalizeBody(body: unknown): { payload: BodyInit | undefined; contentType: string | null } {
  if (body == null) return { payload: undefined, contentType: null };

  if (isFormData(body)) return { payload: body, contentType: null };
  if (isBlob(body)) return { payload: body, contentType: body.type || null };
  if (isArrayBufferLike(body)) return { payload: body as BodyInit, contentType: null };

  if (typeof body === 'object') {
    // 객체/배열만 허용
    return { payload: JSON.stringify(body), contentType: 'application/json' };
  }

  // 여기 오면 FE 규칙 위반
  throw new Error(
    'HttpClient: Request body must be an object (or FormData/Blob/ArrayBuffer). ' +
    'Do NOT pass stringified JSON or primitives. Pass a plain object and the client will serialize it.'
  );
}


/**
 * 실제 백엔드와 연동하는 HTTP 클라이언트
 * - 쿠키 기반 인증 지원 (credentials: 'include')
 * - JSON 우선 응답 파싱
 * - 타임아웃 및 에러 처리
 */
export class RealHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    try {
      // 토큰이 필요한 API 요청 전에 토큰 만료 체크 및 갱신
      await this.checkAndRefreshTokenIfNeeded(config.url);
      
      const { method = 'GET', url, headers = {}, body, timeout = 10000 } = config;

      // GET/HEAD는 바디 금지
      const skipBody = isBodylessMethod(method);
      
      // 네이버 로그인 요청인 경우 state 추가
      let finalBody = body;
      if (!skipBody && url.includes('/auth/naver/login') && body && typeof body === 'object') {
        const naverState = localStorage.getItem('naver_oauth_state');
        if (naverState) {
          finalBody = {
            ...body,
            state: naverState
          };
        }
      }
      
      const { payload, contentType } = skipBody ? { payload: undefined, contentType: null } : normalizeBody(finalBody);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // 헤더 구성: 사용자가 넘긴 헤더 우선권 보장
      const finalHeaders: Record<string, string> = {
        Accept: 'application/json',
        'X-Client-Type': 'web', // 웹 클라이언트임을 명시
        ...headers,
      };
      
      // Content-Type 자동 설정 (사용자가 지정하지 않은 경우)
      if (contentType && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) {
        finalHeaders['Content-Type'] = contentType;
      }


      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal: controller.signal,
        credentials: 'include', // 🍪 쿠키 기반 인증을 위해 자격 증명 포함
      });

      clearTimeout(timeoutId);

      // 응답 파싱: JSON 우선 → 텍스트 폴백
      const data = await response.json().catch(async () => {
        const txt = await response.text().catch(() => '');
        return txt ? { raw: txt } : null;
      });

      const responseHeaders = Object.fromEntries(response.headers.entries());
      
      // Authorization 헤더를 대소문자 구분 없이 찾기
      const authHeaderValue = responseHeaders.authorization || 
                              responseHeaders.Authorization || 
                              responseHeaders['authorization'] || 
                              responseHeaders['Authorization'];
      
      

      // 로그인 및 토큰 갱신 응답의 Authorization 헤더에서 토큰 추출 (이메일, Google, Kakao, Naver, Refresh 공통)
      if ((url.includes('/auth/email/login') || url.includes('/auth/members/email-login') || url.includes('/auth/google/login') || url.includes('/auth/kakao/login') || url.includes('/auth/naver/login') || url.includes('/auth/refresh') || url.includes('/auth/members/refresh')) && response.ok && authHeaderValue) {
        // Authorization 헤더에서 Bearer 토큰 추출
        const authHeader = authHeaderValue;
        if (authHeader.startsWith('Bearer ')) {
          const accessToken = authHeader.substring(7); // 'Bearer ' 제거
          
          // WebTokenStore에 직접 저장
          try {
            const tokenStore = new (await import('./WebTokenStore')).WebTokenStore();
            
            // JWT에서 실제 만료 시간을 추출, 실패시 1시간 후로 폴백
            const expiredAt = getExpirationFromJWT(accessToken) || Date.now() + (60 * 60 * 1000);
            
            await tokenStore.saveToken({
              accessToken: accessToken,
              expiredAt: expiredAt
            });
            
            // 토큰 저장 후 사용자 정보 가져오기
            await this.fetchUserInfo();
          } catch (tokenError) {
            console.error('❌ 토큰 저장 실패:', tokenError);
          }
        } else {
          console.warn('⚠️ Authorization 헤더가 Bearer 형식이 아닙니다:', authHeader);
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        json: async () => data,
        text: async () => (typeof data === 'string' ? data : JSON.stringify(data))
      };
    } catch (error) {
      console.error('❌ HTTP 요청 실패:', error);
      
      // 네트워크 오류 타입별 사용자 친화적 메시지 제공
      let userMessage = '알 수 없는 오류가 발생했습니다.';
      let errorType = 'UNKNOWN_ERROR';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // 네트워크 연결 실패 (서버가 꺼져있거나 네트워크 문제)
        userMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        errorType = 'CONNECTION_REFUSED';
      } else if (error instanceof Error && error.name === 'AbortError') {
        // 타임아웃 오류
        userMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
        errorType = 'TIMEOUT';
      } else if (error instanceof Error) {
        userMessage = error.message;
        errorType = 'NETWORK_ERROR';
      }
      
      // 네트워크/타임아웃/규칙 위반 등
      return {
        ok: false,
        status: 0,
        statusText: 'Error',
        headers: {},
        json: async () => ({ 
          error: userMessage,
          errorType: errorType
          // originalError는 로깅 전용으로만 유지(클라이언트 반환 금지)
        }),
        text: async () => userMessage
      };
    }
  }

  /**
   * 사용자 정보 가져오기 (중복 호출 방지를 위해 비활성화)
   * Dashboard 컴포넌트에서만 user-info API를 호출하도록 함
   */
  private async fetchUserInfo(): Promise<void> {
    // 중복 API 호출 방지를 위해 비활성화
    // Dashboard 컴포넌트에서 이미 user-info API를 호출하므로 여기서는 호출하지 않음
  }

  /**
   * 토큰이 필요한 API 요청인지 확인하고 필요시 토큰 갱신
   */
  private async checkAndRefreshTokenIfNeeded(url: string): Promise<void> {
    try {
      // 토큰 갱신 체크를 하지 않는 API들
      const skipTokenCheckEndpoints = [
        // 인증이 필요 없는 공개 API들
        '/auth/email/request-verification',
        '/auth/email/verify', 
        '/auth/email/login',
        '/auth/members/email-login',
        '/auth/google/authorize',
        '/auth/google/login',
        '/auth/kakao/authorize',
        '/auth/kakao/login',
        '/auth/naver/login',  // 네이버 로그인 추가
        '/health',
        
        // 토큰 갱신 API들 (무한 루프 방지)
        '/auth/refresh',
        '/auth/members/refresh'
      ];

      // 토큰 갱신 체크를 건너뛸 API인지 확인
      const shouldSkipTokenCheck = skipTokenCheckEndpoints.some(endpoint => url.includes(endpoint));
      if (shouldSkipTokenCheck || !url.startsWith('/api')) {
        return;
      }

      // 토큰 갱신 서비스를 통해 필요시 갱신
      const tokenRefreshService = getTokenRefreshService();
      await tokenRefreshService.refreshToken();
    } catch (error) {
      console.error('[RealHttpClient] 토큰 갱신 중 오류:', error);
      // 토큰 갱신 실패 시에도 원래 요청은 진행 (서버에서 401 처리)
    }
  }
}
