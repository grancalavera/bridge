import * as Comlink from "comlink";
import { describe, expectTypeOf, test } from "vitest";
import {
  Contract,
  Mutation,
  ProxyMarkedFunction,
  Query,
  Subscription,
} from "./model";
import { createWorker } from "./worker";

type TheContract = Contract<{
  queryWithoutInput: Query<string, void>;
  queryWithInput: Query<string, string>;
  mutationWithoutInput: Mutation<string, void>;
  mutationWithInput: Mutation<string, string>;
  subscriptionWithoutInput: Subscription<string, void>;
  subscriptionWithInput: Subscription<string, string>;
}>;

const worker = createWorker<TheContract>(() => ({
  queryWithoutInput: async () => "",
  queryWithInput: async (input: string) => input,
  mutationWithoutInput: async () => "",
  mutationWithInput: async (input: string) => input,
  subscriptionWithoutInput: async () => Comlink.proxy(() => {}),
  subscriptionWithInput: async () => Comlink.proxy(() => {}),
}));

describe("query", () => {
  test("without input should return a promise of string", () => {
    expectTypeOf(worker.queryWithoutInput).returns.toEqualTypeOf<
      Promise<string>
    >();
  });

  test("with input should return a promise of string", () => {
    expectTypeOf(worker.queryWithInput).returns.toEqualTypeOf<
      Promise<string>
    >();
  });

  test("should take an input parameter at the last positional argument", () => {
    type Expected = [
      // the first argument is always the clientId
      string,
      string,
    ];

    expectTypeOf(worker.queryWithInput).parameters.toEqualTypeOf<Expected>();
  });

  test("should not take an input parameter at the last positional argument", () => {
    type Expected = [
      // the first argument is always the clientId
      string,
    ];

    expectTypeOf(worker.queryWithoutInput).parameters.toEqualTypeOf<Expected>();
  });
});

describe("mutation", () => {
  test("without input should return a promise of string", () => {
    expectTypeOf(worker.mutationWithoutInput).returns.toEqualTypeOf<
      Promise<string>
    >();
  });

  test("with input should return a promise of string", () => {
    expectTypeOf(worker.mutationWithInput).returns.toEqualTypeOf<
      Promise<string>
    >();
  });

  test("should take an input parameter at the last positional argument", () => {
    type Expected = [
      // the first argument is always the clientId
      string,
      string,
    ];

    expectTypeOf(worker.mutationWithInput).parameters.toEqualTypeOf<Expected>();
  });

  test("should not take an input parameter at the last positional argument", () => {
    type Expected = [
      // the first argument is always the clientId
      string,
    ];

    expectTypeOf(
      worker.mutationWithoutInput,
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
      (x: string) => void,
      (x: unknown) => void,
      () => void,
      string,
    ];

    expectTypeOf(
      worker.subscriptionWithInput,
    ).parameters.toEqualTypeOf<Expected>();
  });

  test("should not take an input parameter at the last positional argument", () => {
    type Expected = [
      string,
      (x: string) => void,
      (x: unknown) => void,
      () => void,
    ];

    expectTypeOf(
      worker.subscriptionWithoutInput,
    ).parameters.toEqualTypeOf<Expected>();
  });
});
