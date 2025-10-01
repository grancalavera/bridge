import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readdirSync, statSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const examplesDir = resolve(__dirname, 'examples')
const examples = readdirSync(examplesDir).filter(file => {
  const fullPath = resolve(examplesDir, file)
  return statSync(fullPath).isDirectory()
})

const input: Record<string, string> = {
  main: resolve(__dirname, 'index.html')
}

for (const example of examples) {
  const examplePath = resolve(examplesDir, example)
  const htmlPath = resolve(examplePath, 'index.html')
  
  if (existsSync(htmlPath)) {
    input[example] = htmlPath
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      input
    }
  },
  appType: 'mpa'
})