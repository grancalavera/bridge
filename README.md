# experiment-04: Type-Safe Contract-Based SharedWorker Abstraction

This experiment implements an abstraction layer for SharedWorker communication using TypeScript contracts, client management, and subscription handling with RxJS integration.

## Key Features

### Contract-Based Type Safety

- Define operations using `Query`, `Mutation`, and `Subscription` types
- Enforces structured cloneable data types across worker boundaries
- ClientId injection for worker operations
- Comlink proxy generation with type constraints

### Client Management

- Client registration with unique IDs and resource cleanup
- Memoized client creation for singleton instances
- Web Locks API integration for lifecycle management
- Unsubscription when clients disconnect

### RxJS Integration

- Observable-based subscription model using `@react-rxjs/core`
- Comlink.proxy wrapping for callback functions
- Subscription tracking and cleanup
- Subject-based worker-side event broadcasting

## Architecture

**Client-Side (`core/client.ts`)**

- `createClient()` handles registration and proxy derivation
- Function argument processing for Comlink compatibility
- Generated proxies inject clientId as first parameter to all operations

**Worker-Side (`core/worker.ts`)**

- `createWorker()` provides context with notify/subscribe helpers
- Client registry with cleanup using Web Locks API
- RxJS integration for subscription management
- Unsubscribe function generation with Comlink.proxy

**Type System (`core/model.ts`)**

- `Contract<T>` defines client-facing operations
- `WorkerContract<T>` adds clientId parameter for worker implementation
- Structured cloneable type constraints
- ProxyMarkedFunction type helpers for Comlink integration

## Implementation Example

**Contract Definition:**

```typescript
export type EchoContract = Contract<{
  echo: Mutation<string, string>;
  subscribeEcho: Subscription<string, void>;
}>;
```

**Worker Implementation:**

```typescript
export const echoWorker = createWorker<EchoContract>(
  ({ notify, subscribe }) => {
    const echo$ = new Subject<string>();
    return {
      async echo(clientId, value) {
        const message = `[${new Date().toISOString()}, ${clientId}] ${value}`;
        return notify(echo$, message);
      },
      async subscribeEcho(clientId, callback) {
        return subscribe(echo$, clientId, callback);
      },
    };
  },
);
```

**Client Usage:**

```typescript
const echoClient = createEchoClient();
const client = await echoClient;

// Query/Mutation usage
const response = await client.echo("Hello, World!");

// Subscription with RxJS integration
const [useEcho] = bind(
  from(echoClient).pipe(
    switchMap(
      (client) =>
        new Observable((subscriber) => {
          const unsubscribePromise = client.subscribeEcho(
            Comlink.proxy((message) => subscriber.next(message)),
          );
          return () => unsubscribePromise.then((unsubscribe) => unsubscribe());
        }),
    ),
  ),
);
```

## Evolution

This experiment evolved through multiple iterations:

1. **Initial API DX Review** - Simple SharedWorker setup
2. **Contract Abstraction** - Type-safe operation definitions
3. **Client Derivation** - Proxy-based client generation with automatic clientId injection
4. **Subscription System** - RxJS integration with cleanup
5. **Resource Management** - Web Locks API for client lifecycle
6. **Final Refinement** - Removed redundant code and documentation
