import express, { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express'
import {
  PsychicAdapter,
  PsychicRequest,
  PsychicResponse,
  PsychicRouteHandler,
  PsychicMiddleware,
  PsychicErrorHandler,
  PsychicCookieOptions,
} from './types.js'

export class ExpressAdapter implements PsychicAdapter {
  private app: express.Application

  constructor() {
    this.app = express()
  }

  createApp(): express.Application {
    return this.app
  }

  registerRoute(method: string, path: string, handler: PsychicRouteHandler): void {
    const expressHandler: RequestHandler = async (req: Request, res: Response) => {
      const psychicReq = this.adaptRequest(req)
      const psychicRes = this.adaptResponse(res, req)
      await handler(psychicReq, psychicRes)
    }

    switch (method.toLowerCase()) {
      case 'get':
        this.app.get(path, expressHandler)
        break
      case 'post':
        this.app.post(path, expressHandler)
        break
      case 'put':
        this.app.put(path, expressHandler)
        break
      case 'patch':
        this.app.patch(path, expressHandler)
        break
      case 'delete':
        this.app.delete(path, expressHandler)
        break
      case 'options':
        this.app.options(path, expressHandler)
        break
      case 'head':
        this.app.head(path, expressHandler)
        break
      default:
        throw new Error(`Unsupported HTTP method: ${method}`)
    }
  }

  use(pathOrHandler: string | PsychicMiddleware, handler?: PsychicMiddleware): void {
    if (typeof pathOrHandler === 'string' && handler) {
      // Path + middleware
      const expressHandler: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
        const psychicReq = this.adaptRequest(req)
        const psychicRes = this.adaptResponse(res, req)
        handler(psychicReq, psychicRes, next)
      }
      this.app.use(pathOrHandler, expressHandler)
    } else if (typeof pathOrHandler === 'function') {
      // Just middleware
      const expressHandler: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
        const psychicReq = this.adaptRequest(req)
        const psychicRes = this.adaptResponse(res, req)
        pathOrHandler(psychicReq, psychicRes, next)
      }
      this.app.use(expressHandler)
    }
  }

  useErrorHandler(handler: PsychicErrorHandler): void {
    const expressErrorHandler: ErrorRequestHandler = (
      err: Error,
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const psychicReq = this.adaptRequest(req)
      const psychicRes = this.adaptResponse(res, req)
      handler(err, psychicReq, psychicRes, next)
    }
    this.app.use(expressErrorHandler)
  }

  adaptRequest(req: Request): PsychicRequest {
    return {
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      body: req.body,
      headers: req.headers as Record<string, string>,
      cookies: req.cookies || {},
      ip: req.ip || '',
      protocol: req.protocol,
      hostname: req.hostname,
      get: (headerName: string) => req.get(headerName),
    }
  }

  adaptResponse(res: Response, req?: Request): PsychicResponse {
    const psychicRes: PsychicResponse = {
      _statusCode: 200,
      _headers: {},
      _headersSent: false,

      get statusCode() {
        return res.statusCode || this._statusCode || 200
      },

      get headersSent() {
        return res.headersSent || this._headersSent || false
      },

      status(code: number) {
        this._statusCode = code
        res.status(code)
        return this
      },

      json(data: any) {
        this._headersSent = true
        res.json(data)
      },

      text(content: string) {
        this._headersSent = true
        res.send(content)
      },

      html(content: string) {
        this._headersSent = true
        res.setHeader('Content-Type', 'text/html')
        res.send(content)
      },

      send(data: any) {
        this._headersSent = true
        res.send(data)
      },

      redirect(url: string, code = 302) {
        this._headersSent = true
        res.redirect(code, url)
      },

      header(key: string, value: string) {
        this._headers![key] = value
        res.setHeader(key, value)
        return this
      },

      setHeader(key: string, value: string) {
        this._headers![key] = value
        res.setHeader(key, value)
        return this
      },

      getHeader(key: string) {
        const value = res.getHeader(key)
        return Array.isArray(value) ? value[0] : value?.toString()
      },

      cookie(name: string, value: string, options?: PsychicCookieOptions) {
        res.cookie(name, value, options)
        return this
      },

      clearCookie(name: string, options?: PsychicCookieOptions) {
        res.clearCookie(name, options)
        return this
      },
    }

    return psychicRes
  }

  listen(port: number, callback?: () => void): any {
    return this.app.listen(port, callback)
  }

  getApp(): express.Application {
    return this.app
  }
}
