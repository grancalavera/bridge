import type {
  Contract,
  Query,
  Mutation,
  Subscription,
} from "../../../src/model";

export type UserId = number | string;

export type User = {
  id: UserId;
  name: string;
  email: string;
  age: number;
};

export type UserProfileContract = Contract<{
  getUser: Query<User, UserId>;
  updateUser: Mutation<User, { userId: UserId; updates: Partial<User> }>;
  watchUser: Subscription<User, UserId>;
}>;
