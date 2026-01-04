/**
 * Framework-agnostic request/response types for Psychic
 * Allows Psychic to run on Express, Hono, Fastify, etc.
 */

export interface PsychicCookieOptions {
  maxAge?: number
  signed?: boolean
  expires?: Date
  httpOnly?: boolean
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: boolean | 'lax' | 'strict' | 'none'
}

export interface PsychicRequest {
  method: string
  url: string
  path: string
  params: Record<string, string>
  query: Record<string, any>
  body: any
  headers: Record<string, string>
  cookies: Record<string, string>
  ip: string
  protocol: string
  hostname: string
  
  // Additional methods that may be needed
  get(headerName: string): string | undefined
}

export interface PsychicResponse {
  // Status code
  status(code: number): this
  
  // Response methods
  json(data: any): void | Promise<void>
  text(content: string): void | Promise<void>
  html(content: string): void | Promise<void>
  send(data: any): void | Promise<void>
  redirect(url: string, code?: number): void | Promise<void>
  
  // Headers
  header(key: string, value: string): this
  setHeader(key: string, value: string): this
  getHeader(key: string): string | undefined
  
  // Cookies
  cookie(name: string, value: string, options?: PsychicCookieOptions): this
  clearCookie(name: string, options?: PsychicCookieOptions): this
  
  // Internal state tracking
  _statusCode?: number
  _headers?: Record<string, string>
  _headersSent?: boolean
  
  // Compatibility properties
  get statusCode(): number
  get headersSent(): boolean
}

export type PsychicRouteHandler = (
  req: PsychicRequest,
  res: PsychicResponse
) => void | Promise<void>

export type PsychicMiddleware = (
  req: PsychicRequest,
  res: PsychicResponse,
  next: () => void | Promise<void>
) => void | Promise<void>

export type PsychicErrorHandler = (
  err: Error,
  req: PsychicRequest,
  res: PsychicResponse,
  next: () => void | Promise<void>
) => void | Promise<void>

export interface PsychicAdapter {
  /**
   * Creates the underlying HTTP framework app
   */
  createApp(): any
  
  /**
   * Register a route with the framework
   */
  registerRoute(method: string, path: string, handler: PsychicRouteHandler): void
  
  /**
   * Register middleware
   */
  use(pathOrHandler: string | PsychicMiddleware, handler?: PsychicMiddleware): void
  
  /**
   * Register error handler
   */
  useErrorHandler(handler: PsychicErrorHandler): void
  
  /**
   * Convert native framework request to PsychicRequest
   */
  adaptRequest(nativeReq: any): PsychicRequest | Promise<PsychicRequest>
  
  /**
   * Convert native framework response to PsychicResponse
   */
  adaptResponse(nativeRes: any, nativeReq?: any): PsychicResponse
  
  /**
   * Start the HTTP server
   */
  listen(port: number, callback?: () => void): any
  
  /**
   * Get the underlying framework app
   */
  getApp(): any
}

export type FrameworkType = 'express' | 'hono'
