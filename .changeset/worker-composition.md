---
"@grancalavera/bridge": minor
---

Remove `createWorker` in favor of composing worker factories directly in `createSharedWorkerRuntime`. Users now define plain typed factories with `WorkerFactory<T>` and pass them to `createSharedWorkerRuntime`, which handles registry injection and duplicate key detection over a single shared context.
