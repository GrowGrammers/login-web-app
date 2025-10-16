import '@testing-library/jest-dom'
import { vi } from 'vitest'


// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock fetch
window.fetch = vi.fn()

// Mock console methods to reduce noise in tests
window.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock window.alert
window.alert = vi.fn()

// Mock URL constructor for webidl-conversions
global.URL = class URL {
  constructor(url: string, base?: string) {
    // Simple URL mock
    this.href = url
    this.origin = 'http://localhost:3000'
    this.protocol = 'http:'
    this.host = 'localhost:3000'
    this.hostname = 'localhost'
    this.port = '3000'
    this.pathname = '/'
    this.search = ''
    this.hash = ''
  }
  
  href: string
  origin: string
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  
  toString() {
    return this.href
  }
} as any
