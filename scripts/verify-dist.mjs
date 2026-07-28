import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * بعد از vite build مطمئن شو dist واقعاً بیلد production است،
 * نه کپی خام سورس (که روی GitHub Pages صفحه سفید می‌دهد).
 */
const dist = 'dist'
const indexPath = join(dist, 'index.html')

if (!existsSync(indexPath)) {
  console.error('[verify-dist] missing dist/index.html')
  process.exit(1)
}

const html = readFileSync(indexPath, 'utf8')

if (html.includes('/src/main.js') || html.includes('src="/src/') || html.includes("src='/src/")) {
  console.error('[verify-dist] dist/index.html still points at /src/main.js — Vite did not transform HTML')
  process.exit(1)
}

const assetsDir = join(dist, 'assets')
if (!existsSync(assetsDir) || readdirSync(assetsDir).length === 0) {
  console.error('[verify-dist] dist/assets is missing or empty')
  process.exit(1)
}

if (!existsSync(join(dist, '404.html'))) {
  console.error('[verify-dist] missing dist/404.html — run scripts/spa-github-pages.js')
  process.exit(1)
}

console.log('[verify-dist] OK — production dist looks valid')
