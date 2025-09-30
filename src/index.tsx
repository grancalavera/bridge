import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./examples.css";

const examples = [
  {
    name: "echo",
    title: "Echo Example",
    description: "SharedWorker echo demo with RxJS subscriptions",
  },
];

function App() {
  return (
    <div className="container">
      <h1>Bridge Examples</h1>
      <p>Type-Safe Contract-Based SharedWorker Abstraction</p>
      <div className="examples-list">
        {examples.map((example) => (
          <a
            key={example.name}
            href={`/examples/${example.name}/`}
            className="example-card"
          >
            <h2>{example.title}</h2>
            <p>{example.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
