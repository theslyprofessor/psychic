import { Hono, Context, MiddlewareHandler } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import {
  PsychicAdapter,
  PsychicRequest,
  PsychicResponse,
  PsychicRouteHandler,
  PsychicMiddleware,
  PsychicErrorHandler,
  PsychicCookieOptions,
} from './types.js'

export class HonoAdapter implements PsychicAdapter {
  private app: Hono
  private responseMap = new WeakMap<Context, { statusCode: number; headers: Record<string, string> }>()

  constructor() {
    this.app = new Hono()
  }

  createApp(): Hono {
    return this.app
  }

  registerRoute(method: string, path: string, handler: PsychicRouteHandler): void {
    const honoHandler = async (c: Context) => {
      const psychicReq = await this.adaptRequest(c)
      const psychicRes = this.adaptResponse(c)
      await handler(psychicReq, psychicRes)
    }

    switch (method.toLowerCase()) {
      case 'get':
        this.app.get(path, honoHandler)
        break
      case 'post':
        this.app.post(path, honoHandler)
        break
      case 'put':
        this.app.put(path, honoHandler)
        break
      case 'patch':
        this.app.patch(path, honoHandler)
        break
      case 'delete':
        this.app.delete(path, honoHandler)
        break
      case 'options':
        this.app.options(path, honoHandler)
        break
      case 'head':
        // Hono doesn't have a head method, use get instead
        this.app.get(path, honoHandler)
        break
      default:
        throw new Error(`Unsupported HTTP method: ${method}`)
    }
  }

  use(pathOrHandler: string | PsychicMiddleware, handler?: PsychicMiddleware): void {
    if (typeof pathOrHandler === 'string' && handler) {
      // Path + middleware
      const honoMiddleware: MiddlewareHandler = async (c, next) => {
        const psychicReq = await this.adaptRequest(c)
        const psychicRes = this.adaptResponse(c)
        await handler(psychicReq, psychicRes, next)
      }
      this.app.use(pathOrHandler, honoMiddleware)
    } else if (typeof pathOrHandler === 'function') {
      // Just middleware
      const honoMiddleware: MiddlewareHandler = async (c, next) => {
        const psychicReq = await this.adaptRequest(c)
        const psychicRes = this.adaptResponse(c)
        await pathOrHandler(psychicReq, psychicRes, next)
      }
      this.app.use('*', honoMiddleware)
    }
  }

  useErrorHandler(handler: PsychicErrorHandler): void {
    this.app.onError(async (err, c) => {
      const psychicReq = await this.adaptRequest(c)
      const psychicRes = this.adaptResponse(c)
      const next = async () => {}
      await handler(err, psychicReq, psychicRes, next)
      
      // If handler didn't send response, return error
      if (!c.finalized) {
        return c.json({ error: err.message }, 500 as any)
      }
      return c.res
    })
  }

  async adaptRequest(c: Context): Promise<PsychicRequest> {
    const url = new URL(c.req.url)
    
    return {
      method: c.req.method,
      url: c.req.url,
      path: c.req.path,
      params: c.req.param() as Record<string, string>,
      query: Object.fromEntries(url.searchParams.entries()),
      body: await this.parseBody(c),
      headers: this.extractHeaders(c),
      cookies: this.extractCookies(c),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      get: (headerName: string) => c.req.header(headerName),
    }
  }

  private async parseBody(c: Context): Promise<any> {
    const contentType = c.req.header('content-type') || ''
    
    try {
      if (contentType.includes('application/json')) {
        return await c.req.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        return await c.req.parseBody()
      } else if (contentType.includes('multipart/form-data')) {
        return await c.req.parseBody()
      } else if (contentType.includes('text/')) {
        return await c.req.text()
      }
      return {}
    } catch {
      return {}
    }
  }

  private extractHeaders(c: Context): Record<string, string> {
    const headers: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value
    })
    return headers
  }

  private extractCookies(c: Context): Record<string, string> {
    const cookieHeader = c.req.header('cookie')
    if (!cookieHeader) return {}

    const cookies: Record<string, string> = {}
    cookieHeader.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        cookies[key] = decodeURIComponent(value)
      }
    })
    return cookies
  }

  adaptResponse(c: Context): PsychicResponse {
    // Initialize response state for this context
    if (!this.responseMap.has(c)) {
      this.responseMap.set(c, { statusCode: 200, headers: {} })
    }
    const state = this.responseMap.get(c)!

    const psychicRes: PsychicResponse = {
      _statusCode: state.statusCode,
      _headers: state.headers,
      _headersSent: false,

      get statusCode() {
        return state.statusCode
      },

      get headersSent() {
        return c.finalized || this._headersSent || false
      },

      status(code: number) {
        state.statusCode = code
        this._statusCode = code
        return this
      },

      json(data: any) {
        this._headersSent = true
        // Apply status code and headers
        Object.entries(state.headers).forEach(([key, value]) => {
          c.header(key, value)
        })
        return c.json(data, state.statusCode as any)
      },

      text(content: string) {
        this._headersSent = true
        Object.entries(state.headers).forEach(([key, value]) => {
          c.header(key, value)
        })
        return c.text(content, state.statusCode as any)
      },

      html(content: string) {
        this._headersSent = true
        Object.entries(state.headers).forEach(([key, value]) => {
          c.header(key, value)
        })
        return c.html(content, state.statusCode as any)
      },

      send(data: any) {
        this._headersSent = true
        Object.entries(state.headers).forEach(([key, value]) => {
          c.header(key, value)
        })
        
        if (typeof data === 'object') {
          return c.json(data, state.statusCode as any)
        }
        return c.text(String(data), state.statusCode as any)
      },

      redirect(url: string, code = 302) {
        this._headersSent = true
        return c.redirect(url, code as any)
      },

      header(key: string, value: string) {
        state.headers[key] = value
        this._headers![key] = value
        return this
      },

      setHeader(key: string, value: string) {
        state.headers[key] = value
        this._headers![key] = value
        return this
      },

      getHeader(key: string) {
        return state.headers[key]
      },

      cookie(name: string, value: string, options?: PsychicCookieOptions) {
        const cookieOpts: any = {}
        if (options?.maxAge !== undefined) cookieOpts.maxAge = options.maxAge
        if (options?.expires !== undefined) cookieOpts.expires = options.expires
        if (options?.httpOnly !== undefined) cookieOpts.httpOnly = options.httpOnly
        if (options?.path !== undefined) cookieOpts.path = options.path
        if (options?.domain !== undefined) cookieOpts.domain = options.domain
        if (options?.secure !== undefined) cookieOpts.secure = options.secure
        if (options?.sameSite !== undefined) cookieOpts.sameSite = options.sameSite
        
        setCookie(c, name, value, cookieOpts)
        return this
      },

      clearCookie(name: string, options?: PsychicCookieOptions) {
        const cookieOpts: any = {}
        if (options?.path !== undefined) cookieOpts.path = options.path
        if (options?.domain !== undefined) cookieOpts.domain = options.domain
        
        deleteCookie(c, name, cookieOpts)
        return this
      },
    }

    return psychicRes
  }

  listen(port: number, callback?: () => void): any {
    if (callback) callback()
    
    // Bun.serve for maximum performance
    if (typeof (globalThis as any).Bun !== 'undefined') {
      return (globalThis as any).Bun.serve({
        port,
        fetch: this.app.fetch,
      })
    }
    
    // Fallback to Node.js
    return require('node:http').createServer(this.app.fetch).listen(port)
  }

  getApp(): Hono {
    return this.app
  }
}
