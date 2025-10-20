import { createSharedWorkerRuntime } from "../../../src/runtime";
import { userProfileWorker } from "./worker";
createSharedWorkerRuntime(userProfileWorker);
