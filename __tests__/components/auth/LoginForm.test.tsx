import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'

// Mock the useAuth hook
const mockLogin = jest.fn()
const mockClearError = jest.fn()

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })
}))

// Mock ClientOnly component to render children immediately
jest.mock('@/components/ui/ClientOnly', () => ({
  ClientOnly: ({ children }: { children: React.ReactNode }) => children
}))

describe('LoginForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginForm />)
    
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByText(/accédez à votre espace chantierpro/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('handles form submission with valid credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(true)
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(mockClearError).toHaveBeenCalled()
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('prevents form submission with empty fields', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.click(submitButton)
    
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('prevents form submission with only email', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('prevents form submission with only password', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click to show password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click to hide password again
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('clears error when user types', async () => {
    const user = userEvent.setup()
    
    // Mock an error state
    jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials',
      clearError: mockClearError,
    })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    
    await user.type(emailInput, 'test@example.com')
    
    expect(mockClearError).toHaveBeenCalled()
  })

  it('disables form when loading', () => {
    // Mock loading state
    jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button')
    
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/connexion/i)
  })

  it('displays error message when present', () => {
    // Mock error state
    jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Identifiants invalides',
      clearError: mockClearError,
    })
    
    render(<LoginForm />)
    
    expect(screen.getByText('Identifiants invalides')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('has register link', () => {
    render(<LoginForm />)
    
    const registerLink = screen.getByRole('link', { name: /créer un compte/i })
    expect(registerLink).toBeInTheDocument()
    expect(registerLink).toHaveAttribute('href', '/auth/register')
  })

  it('submits form on Enter key press', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(true)
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.keyboard('{Enter}')
    
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('button is disabled when fields are empty', () => {
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    expect(submitButton).toBeDisabled()
  })

  it('button is enabled when both fields are filled', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    // Initially disabled
    expect(submitButton).toBeDisabled()
    
    // Fill both fields
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    // Should be enabled now
    expect(submitButton).not.toBeDisabled()
  })
})