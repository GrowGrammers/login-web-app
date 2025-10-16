import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getExpirationFromJWT, isJWTExpired, getTimeUntilExpiryFromJWT } from '../jwtUtils'
import { jwtDecode } from 'jwt-decode'

// Mock jwt-decode
vi.mock('jwt-decode')

const mockJwtDecode = vi.mocked(jwtDecode)

describe('jwtUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getExpirationFromJWT', () => {
    it('유효한 JWT 토큰에서 만료 시간을 추출한다', () => {
      const mockToken = 'valid.jwt.token'
      const mockExp = 1640995200 // 2022-01-01 00:00:00 UTC
      
      mockJwtDecode.mockReturnValue({ exp: mockExp })

      const result = getExpirationFromJWT(mockToken)

      expect(result).toBe(mockExp * 1000) // 밀리초로 변환된 값
      expect(mockJwtDecode).toHaveBeenCalledWith(mockToken)
    })

    it('exp 필드가 없는 JWT 토큰에서 null을 반환한다', () => {
      const mockToken = 'valid.jwt.token'
      
      mockJwtDecode.mockReturnValue({})

      const result = getExpirationFromJWT(mockToken)

      expect(result).toBeNull()
    })

    it('exp 필드가 undefined인 JWT 토큰에서 null을 반환한다', () => {
      const mockToken = 'valid.jwt.token'
      
      mockJwtDecode.mockReturnValue({ exp: undefined })

      const result = getExpirationFromJWT(mockToken)

      expect(result).toBeNull()
    })

    it('잘못된 JWT 토큰에서 null을 반환하고 에러를 로그한다', () => {
      const mockToken = 'invalid.jwt.token'
      const mockError = new Error('Invalid token')
      
      mockJwtDecode.mockImplementation(() => {
        throw mockError
      })

      const result = getExpirationFromJWT(mockToken)

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith('❌ JWT 파싱 실패:', mockError)
    })
  })

  describe('isJWTExpired', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2022-01-01T00:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('만료된 JWT 토큰을 올바르게 감지한다', () => {
      const mockToken = 'expired.jwt.token'
      const expiredTime = 1640995199 // 2021-12-31 23:59:59 UTC (1초 전)
      
      mockJwtDecode.mockReturnValue({ exp: expiredTime })

      const result = isJWTExpired(mockToken)

      expect(result).toBe(true)
    })

    it('유효한 JWT 토큰을 올바르게 감지한다', () => {
      const mockToken = 'valid.jwt.token'
      const validTime = 1640995201 // 2022-01-01 00:00:01 UTC (1초 후)
      
      mockJwtDecode.mockReturnValue({ exp: validTime })

      const result = isJWTExpired(mockToken)

      expect(result).toBe(false)
    })

    it('JWT 파싱 실패 시 null을 반환한다', () => {
      const mockToken = 'invalid.jwt.token'
      
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = isJWTExpired(mockToken)

      expect(result).toBeNull()
    })

    it('exp 필드가 없는 JWT에서 null을 반환한다', () => {
      const mockToken = 'no.exp.jwt.token'
      
      mockJwtDecode.mockReturnValue({})

      const result = isJWTExpired(mockToken)

      expect(result).toBeNull()
    })
  })

  describe('getTimeUntilExpiryFromJWT', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2022-01-01T00:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('유효한 JWT 토큰에서 남은 시간을 올바르게 계산한다', () => {
      const mockToken = 'valid.jwt.token'
      const expiryTime = 1640995260 // 2022-01-01 00:01:00 UTC (1분 후)
      
      mockJwtDecode.mockReturnValue({ exp: expiryTime })

      const result = getTimeUntilExpiryFromJWT(mockToken)

      expect(result).toBe(1) // 1분
    })

    it('만료된 JWT 토큰에서 0을 반환한다', () => {
      const mockToken = 'expired.jwt.token'
      const expiredTime = 1640995199 // 2021-12-31 23:59:59 UTC (1초 전)
      
      mockJwtDecode.mockReturnValue({ exp: expiredTime })

      const result = getTimeUntilExpiryFromJWT(mockToken)

      expect(result).toBe(0)
    })

    it('JWT 파싱 실패 시 null을 반환한다', () => {
      const mockToken = 'invalid.jwt.token'
      
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = getTimeUntilExpiryFromJWT(mockToken)

      expect(result).toBeNull()
    })

    it('exp 필드가 없는 JWT에서 null을 반환한다', () => {
      const mockToken = 'no.exp.jwt.token'
      
      mockJwtDecode.mockReturnValue({})

      const result = getTimeUntilExpiryFromJWT(mockToken)

      expect(result).toBeNull()
    })

    it('30분 후 만료되는 JWT에서 올바른 시간을 반환한다', () => {
      const mockToken = 'valid.jwt.token'
      const expiryTime = 1640997000 // 2022-01-01 00:30:00 UTC (30분 후)
      
      mockJwtDecode.mockReturnValue({ exp: expiryTime })

      const result = getTimeUntilExpiryFromJWT(mockToken)

      expect(result).toBe(30) // 30분
    })
  })
})
