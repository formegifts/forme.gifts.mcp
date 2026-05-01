import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }

export default defineConfig({
  entry: ['src/bin.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  target: 'node24',
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    __SERVER_VERSION__: JSON.stringify(version),
  },
})
