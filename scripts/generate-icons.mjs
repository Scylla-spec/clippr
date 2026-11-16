import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const iconsDir = path.join(rootDir, 'public', 'icons')

const iconSvgPath = path.join(iconsDir, 'icon.svg')
const iconMaskableSvgPath = path.join(iconsDir, 'icon-maskable.svg')

async function main() {
  const iconSvg = await fs.readFile(iconSvgPath)
  const maskableSvg = await fs.readFile(iconMaskableSvgPath)

  const targets = [
    {
      source: iconSvg,
      size: 192,
      outFile: path.join(iconsDir, 'icon-192.png'),
    },
    {
      source: iconSvg,
      size: 512,
      outFile: path.join(iconsDir, 'icon-512.png'),
    },
    {
      source: maskableSvg,
      size: 512,
      outFile: path.join(iconsDir, 'icon-512-maskable.png'),
    },
    {
      source: iconSvg,
      size: 180,
      outFile: path.join(iconsDir, 'apple-touch-icon.png'),
    },
    {
      source: iconSvg,
      size: 32,
      outFile: path.join(iconsDir, 'favicon-32x32.png'),
    },
  ]

  for (const { source, size, outFile } of targets) {
    await sharp(source)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(outFile)
    console.log(`Generated: ${path.relative(rootDir, outFile)} (${size}x${size})`)
  }

  console.log('All icons generated successfully.')
}

main().catch((err) => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
