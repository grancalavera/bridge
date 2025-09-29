import { createClient } from "../../src/client";
import type { EchoContract } from "./contract";
import EchoWorker from "./worker-runtime?sharedworker";

export const [echoClient, subscribe] = createClient<EchoContract>({
  sharedWorker: new EchoWorker({ name: "Echo Worker" }),
});
