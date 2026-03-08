import { map, share, Subject } from "rxjs";
import type { WorkerFactory } from "@grancalavera/bridge";
import type { EchoContract } from "./contract";

export const echoFactory: WorkerFactory<EchoContract> = ({ subscribe }) => {
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
    async subscribeEcho(clientId, onNotification, input) {
      const timestamp = input?.timestamp;
      const source$ = timestamp ? echoWithTimestamp$ : echo$;
      return subscribe(source$, clientId, onNotification);
    },
  };
};
