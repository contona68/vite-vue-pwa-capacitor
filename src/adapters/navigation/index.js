/**
 * نمای یکپارچهٔ Navigation
 */

import { isNativePlatform } from '@/platform/env'
import { isBackableRoute, navigateBack, resolveFallbackRouteName } from './back'
import * as nativeNav from './native'
import * as webNav from './web'

function provider() {
  return isNativePlatform() ? nativeNav : webNav
}

export { isBackableRoute, navigateBack, resolveFallbackRouteName }

/**
 * @param {() => void | Promise<void>} onBackRequest
 * @returns {() => void}
 */
export function startBackHandling(onBackRequest) {
  return provider().startBackHandling(onBackRequest)
}
