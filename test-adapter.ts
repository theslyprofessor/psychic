#!/usr/bin/env npx tsx
/**
 * Minimal adapter test script
 * 
 * Tests that both Express and Hono adapters work for basic HTTP operations.
 * Does NOT require a database.
 * 
 * Usage:
 *   npx tsx test-adapter.ts express
 *   npx tsx test-adapter.ts hono
 */

import { ExpressAdapter } from './src/adapters/express-adapter.js'
import { HonoAdapter } from './src/adapters/hono-adapter.js'
import type { PsychicAdapter } from './src/adapters/types.js'

const framework = process.argv[2] || 'express'
const port = 7788

async function main() {
  console.log(`\nTesting ${framework.toUpperCase()} adapter...\n`)
  
  let adapter: PsychicAdapter
  
  if (framework === 'hono') {
    adapter = new HonoAdapter()
  } else {
    adapter = new ExpressAdapter()
  }
  
  // Create app
  adapter.createApp()
  
  // Register test routes
  adapter.registerRoute('GET', '/ping', async (req, res) => {
    res.json({ pong: true, framework })
  })
  
  adapter.registerRoute('GET', '/echo/:message', async (req, res) => {
    res.json({ 
      message: req.params.message,
      query: req.query,
      method: req.method,
      path: req.path,
    })
  })
  
  adapter.registerRoute('POST', '/data', async (req, res) => {
    res.status(201).json({ 
      received: req.body,
      framework,
    })
  })
  
  adapter.registerRoute('GET', '/headers', async (req, res) => {
    res.header('X-Custom-Header', 'test-value')
    res.json({ headers: req.headers })
  })
  
  adapter.registerRoute('GET', '/status/:code', async (req, res) => {
    const code = parseInt(req.params.code) || 200
    res.status(code).json({ status: code })
  })
  
  // Start server
  const server = adapter.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
    console.log(`Framework: ${framework}`)
    console.log('')
    console.log('Test endpoints:')
    console.log(`  GET  http://localhost:${port}/ping`)
    console.log(`  GET  http://localhost:${port}/echo/hello?foo=bar`)
    console.log(`  POST http://localhost:${port}/data`)
    console.log(`  GET  http://localhost:${port}/headers`)
    console.log(`  GET  http://localhost:${port}/status/201`)
    console.log('')
    console.log('Press Ctrl+C to stop')
  })
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...')
    if (server && typeof server.close === 'function') {
      server.close()
    } else if (server && typeof server.stop === 'function') {
      // Bun.serve uses .stop()
      server.stop()
    }
    process.exit(0)
  })
}

main().catch(err => {
  console.error('Failed to start:', err)
  process.exit(1)
})
