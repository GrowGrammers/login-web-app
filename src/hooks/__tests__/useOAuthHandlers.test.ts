import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOAuthHandlers } from '../useOAuthHandlers'
import { useAuthStatus } from '../useAuthStatus'
import { processOAuthProvider, isOAuthCallbackPath, cleanupOAuthProgress } from '../../utils/oauthCallbackUtils'
import { initializeTokenRefreshService } from '../../auth/TokenRefreshService'

// Mock dependencies
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}))

vi.mock('../useAuthStatus')
vi.mock('../../utils/oauthCallbackUtils')
vi.mock('../../auth/TokenRefreshService')

const mockUseAuthStatus = vi.mocked(useAuthStatus)
const mockProcessOAuthProvider = vi.mocked(processOAuthProvider)
const mockIsOAuthCallbackPath = vi.mocked(isOAuthCallbackPath)
const mockCleanupOAuthProgress = vi.mocked(cleanupOAuthProgress)
const mockInitializeTokenRefreshService = vi.mocked(initializeTokenRefreshService)

describe('useOAuthHandlers', () => {
  const mockRefreshAuthStatus = vi.fn()
  const mockSetShowSplash = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
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

  describe('handleOAuthCallback', () => {
    it('OAuth 콜백 경로에서는 실행하지 않는다', async () => {
      mockIsOAuthCallbackPath.mockReturnValue(true)
      
      const { result } = renderHook(() => useOAuthHandlers(mockSetShowSplash))
      
      await act(async () => {
        await result.current.handleOAuthCallback()
      })

      expect(mockProcessOAuthProvider).not.toHaveBeenCalled()
    })

    it('이미 처리 중인 OAuth가 있으면 실행하지 않는다', async () => {
      mockIsOAuthCallbackPath.mockReturnValue(false)
      window.localStorage.getItem = vi.fn().mockReturnValue('true')
      
      const { result } = renderHook(() => useOAuthHandlers(mockSetShowSplash))
      
      await act(async () => {
        await result.current.handleOAuthCallback()
      })

      expect(mockProcessOAuthProvider).not.toHaveBeenCalled()
    })

    it('Google OAuth 코드가 있으면 Google 제공자를 처리한다', async () => {
      mockIsOAuthCallbackPath.mockReturnValue(false)
      window.localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'oauth_processing') return null
        if (key === 'google_auth_code') return 'google_code_123'
        return null
      })
      
      const { result } = renderHook(() => useOAuthHandlers(mockSetShowSplash))
      
      await act(async () => {
        await result.current.handleOAuthCallback()
      })

      expect(mockCleanupOAuthProgress).toHaveBeenCalled()
      expect(mockProcessOAuthProvider).toHaveBeenCalledWith(
        'google',
        'google_code_123',
        mockSetShowSplash,
        mockRefreshAuthStatus,
        mockInitializeTokenRefreshService,
        mockNavigate,
        expect.any(Object)
      )
    })

    it('Kakao OAuth 코드가 있으면 Kakao 제공자를 처리한다', async () => {
      mockIsOAuthCallbackPath.mockReturnValue(false)
      window.localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'oauth_processing') return null
        if (key === 'kakao_auth_code') return 'kakao_code_123'
        return null
      })
      
      const { result } = renderHook(() => useOAuthHandlers(mockSetShowSplash))
      
      await act(async () => {
        await result.current.handleOAuthCallback()
      })

      expect(mockCleanupOAuthProgress).toHaveBeenCalled()
      expect(mockProcessOAuthProvider).toHaveBeenCalledWith(
        'kakao',
        'kakao_code_123',
        mockSetShowSplash,
        mockRefreshAuthStatus,
        mockInitializeTokenRefreshService,
        mockNavigate,
        expect.any(Object)
      )
    })

    it('Naver OAuth 코드가 있으면 Naver 제공자를 처리한다', async () => {
      mockIsOAuthCallbackPath.mockReturnValue(false)
      window.localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'oauth_processing') return null
        if (key === 'naver_auth_code') return 'naver_code_123'
        return null
      })
      
      const { result } = renderHook(() => useOAuthHandlers(mockSetShowSplash))
      
      await act(async () => {
        await result.current.handleOAuthCallback()
      })

      expect(mockCleanupOAuthProgress).toHaveBeenCalled()
      expect(mockProcessOAuthProvider).toHaveBeenCalledWith(
        'naver',
        'naver_code_123',
        mockSetShowSplash,
        mockRefreshAuthStatus,
        mockInitializeTokenRefreshService,
        mockNavigate,
        expect.any(Object)
      )
    })

    it('OAuth 처리 중 예외가 발생하면 에러 메시지를 표시하고 로그인 페이지로 이동한다', async () => {
      mockIsOAuthCallbackPath.mockReturnValue(false)
      window.localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'oauth_processing') return null
        if (key === 'google_auth_code') return 'google_code_123'
        return null
      })
      
      const error = new Error('OAuth processing failed')
      mockProcessOAuthProvider.mockRejectedValue(error)
      
      const { result } = renderHook(() => useOAuthHandlers(mockSetShowSplash))
      
      await act(async () => {
        await result.current.handleOAuthCallback()
      })

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('❌ google 로그인 처리 중 오류 발생')
      )
      expect(mockNavigate).toHaveBeenCalledWith('/start')
    })

    it('OAuth 코드가 없으면 아무것도 처리하지 않는다', async () => {
      mockIsOAuthCallbackPath.mockReturnValue(false)
      window.localStorage.getItem = vi.fn().mockReturnValue(null)
      
      const { result } = renderHook(() => useOAuthHandlers(mockSetShowSplash))
      
      await act(async () => {
        await result.current.handleOAuthCallback()
      })

      expect(mockProcessOAuthProvider).not.toHaveBeenCalled()
    })
  })
})
