import * as Comlink from "comlink";
import type { ObservableNotification } from "rxjs";
import { describe, expectTypeOf, test } from "vitest";
import {
  Contract,
  Operation,
  ProxyMarkedFunction,
  Subscription,
} from "./model";
import { createWorkerFactory } from "./worker";

type TheContract = Contract<{
  operationWithoutInput: Operation<string, void>;
  operationWithInput: Operation<string, string>;
  subscriptionWithoutInput: Subscription<string, void>;
  subscriptionWithInput: Subscription<string, string>;
}>;

const create = createWorkerFactory();
const worker = create<TheContract>(() => ({
  operationWithoutInput: async () => "",
  operationWithInput: async (input: string) => input,
  subscriptionWithoutInput: async () => Comlink.proxy(() => {}),
  subscriptionWithInput: async () => Comlink.proxy(() => {}),
}));

describe("operation", () => {
  test("without input should return a promise of string", () => {
    expectTypeOf(worker.operationWithoutInput).returns.toEqualTypeOf<
      Promise<string>
    >();
  });

  test("with input should return a promise of string", () => {
    expectTypeOf(worker.operationWithInput).returns.toEqualTypeOf<
      Promise<string>
    >();
  });

  test("should take an input parameter at the last positional argument", () => {
    type Expected = [
      // the first argument is always the clientId
      string,
      string,
    ];

    expectTypeOf(
      worker.operationWithInput,
    ).parameters.toEqualTypeOf<Expected>();
  });

  test("should not take an input parameter at the last positional argument", () => {
    type Expected = [
      // the first argument is always the clientId
      string,
    ];

    expectTypeOf(
      worker.operationWithoutInput,
    ).parameters.toEqualTypeOf<Expected>();
  });
});

describe("subscription", () => {
  test("without input should return a promise of proxy marked function", () => {
    expectTypeOf(worker.subscriptionWithoutInput).returns.toEqualTypeOf<
      Promise<ProxyMarkedFunction<() => void>>
    >();
  });

  test("with input should return a promise of proxy marked function", () => {
    expectTypeOf(worker.subscriptionWithInput).returns.toEqualTypeOf<
      Promise<ProxyMarkedFunction<() => void>>
    >();
  });

  test("should take an input parameter at the last positional argument", () => {
    type Expected = [
      string,
      (notification: ObservableNotification<string>) => void,
      string,
    ];

    expectTypeOf(
      worker.subscriptionWithInput,
    ).parameters.toEqualTypeOf<Expected>();
  });

  test("should not take an input parameter at the last positional argument", () => {
    type Expected = [
      string,
      (notification: ObservableNotification<string>) => void,
    ];

    expectTypeOf(
      worker.subscriptionWithoutInput,
    ).parameters.toEqualTypeOf<Expected>();
  });
});
