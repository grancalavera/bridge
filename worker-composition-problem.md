# Worker Composition Problem

## Current Architecture

`createWorker(factory)` produces a single complete SharedWorker by composing a user-provided factory with the built-in `registryWorkerFactory`. Both factories are created via `createWorkerFactory()`, which gives them a shared `clients` map. The results are merged via object spread:

```ts
const create = createWorkerFactory();
return { ...create(factory), ...create(registryWorkerFactory) };
```

Every worker produced by `createWorker` includes `registerClient` from the registry.

## The Problem

If you want to combine multiple feature workers into a single SharedWorker runtime:

```ts
createSharedWorkerRuntime({ ...echoWorker, ...profileWorker });
```

This fails silently because:

1. **Duplicate `registerClient`** — Both `echoWorker` and `profileWorker` already include `registerClient` from their respective `createWorker` calls. The spread silently overwrites one.

2. **Separate `clients` maps** — Each `createWorker` call creates its own `createWorkerFactory()` with its own `clients` map. The surviving `registerClient` only manages cleanup for one set of clients, leaking subscriptions from the other.

3. **Undetectable at runtime** — By the time `createSharedWorkerRuntime` receives the object, the spread has already resolved. There's no way to detect that keys were lost.

## What We've Done So Far

- Added a guard in `createWorker` that throws if the user factory defines `registerClient`, since it's a reserved key that would be overwritten by the registry.

## Open Question

To support multi-feature workers sharing a single runtime and a single registry, composition would need to happen _before_ the registry is attached — for example:

- `createWorker` accepts multiple factories (variadic) and composes them over a single `clients` map with a single registry
- A separate `composeFactories` utility that merges factories before passing to `createWorker`

Either approach keeps one `clients` map and one `registerClient`, and can detect duplicate keys across factories before merging.
