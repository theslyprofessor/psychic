/**
 * Decorator Adapter for Psychic Controllers
 *
 * Enables compatibility with both Legacy (TypeScript) and TC39 (Bun) decorators.
 * This mirrors the adapter pattern from Dream ORM.
 *
 * @see https://github.com/tc39/proposal-decorators
 */

import { DecoratorContext } from '@rvoh/dream/types'
import PsychicController from './index.js'

/**
 * Runtime detection - Bun uses TC39 decorators, Node/tsx uses legacy TypeScript decorators.
 */
const isBunRuntime = typeof globalThis !== 'undefined' && 'Bun' in globalThis

/**
 * TC39 decorator context type for methods.
 */
export interface TC39MethodDecoratorContext {
  kind: 'method'
  name: string | symbol
  static: boolean
  private: boolean
  access: {
    has: (object: object) => boolean
    get: (object: object) => unknown
  }
  metadata: DecoratorMetadata
}

/**
 * Creates a method decorator that works with both Legacy and TC39 standards.
 *
 * For Psychic controllers, method decorators are used for @BeforeAction and @OpenAPI.
 */
export function createControllerMethodDecorator(
  implementation: (controllerClass: typeof PsychicController, methodName: string) => void
): any {
  if (isBunRuntime) {
    // TC39 pattern for methods
    return function (
      method: Function,
      context: TC39MethodDecoratorContext
    ): Function {
      const methodName = String(context.name)

      // Return a wrapper that initializes on first call
      let initialized = false
      return function (this: PsychicController, ...args: unknown[]): unknown {
        if (!initialized) {
          const controllerClass = this.constructor as typeof PsychicController
          implementation(controllerClass, methodName)
          initialized = true
        }
        return method.apply(this, args)
      }
    }
  } else {
    // Legacy (TypeScript/tsx) pattern - use addInitializer
    return function (_: undefined, context: DecoratorContext): void {
      const methodName = context.name

      context.addInitializer(function (this: PsychicController): void {
        const controllerClass = this.constructor as typeof PsychicController
        implementation(controllerClass, methodName.toString())
      })
    }
  }
}
