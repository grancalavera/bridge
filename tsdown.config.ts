import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
    compilerOptions: {
      declarationMap: true,
    },
  },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
})
