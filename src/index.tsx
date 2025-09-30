import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./examples.css";

interface Example {
  name: string;
  path: string;
  title: string;
  description: string;
}

function App() {
  const [examples, setExamples] = useState<Example[]>([]);

  useEffect(() => {
    const exampleReadmes = import.meta.glob("../examples/*/README.md", {
      query: "?raw",
      import: "default",
      eager: true,
    });

    const discoveredExamples = Object.entries(exampleReadmes).map(
      ([path, content]) => {
        const match = path.match(/examples\/([^/]+)/);
        const exampleName = match ? match[1] : "";

        const lines = (content as string).split("\n");
        const title =
          lines
            .find((line: string) => line.startsWith("# "))
            ?.replace("# ", "") || exampleName;
        const description =
          lines.find((line: string) => line.trim() && !line.startsWith("#")) ||
          "";

        return {
          name: exampleName,
          path: `/examples/${exampleName}/`,
          title,
          description,
        };
      }
    );

    setExamples(discoveredExamples);
  }, []);

  return (
    <div className="container">
      <h1>Bridge Examples</h1>
      <p>Type-Safe Contract-Based SharedWorker Abstraction</p>
      <div className="examples-list">
        {examples.map((example) => (
          <a key={example.name} href={example.path} className="example-card">
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
