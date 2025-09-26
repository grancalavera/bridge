import * as Comlink from "comlink";
import { from, Observable, switchMap } from "rxjs";

/**
 * Type helper that ensures only structured cloneable JavaScript types are allowed.
 * Based on: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types
 *
 * Supported JavaScript types:
 * - Array
 * - ArrayBuffer
 * - Boolean
 * - DataView
 * - Date
 * - Map
 * - Number (including bigint)
 * - Object (plain objects from object literals only)
 * - Primitive types (except symbol)
 * - RegExp (note: lastIndex is not preserved)
 * - Set
 * - String
 * - TypedArray (Int8Array, Uint8Array, etc.)
 */
type StructuredCloneable =
  | boolean
  | number
  | bigint
  | string
  | null
  | undefined
  | void
  | Date
  | RegExp
  | ArrayBuffer
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array
  | DataView
  | StructuredCloneable[]
  | { [key: string]: StructuredCloneable }
  | Map<StructuredCloneable, StructuredCloneable>
  | Set<StructuredCloneable>;

/**
 * Type helper for Comlink proxy-marked functions.
 * These are functions that have been wrapped with Comlink.proxy() and can be
 * transferred across worker boundaries while maintaining their callable nature.
 */
export type ProxyMarkedFunction<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any = (...args: any[]) => any,
> = T & Comlink.ProxyMarked;

/**
 * Represents a query operation that retrieves data.
 * Returns a Promise of the response data.
 */
export type Query<
  Response extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = Input extends void
  ? () => Promise<Response>
  : (input?: Input) => Promise<Response>;

/**
 * Represents a mutation operation that modifies data.
 * Returns a Promise of the operation result.
 */
export type Mutation<
  Response extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = Input extends void
  ? () => Promise<Response>
  : (input?: Input) => Promise<Response>;

/**
 * Represents a subscription operation that receives real-time updates.
 * Takes a callback function and optional input parameters.
 * Returns a Promise of an unsubscribe function.
 */
export type Subscription<
  Update extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = Input extends void
  ? (callback: (value: Update) => void) => Promise<() => void>
  : (callback: (value: Update) => void, input?: Input) => Promise<() => void>;

/**
 * A collection of operations (queries, mutations, and subscriptions)
 * mapped by their operation names.
 */
export type Operations = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Query<any, any> | Mutation<any, any> | Subscription<any, any>
>;

/**
 * A contract defining the available operations for client-worker communication.
 * Simply aliases the Operations type with proper type constraints.
 */
export type Contract<T extends Operations> = T;

/**
 * Worker-side version of a contract where each operation receives
 * an additional clientId parameter as the first argument.
 * This allows the worker to identify which client is making the request.
 *
 * For subscriptions, enforces that return values are ProxyMarkedFunction
 * wrapped in Promise.
 */
export type WorkerContract<T extends Operations> = {
  [K in keyof T]: T[K] extends Subscription<infer Update, infer Input>
    ? Input extends void
      ? (
          clientId: string,
          callback: (value: Update) => void,
        ) => Promise<ProxyMarkedFunction<() => void>>
      : (
          clientId: string,
          callback: (value: Update) => void,
          input?: Input,
        ) => Promise<ProxyMarkedFunction<() => void>>
    : T[K] extends (...args: infer Args) => infer Return
      ? (clientId: string, ...args: Args) => Return
      : T[K];
};

/**
 * A Comlink remote proxy for a worker contract.
 * This wraps the WorkerContract type with Comlink's Remote type,
 * providing type-safe communication across the worker boundary.
 */
export type WorkerProxy<T extends Operations> = Comlink.Remote<
  WorkerContract<T>
>;

/**
 * Creates a Comlink remote proxy for the given worker contract using the provided MessagePort.
 * @param port The MessagePort to communicate with the worker.
 * @returns A Comlink remote proxy for the worker contract.
 */
export const wrapWorkerPort = <T extends Operations>(port: MessagePort) =>
  Comlink.wrap<WorkerContract<T>>(port);

/**
 * Extracts only the keys from an Operations interface that correspond to Subscription types.
 * This utility type filters out Query and Mutation operations, leaving only subscription keys.
 *
 * Example:
 * ```typescript
 * interface MyOperations {
 *   getData: Query<void, string>;
 *   updateData: Mutation<string, void>;
 *   watchChanges: Subscription<void, number>;
 * }
 *
 * type SubKeys = SubscriptionKey<MyOperations>; // "watchChanges"
 * ```
 */
export type SubscriptionKey<T extends Operations> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends Subscription<any, any> ? K : never;
}[keyof T];

/**
 * Extracts the input type from a subscription operation.
 * This utility type retrieves the Input type parameter from a Subscription type.
 *
 * Example:
 * ```typescript
 * interface MyOperations {
 *   watchChanges: Subscription<number, { userId: string }>;
 * }
 *
 * type Input = SubscriptionInput<MyOperations, "watchChanges">; // { userId: string } | undefined
 * ```
 */
export type SubscriptionInput<
  T extends Operations,
  K extends SubscriptionKey<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = T[K] extends Subscription<any, infer Input> ? Input : never;

/**
 * Creates an RxJS operator that subscribes to a specific subscription operation on a client.
 * This function bridges the gap between the callback-based subscription API and RxJS observables.
 *
 * @param key The subscription key to subscribe to (must be a valid subscription operation)
 * @param input Optional input parameter for the subscription (if required)
 * @returns An RxJS operator that takes a client and returns an Observable of subscription updates
 *
 * Usage:
 * ```typescript
 * // Given a client with subscription operations
 * const client$ = of(myClient);
 *
 * // Subscribe to updates from a specific subscription
 * const updates$ = client$.pipe(
 *   subscribeTo('watchChanges', { userId: 'user123' })
 * );
 *
 * updates$.subscribe(update => console.log('Received:', update));
 * ```
 *
 * The operator:
 * 1. Extracts the Update type from the subscription
 * 2. Creates an Observable that wraps the callback-based subscription
 * 3. Handles cleanup by calling the unsubscribe function when the observable is unsubscribed
 */
export const subscribeTo = <T extends Operations, K extends SubscriptionKey<T>>(
  key: K,
  input?: SubscriptionInput<T, K>,
) =>
  switchMap((client: T) => {
    type U =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T[K] extends Subscription<infer Update, any> ? Update : never;

    return new Observable<U>((subscriber) => {
      const subscription = client[key] as unknown as (
        callback: (value: U) => void,
        input?: SubscriptionInput<T, K>,
      ) => Promise<() => void>;

      const callback = (value: U) => subscriber.next(value);
      const unsubscribePromise = subscription(callback, input);

      return () => unsubscribePromise.then((f: () => void) => f());
    });
  });

export const fromClient = <T extends Operations, K extends SubscriptionKey<T>>(
  client: Promise<T>,
  key: K,
  input?: SubscriptionInput<T, K>,
) => from(client).pipe(subscribeTo(key, input));
