import { bind, Subscribe } from "@react-rxjs/core";
import { useState } from "react";
import { userProfileClient, subscribe } from "./client";
import type { User } from "./contract";

const [useUser] = bind((userId: number) => subscribe("watchUser", userId));

function App() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [queriedUser, setQueriedUser] = useState<User | null>(null);
  const [updateName, setUpdateName] = useState("");
  const [updateEmail, setUpdateEmail] = useState("");

  return (
    <div>
      <h3>User Profile Demo</h3>
      <p>
        This example demonstrates operations with <strong>required</strong>{" "}
        inputs.
      </p>
      <p>
        <a href="/">Home</a>
      </p>

      <section>
        <h4>Query User (with required input)</h4>
        <div>
          <button
            onClick={async () => {
              const user = await userProfileClient.getUser("user-1");
              setQueriedUser(user);
            }}
          >
            Get User 1
          </button>
          <button
            onClick={async () => {
              const user = await userProfileClient.getUser("user-2");
              setQueriedUser(user);
            }}
          >
            Get User 2
          </button>
          <button
            onClick={async () => {
              const user = await userProfileClient.getUser(3);
              setQueriedUser(user);
            }}
          >
            Get User 3
          </button>
        </div>
        {queriedUser && (
          <div>
            <p>
              <strong>Name:</strong> {queriedUser.name}
            </p>
            <p>
              <strong>Email:</strong> {queriedUser.email}
            </p>
            <p>
              <strong>Age:</strong> {queriedUser.age}
            </p>
          </div>
        )}
      </section>

      <section>
        <h4>Update User (with required input)</h4>
        <div>
          <select
            value={selectedUserId || ""}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
          >
            <option value="">Select a user</option>
            <option value="1">User 1</option>
            <option value="2">User 2</option>
            <option value="3">User 3</option>
          </select>
        </div>
        {selectedUserId && (
          <div>
            <input
              type="text"
              placeholder="New name"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
            />
            <input
              type="email"
              placeholder="New email"
              value={updateEmail}
              onChange={(e) => setUpdateEmail(e.target.value)}
            />
            <button
              onClick={async () => {
                const updates: Partial<User> = {};
                if (updateName) updates.name = updateName;
                if (updateEmail) updates.email = updateEmail;

                await userProfileClient.updateUser({
                  userId: selectedUserId,
                  updates,
                });

                setUpdateName("");
                setUpdateEmail("");
              }}
            >
              Update User
            </button>
          </div>
        )}
      </section>

      <section>
        <h4>Watch User (subscription with required input)</h4>
        <div>
          <button onClick={() => setSelectedUserId(1)}>Watch User 1</button>
          <button onClick={() => setSelectedUserId(2)}>Watch User 2</button>
          <button onClick={() => setSelectedUserId(3)}>Watch User 3</button>
          <button onClick={() => setSelectedUserId(null)}>Unwatch</button>
        </div>
        {selectedUserId && (
          <Subscribe fallback={<p>Loading user data...</p>}>
            <UserSubscription userId={selectedUserId} />
          </Subscribe>
        )}
      </section>
    </div>
  );
}

const UserSubscription = ({ userId }: { userId: number }) => {
  const user = useUser(userId);
  return (
    <div>
      <p>
        <strong>Name:</strong> {user.name}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Age:</strong> {user.age}
      </p>
    </div>
  );
};

export default App;
