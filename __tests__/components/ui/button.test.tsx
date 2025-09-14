import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click me')
  })

  it('applies default variant classes', () => {
    render(<Button>Default Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('bg-primary text-primary-foreground')
  })

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('bg-destructive text-destructive-foreground')
  })

  it('applies outline variant classes', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('border border-input bg-background')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-9 px-3')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-11 px-8')

    rerender(<Button size="icon">🔥</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10 w-10')
  })

  it('handles click events correctly', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const handleClick = jest.fn()
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Button</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toHaveTextContent('Ref Button')
  })

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('custom-class')
  })

  it('accepts custom HTML attributes', () => {
    render(
      <Button type="submit" aria-label="Submit form" data-testid="submit-btn">
        Submit
      </Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('aria-label', 'Submit form')
    expect(button).toHaveAttribute('data-testid', 'submit-btn')
  })

  it('supports all variant types', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    
    variants.forEach(variant => {
      render(<Button variant={variant}>{variant}</Button>)
      const button = screen.getByRole('button', { name: variant })
      expect(button).toBeInTheDocument()
    })
  })

  it('supports all size types', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const
    
    sizes.forEach(size => {
      render(<Button size={size}>{size}</Button>)
      const button = screen.getByRole('button', { name: size })
      expect(button).toBeInTheDocument()
    })
  })
})