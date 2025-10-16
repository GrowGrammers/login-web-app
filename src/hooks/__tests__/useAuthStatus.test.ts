import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStatus } from '../useAuthStatus'
import { useAuthStore } from '../../stores/authStore'

// Mock the auth store
vi.mock('../../stores/authStore')

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('useAuthStatus', () => {
  const mockRefreshAuthStatus = vi.fn()
  const mockLogin = vi.fn()
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      timeUntilExpiry: null,
      tokenExpiredAt: null,
      userInfo: null,
      refreshAuthStatus: mockRefreshAuthStatus,
      login: mockLogin,
      logout: mockLogout,
    })
  })

  it('인증 상태를 올바르게 반환한다', () => {
    const { result } = renderHook(() => useAuthStatus())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.timeUntilExpiry).toBe(null)
    expect(result.current.tokenExpiredAt).toBe(null)
    expect(result.current.userInfo).toBe(null)
    expect(typeof result.current.refreshAuthStatus).toBe('function')
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })

  it('로그인된 상태를 올바르게 반환한다', () => {
    const mockUserInfo = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'email' as const,
    }

    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      timeUntilExpiry: 3600,
      tokenExpiredAt: Date.now() + 3600000,
      userInfo: mockUserInfo,
      refreshAuthStatus: mockRefreshAuthStatus,
      login: mockLogin,
      logout: mockLogout,
    })

    const { result } = renderHook(() => useAuthStatus())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.timeUntilExpiry).toBe(3600)
    expect(result.current.userInfo).toEqual(mockUserInfo)
  })

  it('로딩 상태를 올바르게 반환한다', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      timeUntilExpiry: null,
      tokenExpiredAt: null,
      userInfo: null,
      refreshAuthStatus: mockRefreshAuthStatus,
      login: mockLogin,
      logout: mockLogout,
    })

    const { result } = renderHook(() => useAuthStatus())

    expect(result.current.isLoading).toBe(true)
  })

  it('refreshAuthStatus 함수를 호출할 수 있다', async () => {
    const { result } = renderHook(() => useAuthStatus())

    await act(async () => {
      await result.current.refreshAuthStatus()
    })

    expect(mockRefreshAuthStatus).toHaveBeenCalled()
  })

  it('login 함수를 호출할 수 있다', () => {
    const mockUserInfo = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'email' as const,
    }

    const { result } = renderHook(() => useAuthStatus())

    act(() => {
      result.current.login(mockUserInfo)
    })

    expect(mockLogin).toHaveBeenCalledWith(mockUserInfo)
  })

  it('logout 함수를 호출할 수 있다', () => {
    const { result } = renderHook(() => useAuthStatus())

    act(() => {
      result.current.logout()
    })

    expect(mockLogout).toHaveBeenCalled()
  })
})
