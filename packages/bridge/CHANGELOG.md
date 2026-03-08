# @grancalavera/bridge

## 0.6.0

### Minor Changes

- 9afb597: Replace subscription callbacks with materialized observables. Subscriptions now use a single `onNotification` callback receiving RxJS `ObservableNotification<T>` instead of separate `onNext`, `onError`, and `onComplete` callbacks. This is a breaking change for custom `WorkerFactory` implementations that use the `subscribe` helper from `WorkerContext`.
- db3733c: Restructure project as a monorepo with npm workspaces. The library now lives in `packages/bridge/` and examples in `packages/examples/`. Added Claude Code and mise configuration.
- 0fed1e7: Replace `Query` and `Mutation` types with unified `Operation` type. Both types were structurally identical (`(input?) => Promise<Response>`), so they have been merged into a single `Operation<Response, Input>` type. This is a breaking change: update imports from `Query`/`Mutation` to `Operation`.

### Patch Changes

- 4cd99ad: Add JSDoc documentation to remaining undocumented public API exports
