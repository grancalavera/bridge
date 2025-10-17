import { BehaviorSubject, map, share } from "rxjs";
import { createWorker } from "../../../src/worker";
import type { User, UserProfileContract } from "./contract";

export const userProfileWorker = createWorker<UserProfileContract>(
  ({ subscribe }) => {
    const users = new Map<string, BehaviorSubject<User>>([
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
        "user-3",
        new BehaviorSubject<User>({
          id: "user-3",
          name: "Carol Davis",
          email: "carol@example.com",
          age: 42,
        }),
      ],
    ]);

    const getOrCreateUser = (userId: string): BehaviorSubject<User> => {
      if (!users.has(userId)) {
        users.set(
          userId,
          new BehaviorSubject<User>({
            id: userId,
            name: "Unknown User",
            email: "unknown@example.com",
            age: 0,
          }),
        );
      }
      return users.get(userId)!;
    };

    return {
      async getUser(clientId, input) {
        console.log(
          `[${clientId}] getUser called with userId: ${input.userId}`,
        );
        const user$ = getOrCreateUser(input.userId);
        return user$.value;
      },

      async updateUser(clientId, input) {
        console.log(
          `[${clientId}] updateUser called with userId: ${input.userId}`,
        );
        const user$ = getOrCreateUser(input.userId);
        const updatedUser = { ...user$.value, ...input.updates };
        user$.next(updatedUser);
        return updatedUser;
      },

      async watchUser(clientId, onNext, onError, onComplete, input) {
        console.log(
          `[${clientId}] watchUser called with userId: ${input.userId}`,
        );
        const user$ = getOrCreateUser(input.userId);
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
