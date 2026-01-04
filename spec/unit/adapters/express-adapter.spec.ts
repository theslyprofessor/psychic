import { describe, it, expect, beforeEach } from 'vitest'
import { ExpressAdapter } from '../../../src/adapters/express-adapter.js'
import type { PsychicRequest, PsychicResponse } from '../../../src/adapters/types.js'

describe('ExpressAdapter', () => {
  let adapter: ExpressAdapter

  beforeEach(() => {
    adapter = new ExpressAdapter()
  })

  describe('createApp', () => {
    it('should create an Express application', () => {
      const app = adapter.createApp()
      expect(app).toBeDefined()
      expect(typeof app.use).toBe('function')
      expect(typeof app.get).toBe('function')
      expect(typeof app.post).toBe('function')
    })
  })

  describe('getApp', () => {
    it('should return the Express app instance', () => {
      const app1 = adapter.createApp()
      const app2 = adapter.getApp()
      expect(app1).toBe(app2)
    })
  })

  describe('registerRoute', () => {
    it('should register a GET route', async () => {
      let handlerCalled = false
      const handler = async (req: PsychicRequest, res: PsychicResponse) => {
        handlerCalled = true
        res.json({ success: true })
      }

      adapter.registerRoute('GET', '/test', handler)
      expect(handlerCalled).toBe(false) // Handler not called yet
    })

    it('should register POST, PUT, PATCH, DELETE routes', () => {
      const handler = async (req: PsychicRequest, res: PsychicResponse) => {
        res.json({ success: true })
      }

      expect(() => adapter.registerRoute('POST', '/test', handler)).not.toThrow()
      expect(() => adapter.registerRoute('PUT', '/test', handler)).not.toThrow()
      expect(() => adapter.registerRoute('PATCH', '/test', handler)).not.toThrow()
      expect(() => adapter.registerRoute('DELETE', '/test', handler)).not.toThrow()
    })

    it('should throw error for unsupported HTTP method', () => {
      const handler = async (req: PsychicRequest, res: PsychicResponse) => {
        res.json({ success: true })
      }

      expect(() => adapter.registerRoute('INVALID', '/test', handler)).toThrow('Unsupported HTTP method')
    })
  })

  describe('use', () => {
    it('should register middleware without path', () => {
      const middleware = async (req: PsychicRequest, res: PsychicResponse, next: () => void) => {
        next()
      }

      expect(() => adapter.use(middleware)).not.toThrow()
    })

    it('should register middleware with path', () => {
      const middleware = async (req: PsychicRequest, res: PsychicResponse, next: () => void) => {
        next()
      }

      expect(() => adapter.use('/api', middleware)).not.toThrow()
    })
  })

  describe('adaptRequest', () => {
    it('should convert Express Request to PsychicRequest', () => {
      // Mock Express request
      const mockExpressReq: any = {
        method: 'GET',
        url: '/test?foo=bar',
        path: '/test',
        params: { id: '123' },
        query: { foo: 'bar' },
        body: { data: 'test' },
        headers: { 'content-type': 'application/json' },
        cookies: { session: 'abc123' },
        ip: '127.0.0.1',
        protocol: 'http',
        hostname: 'localhost',
        get: (header: string) => mockExpressReq.headers[header],
      }

      const psychicReq = adapter.adaptRequest(mockExpressReq)

      expect(psychicReq.method).toBe('GET')
      expect(psychicReq.url).toBe('/test?foo=bar')
      expect(psychicReq.path).toBe('/test')
      expect(psychicReq.params).toEqual({ id: '123' })
      expect(psychicReq.query).toEqual({ foo: 'bar' })
      expect(psychicReq.body).toEqual({ data: 'test' })
      expect(psychicReq.ip).toBe('127.0.0.1')
      expect(psychicReq.protocol).toBe('http')
      expect(psychicReq.hostname).toBe('localhost')
      expect(psychicReq.get('content-type')).toBe('application/json')
    })
  })

  describe('adaptResponse', () => {
    it('should convert Express Response to PsychicResponse', () => {
      // Mock Express response
      const mockExpressRes: any = {
        statusCode: 200,
        headersSent: false,
        status: function (code: number) {
          this.statusCode = code
          return this
        },
        json: function (data: any) {
          this.headersSent = true
        },
        send: function (data: any) {
          this.headersSent = true
        },
        setHeader: function (key: string, value: string) {},
        getHeader: function (key: string) {
          return undefined
        },
        cookie: function (name: string, value: string, options?: any) {
          return this
        },
        clearCookie: function (name: string, options?: any) {
          return this
        },
      }

      const psychicRes = adapter.adaptResponse(mockExpressRes)

      expect(psychicRes.statusCode).toBe(200)
      expect(psychicRes.headersSent).toBe(false)
      expect(typeof psychicRes.status).toBe('function')
      expect(typeof psychicRes.json).toBe('function')
      expect(typeof psychicRes.send).toBe('function')
    })

    it('should allow chaining response methods', () => {
      const mockExpressRes: any = {
        statusCode: 200,
        headersSent: false,
        status: function (code: number) {
          this.statusCode = code
          return this
        },
        setHeader: function (key: string, value: string) {
          return this
        },
        json: function (data: any) {
          this.headersSent = true
        },
      }

      const psychicRes = adapter.adaptResponse(mockExpressRes)

      const result = psychicRes.status(201).header('X-Custom', 'value')
      expect(result).toBe(psychicRes) // Should return itself for chaining
    })
  })

  describe('listen', () => {
    it('should return a server instance', () => {
      const server = adapter.listen(0) // Port 0 = random available port
      expect(server).toBeDefined()
      expect(typeof server.close).toBe('function')
      server.close() // Clean up
    })

    it('should call callback when server starts', async () => {
      return new Promise<void>((resolve) => {
        const server = adapter.listen(0, () => {
          expect(true).toBe(true)
          server.close()
          resolve()
        })
      })
    })
  })
})
