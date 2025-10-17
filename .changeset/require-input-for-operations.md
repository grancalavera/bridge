---
"@grancalavera/bridge": minor
---

Make input parameters required for Query, Mutation, and Subscription types when a non-void input type is provided. This is a breaking change that ensures type safety by requiring inputs when they are specified in the type signature.

The type system now supports union types (e.g., `string | number`) as primitive inputs. The Operations type has been updated to use direct function signatures instead of conditional type references, fixing TypeScript distribution issues with union types.
