import { copyFileSync } from 'node:fs'

// GitHub Pages برای مسیرهای SPA مثل /login به 404 می‌رود؛
// کپی index به 404 باعث می‌شود Vue Router صفحه را درست باز کند.
copyFileSync('dist/index.html', 'dist/404.html')
console.log('Copied dist/index.html -> dist/404.html')
