import { createSharedWorkerRuntime } from "@grancalavera/bridge";
import { echoWorker } from "./worker";
createSharedWorkerRuntime(echoWorker);
