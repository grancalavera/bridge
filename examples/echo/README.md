# Echo Example

This example demonstrates a simple echo service using Bridge with SharedWorker and RxJS observables.

## What it does

- **Echo Mutation**: Send a message to the worker and get an echoed response with client ID prefix
- **Subscribe to Echo**: Subscribe to all echo messages from any client
- **Timestamped Subscription**: Subscribe to echo messages with ISO timestamp prefix

## Files

- `src/contract.ts` - TypeScript contract defining the worker API
- `src/worker.ts` - Worker implementation using RxJS subjects
- `src/worker-runtime.ts` - Worker entry point
- `src/client.ts` - Client-side setup and subscription helper
- `src/App.tsx` - React UI demonstrating the echo functionality
- `src/main.tsx` - Application entry point

## How to run

From the repository root:

```bash
npm install
npm run dev
```

Then navigate to the echo example in your browser.
