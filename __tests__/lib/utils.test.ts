import { cn, getClientIp } from '@/lib/utils'
import { NextRequest } from 'next/server'

describe('lib/utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-blue-500', 'text-white', 'hover:bg-blue-600')
      expect(result).toBe('bg-blue-500 text-white hover:bg-blue-600')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'active', false && 'inactive')
      expect(result).toBe('base-class active')
    })

    it('should handle Tailwind class conflicts', () => {
      const result = cn('bg-blue-500', 'bg-red-500') // Should keep the last one
      expect(result).toBe('bg-red-500')
    })

    it('should handle empty inputs', () => {
      const result = cn('', null, undefined)
      expect(result).toBe('')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['bg-blue-500', 'text-white'], 'hover:bg-blue-600')
      expect(result).toBe('bg-blue-500 text-white hover:bg-blue-600')
    })
  })

  describe('getClientIp function', () => {
    const createMockRequest = (headers: Record<string, string>) => {
      return {
        headers: {
          get: (key: string) => headers[key] || null
        }
      } as NextRequest
    }

    it('should prioritize cf-connecting-ip header', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '1.2.3.4',
        'x-real-ip': '5.6.7.8',
        'x-forwarded-for': '9.10.11.12'
      })
      expect(getClientIp(request)).toBe('1.2.3.4')
    })

    it('should use x-real-ip when cf-connecting-ip is not available', () => {
      const request = createMockRequest({
        'x-real-ip': '5.6.7.8',
        'x-forwarded-for': '9.10.11.12'
      })
      expect(getClientIp(request)).toBe('5.6.7.8')
    })

    it('should use first IP from x-forwarded-for when others are not available', () => {
      const request = createMockRequest({
        'x-forwarded-for': '9.10.11.12, 13.14.15.16, 17.18.19.20'
      })
      expect(getClientIp(request)).toBe('9.10.11.12')
    })

    it('should trim whitespace from x-forwarded-for IP', () => {
      const request = createMockRequest({
        'x-forwarded-for': ' 9.10.11.12 , 13.14.15.16'
      })
      expect(getClientIp(request)).toBe('9.10.11.12')
    })

    it('should return default IP when no headers are present', () => {
      const request = createMockRequest({})
      expect(getClientIp(request)).toBe('127.0.0.1')
    })
  })
})