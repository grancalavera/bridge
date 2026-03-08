import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createWorkerFactory,
  registryWorkerFactory,
  createWorker,
  type ClientRepMap,
  type WorkerContext,
} from "./worker";

vi.mock("comlink", () => ({
  proxy: (fn: unknown) => fn,
}));

describe("createWorkerFactory", () => {
  it("passes shared context to factory", () => {
    const clients: ClientRepMap = new Map();
    const create = createWorkerFactory(clients);
    let receivedContext: WorkerContext | undefined;

    create((context) => {
      receivedContext = context;
      return {};
    });

    expect(receivedContext).toBeDefined();
    expect(receivedContext!.clients).toBe(clients);
    expect(typeof receivedContext!.subscribe).toBe("function");
  });

  it("multiple factories share the same clients map", () => {
    const create = createWorkerFactory();
    const contexts: WorkerContext[] = [];

    create((context) => {
      contexts.push(context);
      return {};
    });
    create((context) => {
      contexts.push(context);
      return {};
    });

    expect(contexts[0].clients).toBe(contexts[1].clients);
  });

  it("returns factory result as-is", () => {
    const create = createWorkerFactory();
    const result = create(() => ({
      echo: async (_clientId: string) => "hello",
    }));

    expect(result).toHaveProperty("echo");
    expect(typeof result.echo).toBe("function");
  });

  it("creates a fresh map when no clients provided", () => {
    const create = createWorkerFactory();
    let receivedClients: ClientRepMap | undefined;

    create((context) => {
      receivedClients = context.clients;
      return {};
    });

    expect(receivedClients).toBeInstanceOf(Map);
    expect(receivedClients!.size).toBe(0);
  });
});

describe("registryWorkerFactory", () => {
  let clients: ClientRepMap;
  let lockCallbacks: Map<string, () => Promise<void>>;

  beforeEach(() => {
    clients = new Map();
    lockCallbacks = new Map();

    vi.stubGlobal("navigator", {
      ...navigator,
      locks: {
        request: vi.fn(async (name: string, callback: () => Promise<void>) => {
          lockCallbacks.set(name, callback);
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const createRegistry = () => {
    const create = createWorkerFactory(clients);
    return create(registryWorkerFactory);
  };

  it("registerClient adds client to map", async () => {
    const registry = createRegistry();
    await registry.registerClient("c1");

    expect(clients.has("c1")).toBe(true);
    expect(clients.size).toBe(1);
  });

  it("duplicate registration is a no-op", async () => {
    const registry = createRegistry();
    await registry.registerClient("c1");
    await registry.registerClient("c1");

    expect(clients.size).toBe(1);
  });

  it("acquires navigator.locks with clientId", async () => {
    const registry = createRegistry();
    await registry.registerClient("c1");

    expect(navigator.locks.request).toHaveBeenCalledWith(
      "c1",
      expect.any(Function),
    );
  });

  it("lock release cleans up subscriptions and removes client", async () => {
    const registry = createRegistry();
    await registry.registerClient("c1");

    const client = clients.get("c1")!;
    const unsubSpy = vi.spyOn(client.subscriptions, "unsubscribe");

    await lockCallbacks.get("c1")!();

    expect(unsubSpy).toHaveBeenCalled();
    expect(clients.has("c1")).toBe(false);
  });

  it("lock release warns for unknown client", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = createRegistry();
    await registry.registerClient("c1");

    // Remove the client before the lock releases
    clients.delete("c1");
    await lockCallbacks.get("c1")!();

    expect(warnSpy).toHaveBeenCalledWith(
      "Attempted to unregister unknown client c1",
    );
  });
});

describe("createWorker", () => {
  let lockCallbacks: Map<string, () => Promise<void>>;

  beforeEach(() => {
    lockCallbacks = new Map();

    vi.stubGlobal("navigator", {
      ...navigator,
      locks: {
        request: vi.fn(async (name: string, callback: () => Promise<void>) => {
          lockCallbacks.set(name, callback);
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("merges user factory and registry into one object", () => {
    const worker = createWorker(() => ({
      echo: async (_clientId: string) => "hello",
    }));

    expect(typeof worker.echo).toBe("function");
    expect(typeof worker.registerClient).toBe("function");
  });

  it("throws when user factory defines registerClient", () => {
    expect(() =>
      createWorker(() => ({
        registerClient: async (_clientId: string) => {},
      })),
    ).toThrow('"registerClient" is a reserved operation key');
  });

  it("both factories share the same clients map", async () => {
    let factoryClients: ClientRepMap | undefined;

    const worker = createWorker((context) => {
      factoryClients = context.clients;
      return {
        getClientCount: async () => factoryClients!.size,
      };
    });

    // Register a client through the registry side
    await worker.registerClient("c1");

    // The user factory should see the same client
    const count = await worker.getClientCount("ignored");
    expect(count).toBe(1);
  });
});
