import { bind, Subscribe } from "@react-rxjs/core";
import { useState } from "react";
import { from } from "rxjs";
import { subscribeTo } from "./shared-worker/core/model";
import * as echo from "./shared-worker/echo";

const [useEcho] = bind(
  from(echo.getClient()).pipe(subscribeTo("subscribeEcho")),
);

const [useEchoWithTimestamp] = bind(
  from(echo.getClient()).pipe(
    subscribeTo("subscribeEcho", { timestamp: true }),
  ),
);

const sendEcho = async (message: string) => {
  const client = await echo.getClient();
  return client.echo(message);
};

function App() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTimestampSubscribed, setIsTimestampSubscribed] = useState(false);
  const [echoResponse, setEchoResponse] = useState<string>("...");
  const [count, setCount] = useState(0);
  return (
    <div>
      <h3>Shared Worker Echo Demo</h3>
      <p>
        <a href="/">Home</a>
      </p>
      <section>
        <button
          onClick={async () => {
            setCount((i) => i + 1);
            const response = await sendEcho(`Hello World! [${count}]`);
            setEchoResponse(response);
          }}
        >
          Send Echo: next [{count}]
        </button>
        <p>Response: {echoResponse}</p>
      </section>
      <section>
        <button onClick={() => setIsSubscribed((current) => !current)}>
          {isSubscribed ? "Unsubscribe" : "Subscribe"}
        </button>
        {isSubscribed && (
          <Subscribe fallback={<p>Waiting for messages...</p>}>
            <EchoSubscription />
          </Subscribe>
        )}
      </section>
      <section>
        <button onClick={() => setIsTimestampSubscribed((current) => !current)}>
          {isTimestampSubscribed
            ? "Unsubscribe Timestamp"
            : "Subscribe with Timestamp"}
        </button>
        {isTimestampSubscribed && (
          <Subscribe fallback={<p>Waiting for timestamped messages...</p>}>
            <EchoTimestampSubscription />
          </Subscribe>
        )}
      </section>
    </div>
  );
}

const EchoSubscription = () => {
  const echo = useEcho();
  return <p>{echo}</p>;
};

const EchoTimestampSubscription = () => {
  const echo = useEchoWithTimestamp();
  return <p>{echo}</p>;
};

export default App;
