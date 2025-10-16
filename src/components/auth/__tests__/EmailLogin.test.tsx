import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmailLogin from '../EmailLogin'

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('../../../utils/emailValidationUtils')
vi.mock('../../../auth/authManager')
vi.mock('../../../stores/authStore')

describe('EmailLogin - Simple Tests', () => {
  const mockOnLoginSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본적으로 이메일 입력 단계를 렌더링한다', () => {
    render(<EmailLogin onLoginSuccess={mockOnLoginSuccess} />)
    
    expect(screen.getByText('이메일로 계속하기')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('이메일 주소')).toBeInTheDocument()
    expect(screen.getByText('인증번호 받기')).toBeInTheDocument()
  })

  it('연동 모드일 때 올바른 텍스트를 표시한다', () => {
    render(<EmailLogin onLoginSuccess={mockOnLoginSuccess} isLinkMode={true} />)
    
    expect(screen.getByText('이메일 연동하기')).toBeInTheDocument()
    expect(screen.getByText('이메일로 로그인 방식을 연동하세요')).toBeInTheDocument()
  })

  it('이메일 입력 필드가 올바르게 렌더링된다', () => {
    render(<EmailLogin onLoginSuccess={mockOnLoginSuccess} />)
    
    const emailInput = screen.getByPlaceholderText('이메일 주소')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('name', 'email')
  })

  it('인증번호 받기 버튼이 올바르게 렌더링된다', () => {
    render(<EmailLogin onLoginSuccess={mockOnLoginSuccess} />)
    
    const requestButton = screen.getByText('인증번호 받기')
    expect(requestButton).toBeInTheDocument()
    expect(requestButton.tagName).toBe('BUTTON')
  })
})
