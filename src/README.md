# Internals

How `createWorkerFactory`, `registryWorkerFactory`, and `createWorker` compose to produce a SharedWorker, and how `createClient` connects from a browser tab.

```mermaid
sequenceDiagram
    participant Tab as Browser Tab
    participant CC as createClient
    participant Lock as navigator.locks
    participant SW as SharedWorker
    participant CW as createWorker
    participant CWF as createWorkerFactory
    participant CM as clients Map
    participant RF as registryWorkerFactory
    participant UF as userFactory

    note over CW, UF: Worker Setup
    CW ->> CWF: createWorkerFactory()
    CWF ->> CM: create shared Map<string, ClientRep>
    CW ->> CWF: invoke with userFactory
    CWF ->> UF: userFactory({ subscribe, clients })
    UF -->> CWF: user operations
    CW ->> CWF: invoke with registryWorkerFactory
    CWF ->> RF: registryWorkerFactory({ subscribe, clients })
    RF -->> CWF: { registerClient }
    CWF -->> CW: { ...userOps, ...registerClient }
    CW ->> SW: expose merged worker object

    note over Tab, SW: Client Connection
    Tab ->> CC: createClient({ sharedWorker })
    CC ->> CC: clientId = crypto.randomUUID()
    CC ->> Lock: navigator.locks.request(clientId)
    Lock ->> SW: proxy.registerClient(clientId)
    SW ->> RF: registerClient(clientId)
    RF ->> CM: clients.set(clientId, new ClientRep)
    RF -->> Lock: resolved
    note over Lock: lock held for tab lifetime
    CC -->> Tab: [clientProxy, subscriptions]

    note over Tab, CM: Usage
    Tab ->> SW: client.someOperation(...args)
    note right of Tab: proxy auto-prepends clientId
    SW ->> SW: someOperation(clientId, ...args)
    SW -->> Tab: result

    note over Tab, CM: Subscription
    Tab ->> SW: subscriptions("watchSomething", input)
    SW ->> CM: track subscription in ClientRep
    SW --) Tab: onNotification (stream of updates)

    note over Tab, CM: Cleanup (tab closes)
    Tab -x Lock: tab closed, lock released
    Lock ->> RF: lock released callback fires
    RF ->> CM: client.subscriptions.unsubscribe()
    RF ->> CM: clients.delete(clientId)
```

## Lifecycle

1. **Worker setup** -- `createWorker` calls `createWorkerFactory()`, which allocates a single shared `clients` map. It then invokes both the user-provided factory and `registryWorkerFactory` with the same `WorkerContext` (`{ subscribe, clients }`), merging their results into one worker object.

2. **Client connection** -- `createClient` generates a `clientId`, acquires a `navigator.locks` Web Lock for that id, and calls `registerClient` on the worker. The worker adds the client to the shared map. The lock is held for the lifetime of the tab.

3. **Usage** -- The returned client proxy intercepts every call and auto-prepends `clientId`, so worker operations always know which client is calling. Subscriptions are tracked per-client via `ClientRep.subscriptions`.

4. **Cleanup** -- When a tab closes (or navigates away), the browser releases the Web Lock. The worker detects this, unsubscribes all of that client's subscriptions, and removes the client from the map.
