// Mock URL and URLSearchParams BEFORE any imports that might use them
// This prevents webidl-conversions errors in GitHub Actions
// Use globalThis for Node.js 18.x/20.x compatibility
if (typeof globalThis !== 'undefined') {
  // @ts-expect-error - Mocking global objects
  globalThis.URL = class URL {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(url: string, _base?: string) {
      this.href = url
      this.origin = 'http://localhost:5173'
      this.protocol = 'http:'
      this.host = 'localhost:5173'
      this.hostname = 'localhost'
      this.port = '5173'
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
  }

  // @ts-expect-error - Mocking global objects
  globalThis.URLSearchParams = class URLSearchParams {
    private params: Map<string, string> = new Map()
    constructor(init?: string | URLSearchParams | Record<string, string> | string[][]) {
      if (init && typeof init === 'string') {
        const pairs = init.split('&')
        for (const pair of pairs) {
          const [key, value] = pair.split('=')
          if (key) {
            this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''))
          }
        }
      }
    }
    get(name: string): string | null {
      return this.params.get(name) || null
    }
    set(name: string, value: string): void {
      this.params.set(name, value)
    }
    has(name: string): boolean {
      return this.params.has(name)
    }
    delete(name: string): void {
      this.params.delete(name)
    }
    toString(): string {
      const pairs: string[] = []
      for (const [key, value] of this.params) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
      return pairs.join('&')
    }
  }
}

import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'


// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5173',
    origin: 'http://localhost:5173',
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

// Add additional URL mock methods
if (typeof globalThis.URL !== 'undefined') {
  globalThis.URL.createObjectURL = vi.fn(() => 'mock-object-url')
  globalThis.URL.revokeObjectURL = vi.fn()
}

// Clean up after each test
afterEach(() => {
  cleanup()
})
