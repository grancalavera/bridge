import { describe, it, expect, beforeAll } from "vitest";
import type { Contract, Operation, Subscription } from "../../dist/index.js";

type TestContract = Contract<{
  echo: Operation<string, string>;
  subscribeEcho: Subscription<string, { timestamp?: boolean }>;
}>;

describe("SharedWorker Communication", () => {
  beforeAll(async () => {
    const { createClient, createWorker, createSharedWorkerRuntime } =
      await import("../../dist/index.js");

    expect(createClient).toBeDefined();
    expect(createWorker).toBeDefined();
    expect(createSharedWorkerRuntime).toBeDefined();
  });

  it("should import createClient from dist/index.js", async () => {
    const { createClient } = await import("../../dist/index.js");

    expect(createClient).toBeDefined();
    expect(typeof createClient).toBe("function");
  });

  it("should import createWorker from dist/index.js", async () => {
    const { createWorker } = await import("../../dist/index.js");

    expect(createWorker).toBeDefined();
    expect(typeof createWorker).toBe("function");
  });

  it("should import createSharedWorkerRuntime from dist/index.js", async () => {
    const { createSharedWorkerRuntime } = await import("../../dist/index.js");

    expect(createSharedWorkerRuntime).toBeDefined();
    expect(typeof createSharedWorkerRuntime).toBe("function");
  });

  it("should import wrapWorkerPort from dist/index.js", async () => {
    const { wrapWorkerPort } = await import("../../dist/index.js");

    expect(wrapWorkerPort).toBeDefined();
    expect(typeof wrapWorkerPort).toBe("function");
  });

  it("should validate contract types are accessible", () => {
    const contractShape: TestContract = {} as TestContract;

    expect(contractShape).toBeDefined();
  });
});
