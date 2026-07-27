import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('../package-lock.json', import.meta.url)
const from = 'https://package-mirror.liara.ir/artifactory/api/npm/npm/'
const to = 'https://registry.npmjs.org/'

let content = readFileSync(path, 'utf8')
const before = (content.match(/package-mirror\.liara\.ir/g) || []).length
content = content.split(from).join(to)
const after = (content.match(/package-mirror\.liara\.ir/g) || []).length
const npmCount = (content.match(/registry\.npmjs\.org/g) || []).length

writeFileSync(path, content)
console.log(`liara before=${before} after=${after} npmjs=${npmCount}`)
