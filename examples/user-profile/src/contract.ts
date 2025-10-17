import type {
  Contract,
  Query,
  Mutation,
  Subscription,
} from "../../../src/model";

export type User = {
  id: string;
  name: string;
  email: string;
  age: number;
};

export type UserProfileContract = Contract<{
  getUser: Query<User, { userId: string }>;
  updateUser: Mutation<User, { userId: string; updates: Partial<User> }>;
  watchUser: Subscription<User, { userId: string }>;
}>;
