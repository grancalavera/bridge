import { describe, expectTypeOf, it } from "vitest";
import type { WorkerFactory, WorkerContext } from "./worker";
import type { Operation, WorkerContract } from "./model";

describe("WorkerFactory type constraint", () => {
  it("resolves to never when T includes registerClient", () => {
    type WithRegisterClient = { registerClient: Operation };
    expectTypeOf<WorkerFactory<WithRegisterClient>>().toBeNever();
  });

  it("resolves to a function type for valid operations", () => {
    type ValidOps = { echo: Operation<string> };
    expectTypeOf<WorkerFactory<ValidOps>>().toEqualTypeOf<
      (context: WorkerContext) => WorkerContract<ValidOps>
    >();
  });

  it("resolves to never even with other operations alongside registerClient", () => {
    type MixedOps = {
      echo: Operation<string>;
      registerClient: Operation;
    };
    expectTypeOf<WorkerFactory<MixedOps>>().toBeNever();
  });

  it("accepts a specific operations type without registerClient", () => {
    type SimpleOps = { greet: Operation<string> };
    expectTypeOf<WorkerFactory<SimpleOps>>().not.toBeNever();
  });
});
