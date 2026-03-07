import { createSharedWorkerRuntime } from "@grancalavera/bridge";
import { userProfileWorker } from "./worker";
createSharedWorkerRuntime(userProfileWorker);
