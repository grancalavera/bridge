import { map, share, Subject } from "rxjs";
import { createWorker } from "../core/worker";
import type { EchoContract } from "./contract";

export const echoWorker = createWorker<EchoContract>(
  ({ notify, subscribe }) => {
    const echo$ = new Subject<string>();

    const echoWithTimestamp$ = echo$.pipe(
      map((message) => `[${new Date().toISOString()}] ${message}`),
      share(),
    );

    return {
      async echo(clientId, value) {
        const message = `[${clientId}] ${value}`;
        console.log("echo", { clientId, message });
        return notify(echo$, message);
      },
      async subscribeEcho(clientId, callback, input) {
        console.log("subscribeEcho", { clientId, input });
        const timestamp = input?.timestamp;
        return subscribe(
          timestamp ? echoWithTimestamp$ : echo$,
          clientId,
          callback,
        );
      },
    };
  },
);
