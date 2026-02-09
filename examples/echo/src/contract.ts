import type { Contract, Operation, Subscription } from "../../../src/model";

export type EchoContract = Contract<{
  echo: Operation<string, string>;
  subscribeEcho: Subscription<string, { timestamp?: boolean }>;
}>;
