import { BehaviorSubject, map, share } from "rxjs";
import { createWorker } from "../../../src/worker";
import type { User, UserId, UserProfileContract } from "./contract";

export const userProfileWorker = createWorker<UserProfileContract>(
  ({ subscribe }) => {
    const users = new Map<UserId, BehaviorSubject<User>>([
      [
        "user-1",
        new BehaviorSubject<User>({
          id: "user-1",
          name: "Alice Johnson",
          email: "alice@example.com",
          age: 28,
        }),
      ],
      [
        "user-2",
        new BehaviorSubject<User>({
          id: "user-2",
          name: "Bob Smith",
          email: "bob@example.com",
          age: 35,
        }),
      ],
      [
        3,
        new BehaviorSubject<User>({
          id: 3,
          name: "Carol Davis",
          email: "carol@example.com",
          age: 42,
        }),
      ],
    ]);

    const getOrCreateUser = (userId: UserId): BehaviorSubject<User> => {
      const key = userId;
      if (!users.has(key)) {
        users.set(
          key,
          new BehaviorSubject<User>({
            id: key,
            name: "Unknown User",
            email: "unknown@example.com",
            age: 0,
          }),
        );
      }
      return users.get(key)!;
    };

    return {
      async getUser(clientId: string, userId: UserId) {
        console.log(`[${clientId}] getUser called with userId: ${userId}`);
        const user$ = getOrCreateUser(userId);
        return user$.value;
      },

      async updateUser(
        clientId: string,
        input: { userId: UserId; updates: Partial<User> },
      ) {
        console.log(
          `[${clientId}] updateUser called with userId: ${input.userId}`,
        );
        const user$ = getOrCreateUser(input.userId);
        const updatedUser = { ...user$.value, ...input.updates };
        user$.next(updatedUser);
        return updatedUser;
      },

      async watchUser(
        clientId: string,
        onNext: (value: User) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
        userId: UserId,
      ) {
        console.log(`[${clientId}] watchUser called with userId: ${userId}`);
        const user$ = getOrCreateUser(userId);
        const observable$ = user$.pipe(
          map((user) => ({
            ...user,
            name: `${user.name} (watched by ${clientId})`,
          })),
          share(),
        );
        return subscribe(observable$, clientId, onNext, onError, onComplete);
      },
    };
  },
);
