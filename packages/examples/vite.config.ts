import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readdirSync, statSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exampleDirs = readdirSync(__dirname).filter((file) => {
  const fullPath = resolve(__dirname, file);
  return (
    statSync(fullPath).isDirectory() &&
    existsSync(resolve(fullPath, "index.html"))
  );
});

const input: Record<string, string> = {
  main: resolve(__dirname, "index.html"),
};

for (const example of exampleDirs) {
  input[example] = resolve(__dirname, example, "index.html");
}

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-examples",
    rollupOptions: {
      input,
    },
  },
  appType: "mpa",
});
