import type { 
  TokenStore, 
  Token, 
  SaveTokenResponse, 
  GetTokenResponse, 
  RemoveTokenResponse, 
  HasTokenResponse, 
  IsTokenExpiredResponse, 
  ClearResponse 
} from 'growgrammers-auth-core';
import { isJWTExpired } from '../utils/jwtUtils';

export class WebTokenStore implements TokenStore {
  private readonly STORAGE_KEY = 'login_web_app_tokens';

  async saveToken(token: Token): Promise<SaveTokenResponse> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(token));
      //console.log('✅ 토큰 저장 완료');
      return { success: true, message: '토큰이 성공적으로 저장되었습니다.', data: undefined };
    } catch (error) {
      console.error('❌ 토큰 저장 실패:', error);
      return { success: false, message: '토큰 저장에 실패했습니다.', data: null, error: error instanceof Error ? error.message : '토큰 저장에 실패했습니다.' };
    }
  }

  async getToken(): Promise<GetTokenResponse> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      
      if (!stored) {
        return { success: true, message: '토큰이 없습니다.', data: null };
      }
      
      const token = JSON.parse(stored);
      return { success: true, message: '토큰을 성공적으로 가져왔습니다.', data: token };
    } catch (error) {
      console.error('❌ 토큰 조회 실패:', error);
      return { success: false, message: '토큰 조회에 실패했습니다.', data: null, error: error instanceof Error ? error.message : '토큰 조회에 실패했습니다.' };
    }
  }

  async removeToken(): Promise<RemoveTokenResponse> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      //console.log('✅ 토큰 삭제 완료');
      return { success: true, message: '토큰이 성공적으로 삭제되었습니다.', data: undefined };
    } catch (error) {
      console.error('❌ 토큰 삭제 실패:', error);
      return { success: false, message: '토큰 삭제에 실패했습니다.', data: null, error: error instanceof Error ? error.message : '토큰 삭제에 실패했습니다.' };
    }
  }

  async hasToken(): Promise<HasTokenResponse> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { success: true, message: '토큰이 없습니다.', data: false };
      }
      
      const token = JSON.parse(stored);
      // 웹에서는 accessToken만 확인 (refreshToken은 쿠키)
      const hasToken = !!token.accessToken;
      return { success: true, message: '토큰 존재 여부를 확인했습니다.', data: hasToken };
    } catch (error) {
      console.error('❌ 토큰 존재 확인 실패:', error);
      return { success: false, message: '토큰 존재 확인에 실패했습니다.', data: null, error: error instanceof Error ? error.message : '토큰 존재 확인에 실패했습니다.' };
    }
  }

  async isTokenExpired(): Promise<IsTokenExpiredResponse> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { success: true, message: '토큰이 없습니다.', data: true };
      }
      
      const token = JSON.parse(stored);
      
      if (!token.accessToken) {
        return { success: true, message: '토큰이 없습니다.', data: true };
      }
      
      // JWT에서 직접 만료 시간 확인
      const isExpired = isJWTExpired(token.accessToken);
      
      if (isExpired === null) {
        // JWT 파싱 실패시 expiredAt 폴백 사용
        if (token.expiredAt) {
          const expired = Date.now() > token.expiredAt;
          return { success: true, message: '토큰 만료 여부를 확인했습니다.', data: expired };
        }
        // 둘 다 없으면 만료되지 않은 것으로 간주
        return { success: true, message: '토큰 만료 여부를 확인했습니다.', data: false };
      }
      
      return { success: true, message: '토큰 만료 여부를 확인했습니다.', data: isExpired };
    } catch (error) {
      console.error('❌ 토큰 만료 확인 실패:', error);
      return { success: false, message: '토큰 만료 확인에 실패했습니다.', data: null, error: error instanceof Error ? error.message : '토큰 만료 확인에 실패했습니다.' };
    }
  }

  async clear(): Promise<ClearResponse> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      //console.log('✅ 저장소 초기화 완료');
      return { success: true, message: '저장소가 성공적으로 초기화되었습니다.', data: undefined };
    } catch (error) {
      console.error('❌ 저장소 초기화 실패:', error);
      return { success: false, message: '저장소 초기화에 실패했습니다.', data: null, error: error instanceof Error ? error.message : '저장소 초기화에 실패했습니다.' };
    }
  }
}
