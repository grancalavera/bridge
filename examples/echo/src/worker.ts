import { map, share, Subject } from "rxjs";
import { createWorker } from "../../../src/worker";
import type { EchoContract } from "./contract";

export const echoWorker = createWorker<EchoContract>(({ subscribe }) => {
  const echo$ = new Subject<string>();

  const echoWithTimestamp$ = echo$.pipe(
    map((message) => `[${new Date().toISOString()}] ${message}`),
    share(),
  );

  return {
    async echo(clientId, value) {
      const message = `[${clientId}] ${value}`;
      echo$.next(message);
      return message;
    },
    async subscribeEcho(clientId, onNext, onError, onComplete, input) {
      const timestamp = input?.timestamp;
      return subscribe(
        timestamp ? echoWithTimestamp$ : echo$,
        clientId,
        onNext,
        onError,
        onComplete,
      );
    },
  };
});
