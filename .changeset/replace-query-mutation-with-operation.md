---
"@grancalavera/bridge": minor
---

Replace `Query` and `Mutation` types with unified `Operation` type. Both types were structurally identical (`(input?) => Promise<Response>`), so they have been merged into a single `Operation<Response, Input>` type. This is a breaking change: update imports from `Query`/`Mutation` to `Operation`.
