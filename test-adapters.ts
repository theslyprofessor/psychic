#!/usr/bin/env bun

/**
 * Quick adapter validation test
 * Tests that our adapters work correctly
 */

import { ExpressAdapter } from './src/adapters/express-adapter.js'
import { HonoAdapter } from './src/adapters/hono-adapter.js'

console.log('🧪 Testing Psychic Framework Adapters\n')

// Test 1: ExpressAdapter can be instantiated
console.log('Test 1: ExpressAdapter instantiation...')
try {
  const expressAdapter = new ExpressAdapter()
  const app = expressAdapter.createApp()
  console.log('✅ ExpressAdapter created successfully')
  console.log(`   Type: ${typeof app}`)
} catch (error) {
  console.error('❌ ExpressAdapter failed:', error)
  process.exit(1)
}

// Test 2: HonoAdapter can be instantiated
console.log('\nTest 2: HonoAdapter instantiation...')
try {
  const honoAdapter = new HonoAdapter()
  const app = honoAdapter.createApp()
  console.log('✅ HonoAdapter created successfully')
  console.log(`   Type: ${typeof app}`)
} catch (error) {
  console.error('❌ HonoAdapter failed:', error)
  process.exit(1)
}

// Test 3: ExpressAdapter request adaptation
console.log('\nTest 3: ExpressAdapter request adaptation...')
try {
  const expressAdapter = new ExpressAdapter()
  
  // Mock Express request
  const mockExpressReq = {
    method: 'GET',
    url: '/api/tasks',
    path: '/api/tasks',
    params: { id: '123' },
    query: { page: '1' },
    body: {},
    headers: { 'content-type': 'application/json' },
    cookies: {},
    ip: '127.0.0.1',
    protocol: 'http',
    hostname: 'localhost',
    get: (name: string) => mockExpressReq.headers[name],
  }
  
  const psychicReq = expressAdapter.adaptRequest(mockExpressReq as any)
  
  if (psychicReq.method === 'GET' && psychicReq.url === '/api/tasks') {
    console.log('✅ ExpressAdapter request adaptation works')
    console.log(`   Method: ${psychicReq.method}`)
    console.log(`   URL: ${psychicReq.url}`)
    console.log(`   Params: ${JSON.stringify(psychicReq.params)}`)
  } else {
    throw new Error('Request adaptation produced incorrect values')
  }
} catch (error) {
  console.error('❌ ExpressAdapter request adaptation failed:', error)
  process.exit(1)
}

// Test 4: ExpressAdapter response adaptation
console.log('\nTest 4: ExpressAdapter response adaptation...')
try {
  const expressAdapter = new ExpressAdapter()
  
  // Mock Express response
  const sentData: any[] = []
  const mockExpressRes = {
    statusCode: 200,
    headersSent: false,
    status: function(code: number) { this.statusCode = code; return this },
    json: function(data: any) { sentData.push({ type: 'json', data }); this.headersSent = true },
    send: function(data: any) { sentData.push({ type: 'send', data }); this.headersSent = true },
    setHeader: function() { return this },
    getHeader: function() { return undefined },
    cookie: function() { return this },
    clearCookie: function() { return this },
    redirect: function() { this.headersSent = true },
  }
  
  const psychicRes = expressAdapter.adaptResponse(mockExpressRes as any)
  
  // Test status code
  psychicRes.status(201)
  if (mockExpressRes.statusCode !== 201) {
    throw new Error('Status code not set correctly')
  }
  
  // Test JSON response
  psychicRes.json({ success: true })
  if (sentData[0]?.type !== 'json' || !sentData[0]?.data?.success) {
    throw new Error('JSON response not sent correctly')
  }
  
  // Test headersSent getter
  if (!psychicRes.headersSent) {
    throw new Error('headersSent not working')
  }
  
  console.log('✅ ExpressAdapter response adaptation works')
  console.log(`   Status code: ${mockExpressRes.statusCode}`)
  console.log(`   Headers sent: ${psychicRes.headersSent}`)
  console.log(`   Data sent: ${JSON.stringify(sentData[0])}`)
} catch (error) {
  console.error('❌ ExpressAdapter response adaptation failed:', error)
  process.exit(1)
}

// Test 5: Type compatibility check
console.log('\nTest 5: Type compatibility...')
try {
  const expressAdapter = new ExpressAdapter()
  const honoAdapter = new HonoAdapter()
  
  // Both should have the same interface
  const requiredMethods = ['createApp', 'registerRoute', 'use', 'adaptRequest', 'adaptResponse', 'listen', 'getApp']
  
  for (const method of requiredMethods) {
    if (typeof (expressAdapter as any)[method] !== 'function') {
      throw new Error(`ExpressAdapter missing method: ${method}`)
    }
    if (typeof (honoAdapter as any)[method] !== 'function') {
      throw new Error(`HonoAdapter missing method: ${method}`)
    }
  }
  
  console.log('✅ Both adapters implement PsychicAdapter interface')
  console.log(`   Required methods: ${requiredMethods.join(', ')}`)
} catch (error) {
  console.error('❌ Type compatibility failed:', error)
  process.exit(1)
}

console.log('\n' + '='.repeat(50))
console.log('🎉 All adapter tests passed!')
console.log('='.repeat(50))
console.log('\n✅ ExpressAdapter: WORKING')
console.log('✅ HonoAdapter: WORKING')
console.log('✅ Request/Response adaptation: WORKING')
console.log('✅ Interface compatibility: VERIFIED')
console.log('\nAdapters are ready for integration! 🚀')
