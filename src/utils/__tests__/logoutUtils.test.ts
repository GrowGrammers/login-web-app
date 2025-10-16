import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleOAuthLogout, handleEmailLogout, isOAuthProvider } from '../logoutUtils'
import { useAuthStore } from '../../stores/authStore'

// Mock dependencies
vi.mock('../../stores/authStore')

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('logoutUtils', () => {
  const mockAuthManager = {
    logout: vi.fn(),
  } as unknown as import('growgrammers-auth-core').AuthManager

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock functions
    mockAuthManager.logout = vi.fn()
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Mock auth store
    mockUseAuthStore.getState = vi.fn().mockReturnValue({
      logout: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('handleOAuthLogout', () => {
    it('Google OAuth 로그아웃이 성공하면 localStorage를 정리하고 스토어를 업데이트한다', async () => {
      vi.mocked(mockAuthManager.logout).mockResolvedValue({ success: true, data: undefined, message: 'Success' })

      const result = await handleOAuthLogout('google', mockAuthManager)

      expect(result.success).toBe(true)
      expect(vi.mocked(mockAuthManager.logout)).toHaveBeenCalledWith({ provider: 'google' })
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('google_auth_code')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('google_oauth_code_verifier')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('google_oauth_state')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('oauth_processing')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('oauth_in_progress')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('oauth_provider')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('current_provider_type')
      expect(mockUseAuthStore.getState().logout).toHaveBeenCalled()
    })

    it('Kakao OAuth 로그아웃이 성공하면 localStorage를 정리하고 스토어를 업데이트한다', async () => {
      vi.mocked(mockAuthManager.logout).mockResolvedValue({ success: true, data: undefined, message: 'Success' })

      const result = await handleOAuthLogout('kakao', mockAuthManager)

      expect(result.success).toBe(true)
      expect(mockAuthManager.logout).toHaveBeenCalledWith({ provider: 'kakao' })
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('kakao_auth_code')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('kakao_oauth_code_verifier')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('kakao_oauth_state')
    })

    it('Naver OAuth 로그아웃이 성공하면 localStorage를 정리하고 스토어를 업데이트한다', async () => {
      vi.mocked(mockAuthManager.logout).mockResolvedValue({ success: true, data: undefined, message: 'Success' })

      const result = await handleOAuthLogout('naver', mockAuthManager)

      expect(result.success).toBe(true)
      expect(mockAuthManager.logout).toHaveBeenCalledWith({ provider: 'naver' })
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('naver_auth_code')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('naver_oauth_code_verifier')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('naver_oauth_state')
    })

    it('OAuth 로그아웃이 실패하면 에러 메시지를 반환한다', async () => {
      vi.mocked(mockAuthManager.logout).mockResolvedValue({ success: false, data: null, message: 'Logout failed', error: 'Logout failed' })

      const result = await handleOAuthLogout('google', mockAuthManager)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Logout failed')
      expect(window.localStorage.removeItem).not.toHaveBeenCalled()
      expect(mockUseAuthStore.getState().logout).not.toHaveBeenCalled()
    })

    it('OAuth 로그아웃 중 예외가 발생하면 에러 메시지를 반환한다', async () => {
      const error = new Error('Network error')
      vi.mocked(mockAuthManager.logout).mockRejectedValue(error)

      const result = await handleOAuthLogout('google', mockAuthManager)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error')
      expect(console.error).toHaveBeenCalledWith('OAuth 로그아웃 중 오류:', error)
    })

    it('알 수 없는 오류가 발생하면 기본 메시지를 반환한다', async () => {
      vi.mocked(mockAuthManager.logout).mockRejectedValue('Unknown error')

      const result = await handleOAuthLogout('google', mockAuthManager)

      expect(result.success).toBe(false)
      expect(result.message).toBe('OAuth 로그아웃 중 알 수 없는 오류가 발생했습니다.')
    })
  })

  describe('handleEmailLogout', () => {
    it('이메일 로그아웃이 성공하면 localStorage를 정리하고 스토어를 업데이트한다', async () => {
      vi.mocked(mockAuthManager.logout).mockResolvedValue({ success: true, data: undefined, message: 'Success' })

      const result = await handleEmailLogout(mockAuthManager, 'email')

      expect(result.success).toBe(true)
      expect(mockAuthManager.logout).toHaveBeenCalledWith({ provider: 'email' })
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('current_provider_type')
      expect(mockUseAuthStore.getState().logout).toHaveBeenCalled()
    })

    it('이메일 로그아웃이 실패하면 에러 메시지를 반환한다', async () => {
      vi.mocked(mockAuthManager.logout).mockResolvedValue({ success: false, data: null, message: 'Logout failed', error: 'Logout failed' })

      const result = await handleEmailLogout(mockAuthManager, 'email')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Logout failed')
      expect(window.localStorage.removeItem).not.toHaveBeenCalled()
      expect(mockUseAuthStore.getState().logout).not.toHaveBeenCalled()
    })
  })

  describe('isOAuthProvider', () => {
    it('OAuth 제공자를 올바르게 식별한다', () => {
      expect(isOAuthProvider('google')).toBe(true)
      expect(isOAuthProvider('kakao')).toBe(true)
      expect(isOAuthProvider('naver')).toBe(true)
    })

    it('OAuth가 아닌 제공자를 올바르게 식별한다', () => {
      expect(isOAuthProvider('email')).toBe(false)
      expect(isOAuthProvider('facebook')).toBe(false)
      expect(isOAuthProvider('twitter')).toBe(false)
      expect(isOAuthProvider('')).toBe(false)
    })

    it('타입 가드를 올바르게 작동시킨다', () => {
      const provider: string = 'google'
      
      if (isOAuthProvider(provider)) {
        // 이 블록 내에서 provider는 'google' | 'naver' | 'kakao' 타입
        expect(provider).toBe('google')
      }
    })
  })
})
