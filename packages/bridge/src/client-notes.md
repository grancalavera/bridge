# Client Notes

## Re-connect client on worker crash

```typescript
// this is not going to work because is not enough with just creating a new
// instance of the shared worker, we need to replace the actual underlying
// proxy. for example, that would mean that every rpc call should resolve the
// proxy implementation dynamically and then call the functions in the proxy.
// this can be implemented in the client proxy, or "around" the client proxy.
const initializeClient = async (port: MessagePort, clientId: string) => {
  const workerId = await registerClient(port, clientId);
  await monitorWorkerCrash(workerId);
  initializeClient(port, clientId);
};
```

## Dynamic Proxy Resolution Solutions

The `deriveClient` function already proxies all method calls, so we can leverage that interception point to dynamically resolve the worker proxy instead of using a static reference.

### Option 1: Controller Object

Return an object with both the client and an update method:

```typescript
const deriveClient = <T extends Operations>(
  initialPort: MessagePort,
  clientId: string,
) => {
  let currentWorkerProxy = wrapWorkerPort<T>(initialPort);

  const updateWorkerProxy = (newPort: MessagePort) => {
    currentWorkerProxy = wrapWorkerProxy<T>(newPort);
  };

  // ... proxy logic

  return {
    client: clientProxy,
    updateWorkerProxy,
  };
};

// Usage: manually trigger reconnection
const { client, updateWorkerProxy } = deriveClient(port, clientId);
updateWorkerProxy(newPort); // Explicit control
```

### Option 2: Proxy Methods

Add special methods to the client proxy itself:

```typescript
const clientProxy = new Proxy(
  {} as T & { __updateWorker: (port: MessagePort) => void },
  {
    get(target, propertyKey, receiver) {
      if (propertyKey === "__updateWorker") {
        return (newPort: MessagePort) => {
          currentWorkerProxy = wrapWorkerProxy<T>(newPort);
        };
      }
      // ... rest of proxy logic
    },
  },
) as T;

// Usage: call special methods on client
client.__updateWorker(newPort);
```

### Option 3: Callback/Event System (Recommended)

Provide a callback that gets invoked automatically when a new worker is needed:

```typescript
const deriveClient = <T extends Operations>(
  initialPort: MessagePort,
  clientId: string,
  onWorkerNeeded?: () => MessagePort,
) => {
  let currentWorkerProxy = wrapWorkerProxy<T>(initialPort);

  const getWorkerProxy = (): T => {
    if (/* worker crashed */ && onWorkerNeeded) {
      const newPort = onWorkerNeeded();
      currentWorkerProxy = wrapWorkerProxy<T>(newPort);
    }
    return currentWorkerProxy;
  };
  // ... proxy logic
};

// Usage: automatic and transparent reconnection
const createFreshWorker = () => {
  const worker = new SharedWorker('/worker.js');
  return worker.port;
};

const client = deriveClient(initialPort, clientId, createFreshWorker);
await client.echo("hello"); // Auto-reconnects if needed
```

**Benefits of Option 3:**

- Zero client code changes - method calls work the same
- Automatic recovery - no manual intervention needed
- Configurable strategy - you control how new workers are created
- Transparent - the client proxy handles all complexity

## Subscription Recovery Problem

When a worker crashes, subscriptions become broken:

1. Client calls `client.subscribe(callback)`
2. Worker maintains subscription state and calls the callback
3. Worker crashes - subscription state is lost on worker side
4. Client still thinks it's subscribed, but callbacks never fire
5. Client has no way to know the subscription is dead

**Current Issues:**

- Worker-side subscription state is completely lost on crash
- Client-side callbacks become orphaned
- No mechanism to detect or recover broken subscriptions

## Enhanced Subscription API Solution

Add `onError` and `onComplete` callbacks (following Rx/Observable pattern) to handle worker crashes gracefully:

```typescript
// Current: client.subscribe(onNext)
// Proposed: client.subscribe({ onNext, onError, onComplete })

// Worker crash error symbol
export const WORKER_CRASHED = Symbol('WORKER_CRASHED');

// Usage example
client.subscribe({
  onNext: (data) => console.log(data),
  onError: (error) => {
    if (error.type === WORKER_CRASHED) {
      console.log('Worker crashed, attempting reconnection...');
      // Re-subscribe after reconnection
      setTimeout(() => client.subscribe(...), 1000);
    } else {
      console.error('Subscription error:', error);
    }
  },
  onComplete: () => console.log('Subscription ended')
});
```

**Benefits:**

- **Crash Detection**: Client proxy can call `onError` on all active subscriptions when worker crashes
- **Clean Shutdown**: `onComplete` allows proper subscription cleanup
- **Standard Pattern**: Follows established Rx/Observable conventions
- **Recovery Strategy**: Client code can decide how to handle crashes
- **Symbol-based Error**: Unique, type-safe way to identify worker crash errors
- **Explicit Error Handling**: Subscriptions know when something goes wrong

## Connection State Management

May need to track connection state (similar to WebSocket patterns) to properly manage subscriptions based on worker connectivity status.
