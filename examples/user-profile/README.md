# User Profile Example

This example demonstrates the use of Bridge operations with **required inputs**. It showcases how Query, Mutation, and Subscription types correctly enforce required parameters when a non-void input type is specified.

## Features

- **Query with Required Input**: `getUser` requires a `userId` parameter to fetch user data
- **Mutation with Required Input**: `updateUser` requires both `userId` and `updates` parameters to modify user data
- **Subscription with Required Input**: `watchUser` requires a `userId` parameter to watch real-time updates for a specific user

## Type Safety

All operations in this example have required inputs, demonstrating the fix for [issue #9](https://github.com/grancalavera/bridge/issues/9):

```typescript
// Query - input is required
const user = await userProfileClient.getUser({ userId: "user-1" });

// Mutation - input is required
await userProfileClient.updateUser({
  userId: "user-1",
  updates: { name: "New Name" },
});

// Subscription - input is required
subscribe("watchUser", { userId: "user-1" });
```

## Running the Example

```bash
npm run dev
```

Then navigate to the user-profile example from the home page.
