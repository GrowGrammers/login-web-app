import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginForm from '../LoginForm'

// Mock child components
vi.mock('../EmailLogin', () => ({
  default: ({ onLoginSuccess }: { onLoginSuccess: () => void }) => (
    <div data-testid="email-login">
      <button onClick={onLoginSuccess}>Email Login</button>
    </div>
  ),
}))

vi.mock('../oauth/GoogleLogin', () => ({
  default: () => <div data-testid="google-login">Google Login</div>,
}))

describe('LoginForm', () => {
  const mockOnLoginSuccess = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본적으로 이메일 로그인을 렌더링한다', () => {
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)
    
    expect(screen.getByTestId('email-login')).toBeInTheDocument()
    expect(screen.queryByTestId('google-login')).not.toBeInTheDocument()
  })

  it('selectedMethod가 email일 때 이메일 로그인을 렌더링한다', () => {
    render(
      <LoginForm 
        onLoginSuccess={mockOnLoginSuccess} 
        selectedMethod="email" 
      />
    )
    
    expect(screen.getByTestId('email-login')).toBeInTheDocument()
    expect(screen.queryByTestId('google-login')).not.toBeInTheDocument()
  })

  it('selectedMethod가 social일 때 Google 로그인을 렌더링한다', () => {
    render(
      <LoginForm 
        onLoginSuccess={mockOnLoginSuccess} 
        selectedMethod="social" 
      />
    )
    
    expect(screen.getByTestId('google-login')).toBeInTheDocument()
    expect(screen.queryByTestId('email-login')).not.toBeInTheDocument()
  })

  it('selectedMethod가 phone일 때 이메일 로그인을 렌더링한다', () => {
    render(
      <LoginForm 
        onLoginSuccess={mockOnLoginSuccess} 
        selectedMethod="phone" 
      />
    )
    
    expect(screen.getByTestId('email-login')).toBeInTheDocument()
    expect(screen.queryByTestId('google-login')).not.toBeInTheDocument()
  })

  it('onBack이 제공되면 뒤로 가기 버튼을 렌더링한다', () => {
    render(
      <LoginForm 
        onLoginSuccess={mockOnLoginSuccess} 
        onBack={mockOnBack} 
      />
    )
    
    const backButton = screen.getByText('←')
    expect(backButton).toBeInTheDocument()
  })

  it('onBack이 제공되지 않으면 뒤로 가기 버튼을 렌더링하지 않는다', () => {
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)
    
    const backButton = screen.queryByText('←')
    expect(backButton).not.toBeInTheDocument()
  })

  it('뒤로 가기 버튼을 클릭하면 onBack을 호출한다', async () => {
    const userEvent = await import('@testing-library/user-event')
    const user = userEvent.userEvent.setup()
    
    render(
      <LoginForm 
        onLoginSuccess={mockOnLoginSuccess} 
        onBack={mockOnBack} 
      />
    )
    
    const backButton = screen.getByText('←')
    await user.click(backButton)
    
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('이메일 로그인에서 onLoginSuccess가 호출되면 부모에게 전달한다', async () => {
    const userEvent = await import('@testing-library/user-event')
    const user = userEvent.userEvent.setup()
    
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />)
    
    const emailLoginButton = screen.getByText('Email Login')
    await user.click(emailLoginButton)
    
    expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1)
  })
})
