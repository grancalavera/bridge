import { createSharedWorkerRuntime } from "@grancalavera/bridge";
import { userProfileFactory } from "./worker";
createSharedWorkerRuntime(userProfileFactory);
