# Model Notes

see [model.ts](./model.ts)

## Structured Cloneable Input Parameters

All operations (queries, mutations, and subscriptions) will use structured cloneable input parameters to simplify the worker implementation and provide consistent API patterns.

### New Operation Signatures

```typescript
// Queries and Mutations
export type Query<
  Response extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = Input extends void
  ? () => Promise<Response>
  : (input?: Input) => Promise<Response>;

export type Mutation<
  Response extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = Input extends void
  ? () => Promise<Response>
  : (input?: Input) => Promise<Response>;

// Subscriptions
export type Subscription<
  Update extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = Input extends void
  ? (callback: (value: Update) => void) => Promise<() => void>
  : (callback: (value: Update) => void, input?: Input) => Promise<() => void>;
```

### Key Changes

1. **Single Optional Parameter**: Queries and mutations now take a single optional `input` parameter of type `StructuredCloneable`
2. **Subscription Parameters**: Subscriptions take two parameters:
   - Required `callback: (value: Update) => void`
   - Optional `input?: Input` of type `StructuredCloneable`
3. **Consistent Structure**: All input parameters must be structured cloneable objects, eliminating the complexity of handling multiple optional arguments

### Benefits

- Simpler worker implementation - no need for function overloads
- Consistent API pattern across all operation types
- Clear parameter structure using structured cloneable objects
- Eliminates issues with optional parameter positioning
