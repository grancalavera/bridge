import type { Contract, Operation, Subscription } from "../../../src/model";

export type UserId = number | string;

export type User = {
  id: UserId;
  name: string;
  email: string;
  age: number;
};

export type UserProfileContract = Contract<{
  getUser: Operation<User, UserId>;
  updateUser: Operation<User, { userId: UserId; updates: Partial<User> }>;
  watchUser: Subscription<User, UserId>;
}>;
