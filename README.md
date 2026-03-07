# Bridge

**Type-safe contract-based communication between browsing contexts**

Bridge provides an easy way to write contract-based communication between browsing contexts using SharedWorkers. It offers two basic RPC operations: **Operation** and **Subscription**.

## Installation

```bash
npm install @grancalavera/bridge
```

## Core Concepts

Bridge uses a contract-based approach where you define type-safe operations that can be executed across browsing contexts:

- **Operation**: A unified type for both queries and mutations — takes an optional input and returns a response
- **Subscription**: Observable streams that push updates to clients via materialized RxJS notifications

All operations are backed by [Comlink](https://github.com/GoogleChromeLabs/comlink) for seamless worker communication and [RxJS](https://rxjs.dev/) for reactive subscription management.

## Usage

### 1. Define Your Contract

Create a contract that describes the operations your worker will expose:

```typescript
import type { Contract, Operation, Subscription } from "@grancalavera/bridge";

export type EchoContract = Contract<{
  echo: Operation<string, string>;
  subscribeEcho: Subscription<string, { timestamp?: boolean }>;
}>;
```

### 2. Implement the Worker

Use `createWorker` to implement your contract on the worker side:

```typescript
import { map, share, Subject } from "rxjs";
import { createWorker } from "@grancalavera/bridge";
import type { EchoContract } from "./contract";

export const echoWorker = createWorker<EchoContract>(({ subscribe }) => {
  const echo$ = new Subject<string>();

  const echoWithTimestamp$ = echo$.pipe(
    map((message) => `[${new Date().toISOString()}] ${message}`),
    share(),
  );

  return {
    async echo(clientId, value) {
      const message = `[${clientId}] ${value}`;
      echo$.next(message);
      return message;
    },
    async subscribeEcho(clientId, onNotification, input) {
      const timestamp = input?.timestamp;
      return subscribe(
        timestamp ? echoWithTimestamp$ : echo$,
        clientId,
        onNotification,
      );
    },
  };
});
```

### 3. Create the Client

Use `createClient` to connect to your worker from any browsing context:

```typescript
import { createClient } from "@grancalavera/bridge";
import type { EchoContract } from "./contract";
import EchoWorker from "./worker-runtime?sharedworker";

export const [echoClient, subscribe] = createClient<EchoContract>({
  sharedWorker: new EchoWorker({ name: "Echo Worker" }),
});
```

### 4. Use in Your Application

**Calling Operations:**

```typescript
const response = await echoClient.echo("Hello World!");
console.log(response); // "[client-id] Hello World!"
```

**Using Subscriptions with React:**

```typescript
import { bind, Subscribe } from "@react-rxjs/core";
import { echoClient, subscribe } from "./client";

const [useEcho] = bind((timestamp?: boolean) =>
  subscribe("subscribeEcho", { timestamp }),
);

function App() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  return (
    <div>
      <button onClick={() => setIsSubscribed(!isSubscribed)}>
        {isSubscribed ? "Unsubscribe" : "Subscribe"}
      </button>
      {isSubscribed && (
        <Subscribe fallback={<p>Waiting for messages...</p>}>
          <EchoMessages />
        </Subscribe>
      )}
    </div>
  );
}

function EchoMessages() {
  const echo = useEcho();
  return <p>{echo}</p>;
}
```

## Examples

This is a monorepo with examples in `packages/examples/`:

- [Echo](./packages/examples/echo) — Basic operation and subscription demo
- [User Profile](./packages/examples/user-profile) — CRUD operations with cross-tab state sync

Run examples locally:

```bash
npm install
npm run dev
```

## Key Features

- **Type Safety**: Full TypeScript support with contract-based type inference
- **Automatic Client Management**: ClientId injection and lifecycle management using Web Locks API
- **RxJS Integration**: Observable-based subscriptions with materialized notifications and automatic cleanup
- **Structured Cloneable**: Enforces data types that can be safely transferred across worker boundaries
- **Multi-Context**: Share state and communicate between tabs, windows, and iframes

## Architecture

**Client Side** (`packages/bridge/src/client.ts`)

- Creates typed proxies for worker operations
- Automatically injects clientId into all worker calls
- Manages SharedWorker connection lifecycle

**Worker Side** (`packages/bridge/src/worker.ts`)

- Provides context helpers (`subscribe`)
- Tracks client connections with automatic cleanup via Web Locks
- Integrates with RxJS for subscription management using materialized notifications

**Type System** (`packages/bridge/src/model.ts`)

- `Contract<T>`: Defines client-facing operations
- `WorkerContract<T>`: Adds clientId parameter for worker implementations
- Enforces structured cloneable constraints for cross-context safety

## Development

```bash
npm run dev          # Start dev server with examples
npm run build        # Build library package
npm run typecheck    # Run TypeScript checks
npm run lint         # Lint code
npm run format       # Format code
npm test             # Run test suite
```

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for version management. To add a changeset:

```bash
npx changeset
```

## License

MIT
