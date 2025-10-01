import type { Contract, Mutation } from "./model";

export type RegistryContract = Contract<{
  registerClient: Mutation;
}>;
