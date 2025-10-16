// This file MUST be loaded FIRST before any other imports
// It sets up global objects required by webidl-conversions
// to prevent "Cannot read properties of undefined (reading 'get')" errors

// Use globalThis for Node.js 18.x/20.x compatibility
// @ts-expect-error - Mocking global objects for testing
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

// @ts-expect-error - Mocking global objects for testing
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

