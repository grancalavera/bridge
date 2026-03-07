---
"@grancalavera/bridge": minor
---

Replace subscription callbacks with materialized observables. Subscriptions now use a single `onNotification` callback receiving RxJS `ObservableNotification<T>` instead of separate `onNext`, `onError`, and `onComplete` callbacks. This is a breaking change for custom `WorkerFactory` implementations that use the `subscribe` helper from `WorkerContext`.
