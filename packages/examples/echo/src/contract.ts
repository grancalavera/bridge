import type { Contract, Operation, Subscription } from "@grancalavera/bridge";

export type EchoContract = Contract<{
  echo: Operation<string, string>;
  subscribeEcho: Subscription<string, { timestamp?: boolean }>;
}>;
