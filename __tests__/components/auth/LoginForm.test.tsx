import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: () => ({ data: null, status: 'unauthenticated' })
}))

const mockSignIn = jest.mocked(require('next-auth/react').signIn)

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
    mockSignIn.mockResolvedValue({ ok: true, error: null })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false
    })
  })

  it('prevents form submission with empty fields', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.click(submitButton)
    
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('prevents form submission with only email', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('prevents form submission with only password', async () => {
    const user = userEvent.setup()
    
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(mockSignIn).not.toHaveBeenCalled()
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

  it('displays error message when signIn fails', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument()
    })
  })

  it('has register link', () => {
    render(<LoginForm />)
    
    const registerLink = screen.getByRole('link', { name: /créer un compte/i })
    expect(registerLink).toBeInTheDocument()
    expect(registerLink).toHaveAttribute('href', '/auth/register')
  })

  it('submits form on Enter key press', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true, error: null })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.keyboard('{Enter}')
    
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false
    })
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