import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthHandlers } from '../useAuthHandlers'
import { useAuthStatus } from '../useAuthStatus'
import { getAuthManager, getCurrentProviderType } from '../../auth/authManager'
import { handleOAuthLogout, handleEmailLogout, isOAuthProvider } from '../../utils/logoutUtils'
import { initializeTokenRefreshService } from '../../auth/TokenRefreshService'

// Mock dependencies
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../useAuthStatus')
vi.mock('../../auth/authManager')
vi.mock('../../utils/logoutUtils')
vi.mock('../../auth/TokenRefreshService')

const mockUseAuthStatus = vi.mocked(useAuthStatus)
const mockGetAuthManager = vi.mocked(getAuthManager)
const mockGetCurrentProviderType = vi.mocked(getCurrentProviderType)
const mockHandleOAuthLogout = vi.mocked(handleOAuthLogout)
const mockHandleEmailLogout = vi.mocked(handleEmailLogout)
const mockIsOAuthProvider = vi.mocked(isOAuthProvider)
const mockInitializeTokenRefreshService = vi.mocked(initializeTokenRefreshService)

describe('useAuthHandlers', () => {
  const mockRefreshAuthStatus = vi.fn()
  const mockSetShowSplash = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      timeUntilExpiry: null,
      tokenExpiredAt: null,
      userInfo: null,
      refreshAuthStatus: mockRefreshAuthStatus,
      login: vi.fn(),
      logout: vi.fn(),
    })

  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('handleLoginSuccess', () => {
    it('이메일 로그인 성공 시 토큰 갱신 서비스를 시작하고 사용자 정보를 가져온다', async () => {
      mockGetCurrentProviderType.mockReturnValue('email')
      
      const { result } = renderHook(() => useAuthHandlers())
      
      await act(async () => {
        await result.current.handleLoginSuccess()
      })

      expect(mockInitializeTokenRefreshService).toHaveBeenCalled()
      expect(mockRefreshAuthStatus).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login/complete')
    })

    it('OAuth 로그인 성공 시 토큰 갱신 서비스를 시작하고 사용자 정보를 가져온다', async () => {
      mockGetCurrentProviderType.mockReturnValue('google')
      
      const { result } = renderHook(() => useAuthHandlers())
      
      await act(async () => {
        await result.current.handleLoginSuccess()
      })

      expect(mockInitializeTokenRefreshService).toHaveBeenCalled()
      expect(mockRefreshAuthStatus).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login/complete')
    })
  })

  describe('handleLogout', () => {
    it('OAuth 로그아웃이 성공하면 상태를 업데이트하고 홈으로 이동한다', async () => {
      const mockAuthManager = { logout: vi.fn() } as unknown as import('growgrammers-auth-core').AuthManager
      mockGetAuthManager.mockReturnValue(mockAuthManager)
      mockGetCurrentProviderType.mockReturnValue('google')
      mockIsOAuthProvider.mockReturnValue(true)
      mockHandleOAuthLogout.mockResolvedValue({ success: true, message: 'Success' })

      const { result } = renderHook(() => useAuthHandlers())
      
      await act(async () => {
        await result.current.handleLogout(mockSetShowSplash)
      })

      expect(mockHandleOAuthLogout).toHaveBeenCalledWith('google', mockAuthManager)
      expect(mockRefreshAuthStatus).toHaveBeenCalled()
      expect(mockSetShowSplash).toHaveBeenCalledWith(true)
      expect(window.alert).toHaveBeenCalledWith('✅ 로그아웃되었습니다.')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('이메일 로그아웃이 성공하면 상태를 업데이트하고 홈으로 이동한다', async () => {
      const mockAuthManager = { logout: vi.fn() } as unknown as import('growgrammers-auth-core').AuthManager
      mockGetAuthManager.mockReturnValue(mockAuthManager)
      mockGetCurrentProviderType.mockReturnValue('email')
      mockIsOAuthProvider.mockReturnValue(false)
      mockHandleEmailLogout.mockResolvedValue({ success: true, message: 'Success' })

      const { result } = renderHook(() => useAuthHandlers())
      
      await act(async () => {
        await result.current.handleLogout(mockSetShowSplash)
      })

      expect(mockHandleEmailLogout).toHaveBeenCalledWith(mockAuthManager, 'email')
      expect(mockRefreshAuthStatus).toHaveBeenCalled()
      expect(mockSetShowSplash).toHaveBeenCalledWith(true)
      expect(window.alert).toHaveBeenCalledWith('✅ 로그아웃되었습니다.')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('로그아웃이 실패하면 에러 메시지를 표시한다', async () => {
      const mockAuthManager = { logout: vi.fn() } as unknown as import('growgrammers-auth-core').AuthManager
      mockGetAuthManager.mockReturnValue(mockAuthManager)
      mockGetCurrentProviderType.mockReturnValue('google')
      mockIsOAuthProvider.mockReturnValue(true)
      mockHandleOAuthLogout.mockResolvedValue({ success: false, message: 'Logout failed' })

      const { result } = renderHook(() => useAuthHandlers())
      
      await act(async () => {
        await result.current.handleLogout(mockSetShowSplash)
      })

      expect(window.alert).toHaveBeenCalledWith('로그아웃에 실패했습니다: Logout failed')
      expect(mockSetShowSplash).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalledWith('/')
    })

    it('로그아웃 중 예외가 발생하면 에러 메시지를 표시한다', async () => {
      const mockAuthManager = { logout: vi.fn() } as unknown as import('growgrammers-auth-core').AuthManager
      mockGetAuthManager.mockReturnValue(mockAuthManager)
      mockGetCurrentProviderType.mockReturnValue('google')
      mockIsOAuthProvider.mockReturnValue(true)
      mockHandleOAuthLogout.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuthHandlers())
      
      await act(async () => {
        await result.current.handleLogout(mockSetShowSplash)
      })

      expect(window.alert).toHaveBeenCalledWith('로그아웃 중 오류가 발생했습니다.')
      expect(mockSetShowSplash).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalledWith('/')
    })
  })
})
