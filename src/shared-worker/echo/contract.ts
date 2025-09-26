import type { Contract, Mutation, Subscription } from "../core/model";

export type EchoContract = Contract<{
  echo: Mutation<string, string>;
  subscribeEcho: Subscription<string, { timestamp?: boolean }>;
}>;
