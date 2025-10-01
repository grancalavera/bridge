# Bridge Repository - Agent Guidelines

## Build & Development Commands

- **Development**: `npm run dev` - Start Vite dev server with hot reload
- **Build**: `npm run build` - TypeScript check + production build
- **Type Check**: `npm run typecheck` - Run TypeScript compiler without emitting
- **Preview**: `npm run preview` - Preview production build locally
- **No test runner configured** - Testing framework not yet implemented

## Code Style & Conventions

- **TypeScript**: Strict mode enabled, no unused locals/parameters allowed
- **Module System**: ES modules with `.ts`/`.tsx` extensions in imports
- **React**: Use React 19 with SWC, JSX transform via `react-jsx`
- **Imports**: Use named exports, group by external → shared → relative
- **State Management**: RxJS with @react-rxjs for reactive patterns
- **Worker Communication**: Comlink for SharedWorker proxy patterns
- **Naming**: camelCase for functions/variables, PascalCase for types/components
- **Async**: Prefer async/await over raw promises, use `Promise.withResolvers()`
- **Error Handling**: Always handle async errors, use try-catch blocks
- **File Structure**: Organize by feature in `src/shared-worker/[feature]/`
- **No linting config**: No ESLint/Prettier configured - follow existing patterns

## Bridge Library

Bridge is a library to simplify communication and state sharing between different browsing contexts.

- The library should bundled using [tsdown](https://tsdown.dev/) and must include source maps, type declarations and declaration maps.

- The library package should include both the runtime version along with the entire source code.

- Declaration maps must allow library users to follow any type of implementation from a code editor and open the original source file where the implementation is written, as opposed to the declaration file.

- There should be an independent build that bundles the library.

## Examples

- The examples for this project live in the `examples` directory.
- Each example is its own React application with the following structure:
  - `examples/{example-name}/src/main.tsx` - Entry point
  - `examples/{example-name}/src/App.tsx` - Root component
  - `examples/{example-name}/index.html` - HTML template
  - `examples/{example-name}/README.md` - Example documentation
  - All other example files go directly under `examples/{example-name}/src/`
- There is a single shared stylesheet at `examples/styles.css` can be imported by all examples
- There's a single top level `vite.config.ts` file
- Example entries are generated dynamically in `vite.config.ts` and added to `build.rollupOptions.input`
- All examples are listed at `/` in runtime. The examples index is produced dynamically as new examples are added.
