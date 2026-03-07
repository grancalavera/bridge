import { describe, it, expect } from "vitest";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

describe("CJS Exports", () => {
  it("should require all public exports from dist/index.cjs", () => {
    const distPath = resolve(__dirname, "../../dist/index.cjs");
    const module = require(distPath);

    expect(module.createClient).toBeDefined();
    expect(typeof module.createClient).toBe("function");

    expect(module.createWorker).toBeDefined();
    expect(typeof module.createWorker).toBe("function");

    expect(module.createWorkerFactory).toBeDefined();
    expect(typeof module.createWorkerFactory).toBe("function");

    expect(module.registryWorkerFactory).toBeDefined();
    expect(typeof module.registryWorkerFactory).toBe("function");

    expect(module.createSharedWorkerRuntime).toBeDefined();
    expect(typeof module.createSharedWorkerRuntime).toBe("function");

    expect(module.wrapWorkerPort).toBeDefined();
    expect(typeof module.wrapWorkerPort).toBe("function");

    expect(module.subscriptions).toBeDefined();
    expect(typeof module.subscriptions).toBe("function");
  });
});
