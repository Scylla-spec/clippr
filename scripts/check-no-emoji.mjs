import fs from 'node:fs'
import path from 'node:path'

// Regex matching unicode emojis, pictographs, variation selectors, and common emoji-like symbols
const EMOJI_REGEX = /(?:[\p{Extended_Pictographic}\uFE0E\uFE0F✓✔✕✖✗✘⚠⏱⎋➔➜➤])+/gu

const TARGETS = [
  'src',
  'public/manifest.webmanifest',
  'index.html',
  'README.md',
]

const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.html',
  '.md',
  '.webmanifest',
  '.json',
  '.css',
])

const rootDir = process.cwd()
let errorCount = 0

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    const matches = line.match(EMOJI_REGEX)
    if (matches) {
      const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/')
      console.error(
        `[emoji-check] ${relPath}:${index + 1}: Found forbidden emoji/symbol ${JSON.stringify(matches)}`
      )
      console.error(`    ${line.trim()}`)
      errorCount += matches.length
    }
  })
}

function walk(entryPath) {
  const stat = fs.statSync(entryPath)
  if (stat.isDirectory()) {
    const files = fs.readdirSync(entryPath)
    for (const file of files) {
      walk(path.join(entryPath, file))
    }
  } else if (stat.isFile()) {
    const ext = path.extname(entryPath)
    if (ALLOWED_EXTENSIONS.has(ext)) {
      scanFile(entryPath)
    }
  }
}

for (const target of TARGETS) {
  const absPath = path.resolve(rootDir, target)
  if (fs.existsSync(absPath)) {
    walk(absPath)
  }
}

if (errorCount > 0) {
  console.error(`\nFound ${errorCount} forbidden emojis/symbols. Please use icons (e.g. lucide-react) instead.`)
  process.exit(1)
} else {
  console.log('No emojis or forbidden symbols found. All clean!')
  process.exit(0)
}
