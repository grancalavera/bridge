import { createSharedWorkerRuntime } from "@grancalavera/bridge";
import { echoFactory } from "./worker";
createSharedWorkerRuntime(echoFactory);
