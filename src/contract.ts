import type { Contract, Operation } from "./model";

export type RegistryContract = Contract<{
  registerClient: Operation;
}>;
