# Echo Example

This example demonstrates a simple echo service using Bridge with SharedWorker and RxJS observables.

## What it does

- **Echo RPC**: Send a message to the worker and get an echoed response with client ID prefix
- **Subscribe to Echo**: Subscribe to all echo messages from any client
- **Timestamped Subscription**: Subscribe to echo messages with ISO timestamp prefix

## Files

- `contract.ts` - TypeScript contract defining the worker API
- `worker.ts` - Worker implementation using RxJS subjects
- `worker-runtime.ts` - Worker entry point
- `index.ts` - Client-side exports
- `ui/` - React UI demonstrating the echo functionality

## How to run

From the repository root:

```bash
npm run dev
```

Then open the echo example in your browser.
