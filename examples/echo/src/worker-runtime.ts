import { createSharedWorkerRuntime } from "../../../src/runtime";
import { echoWorker } from "./worker";
createSharedWorkerRuntime(echoWorker);
