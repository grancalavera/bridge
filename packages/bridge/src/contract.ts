import type { Contract, Operation } from "./model";

/**
 * Built-in contract for client registration and lifecycle management.
 *
 * This contract is hardcoded in the library because client registration
 * and cleanup are fundamental to the SharedWorker lifecycle — without
 * them, subscriptions would leak when tabs close.
 *
 * Every SharedWorker created with {@link createSharedWorkerRuntime} automatically
 * includes this contract so that clients can register themselves and
 * have their subscriptions cleaned up on disconnect.
 */
export type RegistryContract = Contract<{
  registerClient: Operation;
}>;
