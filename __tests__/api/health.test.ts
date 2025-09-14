/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http'
import { GET } from '../../app/api/health/route'

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  }
}))

// Get the mocked function for easier testing
import { prisma } from '../../lib/prisma'
const mockQueryRaw = jest.mocked(prisma.$queryRaw)

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env = { ...process.env, NODE_ENV: 'test' }
  })

  it('should return 200 and health status when database is connected', async () => {
    // Mock successful database query
    mockQueryRaw.mockResolvedValue([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      status: 'ok',
      database: 'connected',
      uptime: expect.any(Number),
      memory: {
        used: expect.any(Number),
        total: expect.any(Number),
      },
    })
    expect(data.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(mockQueryRaw).toHaveBeenCalledWith(['SELECT 1'])
  })

  it('should return 503 and error status when database fails', async () => {
    // Mock database connection failure
    const dbError = new Error('Database connection failed')
    mockQueryRaw.mockRejectedValue(dbError)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toMatchObject({
      status: 'error',
      database: 'disconnected',
      error: 'Database connection failed',
    })
    expect(data.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('should include environment information when available', async () => {
    process.env = { ...process.env, NODE_ENV: 'test', npm_package_version: '1.0.0' }
    
    mockQueryRaw.mockResolvedValue([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(data.environment).toBe('test')
    expect(data.version).toBe('1.0.0')
  })

  it('should handle unknown version gracefully', async () => {
    delete process.env.npm_package_version
    
    mockQueryRaw.mockResolvedValue([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(data.version).toBe('unknown')
  })

  it('should handle non-Error exceptions', async () => {
    // Mock non-Error exception
    mockQueryRaw.mockRejectedValue('String error')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('Unknown error')
  })

  it('should include memory usage statistics', async () => {
    mockQueryRaw.mockResolvedValue([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(data.memory).toMatchObject({
      used: expect.any(Number),
      total: expect.any(Number),
    })
    expect(data.memory.used).toBeGreaterThan(0)
    expect(data.memory.total).toBeGreaterThan(0)
    expect(data.memory.total).toBeGreaterThanOrEqual(data.memory.used)
  })

  it('should include uptime information', async () => {
    mockQueryRaw.mockResolvedValue([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(typeof data.uptime).toBe('number')
    expect(data.uptime).toBeGreaterThanOrEqual(0)
  })

  it('should have proper response headers for JSON', async () => {
    mockQueryRaw.mockResolvedValue([{ '1': 1 }])

    const response = await GET()

    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should return consistent timestamp format', async () => {
    mockQueryRaw.mockResolvedValue([{ '1': 1 }])

    const response = await GET()
    const data = await response.json()

    // Should be valid ISO 8601 format
    const timestampDate = new Date(data.timestamp)
    expect(timestampDate.toISOString()).toBe(data.timestamp)
  })
})