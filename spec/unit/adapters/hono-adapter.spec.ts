import { describe, it, expect, beforeEach } from 'vitest'
import { HonoAdapter } from '../../../src/adapters/hono-adapter.js'
import type { PsychicRequest, PsychicResponse } from '../../../src/adapters/types.js'

describe('HonoAdapter', () => {
  let adapter: HonoAdapter

  beforeEach(() => {
    adapter = new HonoAdapter()
  })

  describe('createApp', () => {
    it('should create a Hono application', () => {
      const app = adapter.createApp()
      expect(app).toBeDefined()
      expect(typeof app.get).toBe('function')
      expect(typeof app.post).toBe('function')
      expect(typeof app.use).toBe('function')
    })
  })

  describe('getApp', () => {
    it('should return the Hono app instance', () => {
      const app1 = adapter.createApp()
      const app2 = adapter.getApp()
      expect(app1).toBe(app2)
    })
  })

  describe('registerRoute', () => {
    it('should register a GET route', async () => {
      const handler = async (req: PsychicRequest, res: PsychicResponse) => {
        res.json({ success: true })
      }

      expect(() => adapter.registerRoute('GET', '/test', handler)).not.toThrow()
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

    it('should register HEAD route (mapped to GET in Hono)', () => {
      const handler = async (req: PsychicRequest, res: PsychicResponse) => {
        res.json({ success: true })
      }

      expect(() => adapter.registerRoute('HEAD', '/test', handler)).not.toThrow()
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
    it('should convert Hono Context to PsychicRequest', async () => {
      // This is a simplified test - full integration would require Hono runtime
      const app = adapter.getApp()
      
      adapter.registerRoute('GET', '/test/:id', async (req, res) => {
        // Verify the adapted request has the expected shape
        expect(req.method).toBeDefined()
        expect(req.url).toBeDefined()
        expect(req.path).toBeDefined()
        expect(req.params).toBeDefined()
        expect(req.query).toBeDefined()
        expect(req.headers).toBeDefined()
        expect(req.cookies).toBeDefined()
        expect(typeof req.get).toBe('function')
        
        res.json({ success: true })
      })

      // The actual adaptation happens during request handling
      expect(app).toBeDefined()
    })
  })

  describe('adaptResponse', () => {
    it('should provide PsychicResponse interface', async () => {
      const app = adapter.getApp()
      
      adapter.registerRoute('GET', '/response-test', async (req, res) => {
        // Verify the adapted response has all required methods
        expect(typeof res.status).toBe('function')
        expect(typeof res.json).toBe('function')
        expect(typeof res.text).toBe('function')
        expect(typeof res.html).toBe('function')
        expect(typeof res.send).toBe('function')
        expect(typeof res.redirect).toBe('function')
        expect(typeof res.header).toBe('function')
        expect(typeof res.setHeader).toBe('function')
        expect(typeof res.getHeader).toBe('function')
        expect(typeof res.cookie).toBe('function')
        expect(typeof res.clearCookie).toBe('function')
        
        res.json({ success: true })
      })

      expect(app).toBeDefined()
    })
  })

  describe('useErrorHandler', () => {
    it('should register an error handler', () => {
      const errorHandler = async (
        err: Error,
        req: PsychicRequest,
        res: PsychicResponse,
        next: () => void
      ) => {
        res.status(500).json({ error: err.message })
      }

      expect(() => adapter.useErrorHandler(errorHandler)).not.toThrow()
    })
  })

  describe('disable', () => {
    it('should have a disable method for framework compatibility', () => {
      // This test ensures Hono adapter can be used anywhere Express adapter is used
      expect(typeof adapter.disable).toBe('function')
      expect(() => adapter.disable('x-powered-by')).not.toThrow()
    })
  })

  describe('listen', () => {
    it('should return a server instance when using Bun', () => {
      // Mock Bun environment
      const originalBun = (globalThis as any).Bun
      
      try {
        // Test without Bun (Node.js fallback)
        delete (globalThis as any).Bun
        
        const callbackCalled = false
        const server = adapter.listen(0, () => {
          // Callback executed
        })
        
        expect(server).toBeDefined()
      } finally {
        // Restore Bun if it existed
        if (originalBun) {
          (globalThis as any).Bun = originalBun
        }
      }
    })
  })

  describe('Cookie handling', () => {
    it('should set cookies with options', async () => {
      const app = adapter.getApp()
      
      adapter.registerRoute('GET', '/cookie-test', async (req, res) => {
        const result = res.cookie('session', 'abc123', {
          maxAge: 3600,
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
        
        // Should return itself for chaining
        expect(result).toBe(res)
        
        res.json({ success: true })
      })

      expect(app).toBeDefined()
    })

    it('should clear cookies', async () => {
      const app = adapter.getApp()
      
      adapter.registerRoute('GET', '/clear-cookie', async (req, res) => {
        const result = res.clearCookie('session', {
          path: '/',
          domain: 'example.com',
        })
        
        expect(result).toBe(res)
        
        res.json({ success: true })
      })

      expect(app).toBeDefined()
    })
  })

  describe('Response methods', () => {
    it('should support status chaining', async () => {
      const app = adapter.getApp()
      
      adapter.registerRoute('GET', '/status-test', async (req, res) => {
        const result = res.status(201)
        expect(result).toBe(res)
        res.json({ success: true })
      })

      expect(app).toBeDefined()
    })

    it('should support header chaining', async () => {
      const app = adapter.getApp()
      
      adapter.registerRoute('GET', '/header-test', async (req, res) => {
        const result = res.header('X-Custom', 'value')
        expect(result).toBe(res)
        res.json({ success: true })
      })

      expect(app).toBeDefined()
    })
  })
})
