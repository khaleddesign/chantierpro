import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    
    expect(input).toBeInTheDocument()
    // Default type is text, but HTML may not explicitly set the attribute
    expect(input).toBeInstanceOf(HTMLInputElement)
  })

  it('accepts different input types', () => {
    render(<Input type="email" data-testid="email-input" />)
    const input = screen.getByTestId('email-input')
    
    expect(input).toHaveAttribute('type', 'email')
  })

  it('handles value changes correctly', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
    expect(handleChange).toHaveBeenCalledTimes(11) // 11 characters
  })

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />)
    const input = screen.getByPlaceholderText('Disabled input')
    
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} value="Ref test" readOnly />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.value).toBe('Ref test')
  })

  it('accepts custom className', () => {
    render(<Input className="custom-class" data-testid="custom-input" />)
    const input = screen.getByTestId('custom-input')
    
    expect(input).toHaveClass('custom-class')
    // Should also have base classes
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md')
  })

  it('handles controlled input correctly', async () => {
    const user = userEvent.setup()
    let value = ''
    const setValue = (newValue: string) => { value = newValue }
    
    const ControlledInput = () => (
      <Input 
        value={value} 
        onChange={(e) => setValue(e.target.value)}
        data-testid="controlled-input"
      />
    )
    
    const { rerender } = render(<ControlledInput />)
    const input = screen.getByTestId('controlled-input') as HTMLInputElement
    
    expect(input.value).toBe('')
    
    // Simulate typing
    await user.type(input, 'test')
    
    // Rerender with new value
    setValue('test')
    rerender(<ControlledInput />)
    
    expect(input.value).toBe('test')
  })

  it('supports various input types', () => {
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url'] as const
    
    inputTypes.forEach(type => {
      render(<Input type={type} data-testid={`${type}-input`} />)
      const input = screen.getByTestId(`${type}-input`)
      expect(input).toHaveAttribute('type', type)
    })
  })

  it('accepts standard HTML input attributes', () => {
    render(
      <Input
        placeholder="Test placeholder"
        maxLength={10}
        minLength={2}
        required
        autoFocus
        data-testid="attributed-input"
      />
    )
    
    const input = screen.getByTestId('attributed-input')
    
    expect(input).toHaveAttribute('placeholder', 'Test placeholder')
    expect(input).toHaveAttribute('maxlength', '10')
    expect(input).toHaveAttribute('minlength', '2')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveFocus()
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(
      <Input 
        onFocus={handleFocus} 
        onBlur={handleBlur}
        data-testid="focus-input"
      />
    )
    
    const input = screen.getByTestId('focus-input')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('renders with proper accessibility attributes', () => {
    render(
      <Input 
        aria-label="Username input"
        aria-describedby="username-help"
        aria-required="true"
        data-testid="a11y-input"
      />
    )
    
    const input = screen.getByTestId('a11y-input')
    
    expect(input).toHaveAttribute('aria-label', 'Username input')
    expect(input).toHaveAttribute('aria-describedby', 'username-help')
    expect(input).toHaveAttribute('aria-required', 'true')
  })
})