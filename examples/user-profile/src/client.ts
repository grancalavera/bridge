import { createClient } from "../../../src/client";
import type { UserProfileContract } from "./contract";
import UserProfileWorker from "./worker-runtime?sharedworker";

export const [userProfileClient, subscribe] = createClient<UserProfileContract>(
  {
    sharedWorker: new UserProfileWorker({ name: "User Profile Worker" }),
  },
);
