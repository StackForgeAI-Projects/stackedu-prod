import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/collab.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Bundling keeps the runtime free of a TypeScript loader and makes Render's
  // container boot in well under a second.
  noExternal: [/^@stackedu\//],
})
