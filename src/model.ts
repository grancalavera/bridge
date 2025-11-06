import * as Comlink from "comlink";
import { Observable } from "rxjs";

/**
 * Type helper that ensures only structured cloneable JavaScript types are allowed.
 * Based on: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types
 *
 * Supported JavaScript types:
 * - Array
 * - ArrayBuffer
a * - Boolean
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
> = [Input] extends [void]
  ? () => Promise<Response>
  : (input: Input) => Promise<Response>;

/**
 * Represents a mutation operation that modifies data.
 * Returns a Promise of the operation result.
 */
export type Mutation<
  Response extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = [Input] extends [void]
  ? () => Promise<Response>
  : (input: Input) => Promise<Response>;

/**
 * Represents a subscription operation that receives real-time updates.
 * Takes callback functions for next, error, and complete events, plus optional input parameters.
 * Returns a Promise of an unsubscribe function.
 */
export type Subscription<
  Update extends StructuredCloneable = void,
  Input extends StructuredCloneable = void,
> = [Input] extends [void]
  ? (
      onNext: (value: Update) => void,
      onError: (error: unknown) => void,
      onComplete: () => void,
    ) => Promise<() => void>
  : (
      onNext: (value: Update) => void,
      onError: (error: unknown) => void,
      onComplete: () => void,
      input: Input,
    ) => Promise<() => void>;

/**
 * A collection of operations (queries, mutations, and subscriptions)
 * mapped by their operation names.
 */
export type Operations = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (() => Promise<any>)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((input: any) => Promise<any>)
  | ((
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onNext: (value: any) => void,
      onError: (error: unknown) => void,
      onComplete: () => void,
    ) => Promise<() => void>)
  | ((
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onNext: (value: any) => void,
      onError: (error: unknown) => void,
      onComplete: () => void,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: any,
    ) => Promise<() => void>)
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
  [K in keyof T]: T[K] extends (
    onNext: (value: infer Update) => void,
    onError: (error: unknown) => void,
    onComplete: () => void,
  ) => Promise<() => void>
    ? (
        clientId: string,
        onNext: (value: Update) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
      ) => Promise<ProxyMarkedFunction<() => void>>
    : T[K] extends (
          onNext: (value: infer Update) => void,
          onError: (error: unknown) => void,
          onComplete: () => void,
          input: infer Input,
        ) => Promise<() => void>
      ? (
          clientId: string,
          onNext: (value: Update) => void,
          onError: (error: unknown) => void,
          onComplete: () => void,
          input: Input,
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
  [K in keyof T]: T[K] extends
    | ((
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onNext: (value: any) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
      ) => Promise<() => void>)
    | ((
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onNext: (value: any) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input: any,
      ) => Promise<() => void>)
    ? K
    : never;
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
> = T[K] extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNext: (value: any) => void,
  onError: (error: unknown) => void,
  onComplete: () => void,
  input: infer Input,
) => Promise<() => void>
  ? Input
  : void;

export const subscriptions = <T extends Operations>(client: T) => {
  function subscribe<K extends SubscriptionKey<T>>(
    key: K,
    ...args: SubscriptionInput<T, K> extends void
      ? []
      : [input: SubscriptionInput<T, K>]
  ) {
    type U = T[K] extends (
      onNext: (value: infer Update) => void,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => Promise<() => void>
      ? Update
      : never;

    return new Observable<U>((subscriber) => {
      const subscription = client[key] as unknown as (
        onNext: (value: U) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
        ...args: SubscriptionInput<T, K> extends void
          ? []
          : [input: SubscriptionInput<T, K>]
      ) => Promise<() => void>;

      const onNext = (value: U) => subscriber.next(value);
      const onError = (error: unknown) => subscriber.error(error);
      const onComplete = () => subscriber.complete();
      const unsubscribePromise = subscription(
        onNext,
        onError,
        onComplete,
        ...args,
      );

      return () => unsubscribePromise.then((f) => f());
    });
  }
  return subscribe;
};
