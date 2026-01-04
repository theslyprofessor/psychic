# Framework Adapter Pattern for Psychic

**Status:** 🚧 In Progress  
**Author:** Nakul Tiruviluamala (@theslyprofessor)  
**Date:** 2025-01-04  
**Estimated Effort:** ~38 hours  

## Summary

Add framework adapter layer to Psychic, enabling it to run on **Express** (current) OR **Hono** (new), with easy extensibility for Fastify, Elysia, etc.

## Motivation

**Problem:** Psychic is tightly coupled to Express, limiting performance potential and framework choice.

**Current state:**
- Express on Bun: 60K req/sec
- Hono on Bun: 380K req/sec (6.3x faster)

**Goal:** Let developers choose their HTTP framework while keeping Psychic's Rails-like MVC structure.

## Architecture

### Adapter Pattern

```typescript
// Unified interface
interface PsychicAdapter {
  createApp(): any
  registerRoute(method: string, path: string, handler: RouteHandler): void
  adaptRequest(nativeReq: any): PsychicRequest
  adaptResponse(nativeRes: any): PsychicResponse
}

// Framework-specific implementations
class ExpressAdapter implements PsychicAdapter { ... }
class HonoAdapter implements PsychicAdapter { ... }
```

### Usage

```typescript
// conf/app.ts
import { PsychicApp } from '@rvoh/psychic'

export const app = new PsychicApp({
  framework: 'hono',  // or 'express'
})
```

## Files Changed

| File | Current Lines | Changes | Type |
|------|---------------|---------|------|
| `src/adapters/types.ts` | 0 | +150 | NEW |
| `src/adapters/express-adapter.ts` | 0 | +200 | NEW |
| `src/adapters/hono-adapter.ts` | 0 | +200 | NEW |
| `src/adapters/index.ts` | 0 | +20 | NEW |
| `src/controller/index.ts` | 1,247 | ~200 | MODIFY |
| `src/psychic-app/index.ts` | 723 | ~50 | MODIFY |
| `src/session/index.ts` | 342 | ~30 | MODIFY |
| `src/controller/helpers/logIfDevelopment.ts` | 24 | ~5 | MODIFY |
| `src/psychic-app/helpers/import/importControllers.ts` | 68 | ~10 | MODIFY |

**Total:** 9 files, ~865 lines of work

## Benefits

1. ✅ **Performance options** - Use Hono for 6x speed boost
2. ✅ **Future-proof** - Easy to add Fastify, Elysia, etc.
3. ✅ **Backwards compatible** - Express remains default
4. ✅ **Marketing angle** - "First Rails-like MVC for Hono"
5. ✅ **No breaking changes** - Existing apps work unchanged

## Implementation Phases

### Phase 1: Adapter Foundation (Week 1)
- [ ] Create adapter type interfaces
- [ ] Implement ExpressAdapter (wrap existing Express code)
- [ ] No breaking changes - internal refactor only

### Phase 2: Hono Support (Week 2)
- [ ] Implement HonoAdapter
- [ ] Add framework config option
- [ ] Update BaseController to use adapter types

### Phase 3: Testing (Week 3)
- [ ] Test suite for both adapters
- [ ] Integration tests
- [ ] Demo apps (Express + Hono)

### Phase 4: Documentation (Week 4)
- [ ] Update guides
- [ ] Migration path for users
- [ ] Performance benchmarks

## Success Metrics

- [ ] All existing tests pass with ExpressAdapter
- [ ] All existing tests pass with HonoAdapter
- [ ] Performance: Hono adapter achieves >300K req/sec
- [ ] No breaking changes for current users
- [ ] Documentation complete

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Adapters not 100% compatible | Clearly document edge cases |
| Testing complexity doubles | Share test suite, use adapters in tests |
| Breaking changes in Hono | Pin Hono version, test before updates |
| Maintenance burden | Label Hono adapter as experimental initially |

## Timeline

- Week 1-2: Core implementation
- Week 3: Testing & bug fixes
- Week 4: Documentation & release prep
- **Total: 1 month**

## Open Questions

- [ ] Should Hono adapter be separate npm package (`@psychic/hono-adapter`)?
- [ ] How to handle middleware incompatibilities (Passport, express-session)?
- [ ] Should we support middleware adapters too?

## Related Work

- NestJS (supports Express, Fastify, Hono)
- AdonisJS (supports multiple HTTP servers)
- Lucia v4 (framework-agnostic auth)
