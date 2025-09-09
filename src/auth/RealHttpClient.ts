import type { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

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
  if (isArrayBufferLike(body)) return { payload: body, contentType: null };

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
      const { method = 'GET', url, headers = {}, body, timeout = 10000 } = config;

      // GET/HEAD는 바디 금지
      const skipBody = isBodylessMethod(method);
      const { payload, contentType } = skipBody ? { payload: undefined, contentType: null } : normalizeBody(body);

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

      // HTTP 요청 로깅 삭제 (production에서 비활성화)

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
      
      // Google OAuth 로그인 응답의 Authorization 헤더에서 토큰 추출
      if (url.includes('/auth/google/login') && response.ok && responseHeaders.authorization) {
        // Authorization 헤더에서 Bearer 토큰 추출
        const authHeader = responseHeaders.authorization;
        if (authHeader.startsWith('Bearer ')) {
          const accessToken = authHeader.substring(7); // 'Bearer ' 제거
          
          // WebTokenStore에 직접 저장
          try {
            const tokenStore = new (await import('./WebTokenStore')).WebTokenStore();
            await tokenStore.saveToken({
              accessToken: accessToken,
              expiredAt: Date.now() + (60 * 60 * 1000) // 1시간 후 만료로 임시 설정
            });
          } catch (tokenError) {
            console.error('❌ 수동 토큰 저장 실패:', tokenError);
          }
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
      
      // 네트워크/타임아웃/규칙 위반 등
      return {
        ok: false,
        status: 0,
        statusText: 'Error',
        headers: {},
        json: async () => ({ error: error instanceof Error ? error.message : '알 수 없는 오류' }),
        text: async () => (error instanceof Error ? error.message : '알 수 없는 오류')
      };
    }
  }
}
