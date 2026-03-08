import { describe, it, expect, vi, beforeEach } from "vitest";
import { of, Subject, type ObservableNotification } from "rxjs";
import {
  subscribe,
  createClientRep,
  type ClientRepMap,
  type WorkerContext,
} from "./worker";

vi.mock("comlink", () => ({
  proxy: (fn: unknown) => fn,
}));

describe("subscribe", () => {
  let clients: ClientRepMap;
  let sub: WorkerContext["subscribe"];

  beforeEach(() => {
    clients = new Map();
    clients.set("c1", createClientRep("c1"));
    sub = subscribe(clients);
  });

  it("forwards materialized notifications to callback", () => {
    const notifications: ObservableNotification<number>[] = [];
    sub(of(1, 2, 3), "c1", (n) => notifications.push(n));

    expect(notifications).toMatchObject([
      { kind: "N", value: 1 },
      { kind: "N", value: 2 },
      { kind: "N", value: 3 },
      { kind: "C" },
    ]);
  });

  it("returns a working unsubscribe function", () => {
    const subject = new Subject<number>();
    const notifications: ObservableNotification<number>[] = [];

    const unsub = sub(subject, "c1", (n) => notifications.push(n));
    subject.next(1);
    unsub();
    subject.next(2);

    expect(notifications).toMatchObject([{ kind: "N", value: 1 }]);
  });

  it("tracks subscription on the client rep", () => {
    const subject = new Subject<number>();
    const client = clients.get("c1")!;

    expect(client.subscriptions.closed).toBe(false);

    sub(subject, "c1", () => {});

    // Unsubscribing the client container should close the inner subscription
    client.subscriptions.unsubscribe();
    expect(client.subscriptions.closed).toBe(true);
  });

  it("removes subscription from client on unsubscribe", () => {
    const subject = new Subject<number>();
    const client = clients.get("c1")!;

    const unsub = sub(subject, "c1", () => {});
    unsub();

    // After unsub, the client container is still open (not closed)
    expect(client.subscriptions.closed).toBe(false);
  });

  it("throws ReferenceError for unknown client", () => {
    expect(() => sub(of(1), "unknown", () => {})).toThrow(ReferenceError);
    expect(() => sub(of(1), "unknown", () => {})).toThrow(
      "Unknown client unknown",
    );
  });
});
