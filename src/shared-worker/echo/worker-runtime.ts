import { createSharedWorkerRuntime } from "../core/runtime";
import { echoWorker } from "./worker";
createSharedWorkerRuntime(echoWorker);
