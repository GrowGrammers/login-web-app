import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  token: null,
  login: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
  setToken: vi.fn(),
}

// Mock zustand store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
  }
})

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options })

// Mock API responses
export const mockApiResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

// Mock fetch with default success response
export const mockFetch = (response: unknown, status = 200) => {
  window.fetch = vi.fn(() =>
    Promise.resolve(mockApiResponse(response, status))
  ) as unknown as typeof window.fetch
}

// Mock fetch with error response
export const mockFetchError = (message = 'Network error') => {
  window.fetch = vi.fn(() => Promise.reject(new Error(message))) as unknown as typeof window.fetch
}

// Reset all mocks
export const resetMocks = () => {
  vi.clearAllMocks()
  mockAuthStore.isAuthenticated = false
  mockAuthStore.user = null
  mockAuthStore.token = null
}

// Export everything
export * from '@testing-library/react'
export { customRender as render }
export { mockAuthStore }
