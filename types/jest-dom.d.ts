import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveStyle(style: object | string): R;
      toHaveClass(className: string): R;
      toBeVisible(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeEmptyDOMElement(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveValue(value: string | number | string[]): R;
    }
  }
}