# Bridge Repository - Agent Guidelines

## Project Structure

This is a monorepo using npm workspaces with two packages:

```
bridge/
├── packages/
│   ├── bridge/          # The library package (@grancalavera/bridge)
│   │   ├── src/
│   │   ├── tests/
│   │   ├── dist/        # Build output
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsdown.config.ts
│   │   └── vitest.config.ts
│   └── examples/        # Demo applications (@grancalavera/bridge-examples)
│       ├── echo/
│       ├── user-profile/
│       ├── index.html   # Examples index
│       ├── index.tsx     # Examples index React app
│       ├── styles.css   # Shared reset styles
│       ├── examples.css # Examples index styles
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── .changeset/
├── .github/workflows/
├── .husky/
├── eslint.config.js
├── tsconfig.json        # Base TypeScript config
├── package.json         # Root workspace configuration
└── ...
```

## Build & Development Commands

- **Development**: `npm run dev` - Start Vite dev server for examples
- **Build**: `npm run build` - TypeScript check + build library to `packages/bridge/dist/`
- **Build Examples**: `npm run build:examples` - Build example applications
- **Type Check**: `npm run typecheck` - Type-check the library package
- **Type Check Examples**: `npm run typecheck:examples` - Type-check the examples package
- **Test**: `npm test` - Run Vitest test suite for the library
- **Test Watch**: `npm run test:watch` - Run tests in watch mode
- **Lint**: `npm run lint` - Run ESLint across the entire repo
- **Format**: `npm run format` - Format code with Prettier

## Versioning & Changelog

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

### Workflow

1. **Add a changeset** when making changes:

   ```bash
   npx changeset
   ```

   - Select package(s) to bump
   - Choose bump type: `major` (breaking) | `minor` (feature) | `patch` (fix)
   - Write a summary for the changelog

2. **Version packages** when ready to release:

   ```bash
   npx changeset version
   ```

   - Consumes all changeset files in `.changeset/`
   - Updates `package.json` version
   - Generates/updates `CHANGELOG.md`

3. **Publish** is handled automatically by GitHub Actions when changes are merged to `main`

### Notes

- Pre-1.0: Breaking changes use `minor` bumps, not `major`
- Changesets are stored as `.changeset/*.md` files
- The highest bump type across all changesets determines the final version bump
- Configuration in `.changeset/config.json`
- The examples package (`@grancalavera/bridge-examples`) is ignored by changesets

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
- **File Structure**: Library code in `packages/bridge/src/`, examples in `packages/examples/`
- **Linting & Formatting**:
  - ESLint configured with TypeScript and React plugins
  - Prettier with default settings (double quotes, 2 spaces, semicolons)
  - Pre-commit hook runs typecheck, lint, and format automatically
  - Run `npm run lint` to check for linting errors
  - Run `npm run format` to format code with Prettier

## Bridge Library

Bridge is a library to simplify communication and state sharing between different browsing contexts.

- The library should bundled using [tsdown](https://tsdown.dev/) and must include source maps, type declarations and declaration maps.

- The library must include all exported values in "src", but **nothing** from examples.

- The library package should include both the runtime version along with the entire source code.

- Declaration maps must allow library users to follow any type of implementation from a code editor and open the original source file where the implementation is written, as opposed to the declaration file.

- There should be an independent build that bundles the library.

## Examples

- The examples for this project live in the `packages/examples` directory.
- Each example is its own React application with the following structure:
  - `packages/examples/{example-name}/src/main.tsx` - Entry point
  - `packages/examples/{example-name}/src/App.tsx` - Root component
  - `packages/examples/{example-name}/index.html` - HTML template
  - `packages/examples/{example-name}/README.md` - Example documentation
  - All other example files go directly under `packages/examples/{example-name}/src/`
- Examples import from `@grancalavera/bridge` as a workspace dependency
- There is a shared reset stylesheet at `packages/examples/styles.css` imported by all examples
- Vite config is at `packages/examples/vite.config.ts`
- Example entries are generated dynamically in the Vite config and added to `build.rollupOptions.input`
- All examples are listed at `/` in runtime. The examples index is produced dynamically as new examples are added.

## Testing Strategy

**Framework**: Vitest

### Test Structure

- **Unit Tests** (`packages/bridge/src/**/*.test.ts`) - Test individual library functions
  - Type system validation (Contract, Query, Mutation, Subscription types)
  - Client creation and proxy generation logic
  - Worker context helpers (notify, subscribe)
  - Structured cloneable type constraints

- **Integration Tests** (`packages/bridge/tests/integration/**/*.test.ts`) - Test library from `dist/`
  - Import from `dist/index.js` (ESM) and `dist/index.cjs` (CJS)
  - Verify all public exports are accessible
  - Test SharedWorker communication patterns end-to-end
  - Validate RxJS subscription lifecycle

- **Build Artifact Tests** (`packages/bridge/tests/build/**/*.test.ts`) - Verify build output
  - Check source maps (`index.js.map`, `index.cjs.map`) are valid
  - Verify type declarations (`index.d.ts`, `index.d.cts`) are correct
  - Test declaration maps (`index.d.ts.map`, `index.d.cts.map`) resolve to source
  - Ensure both ESM and CJS formats work in their respective contexts

### Test Environment

- Use Vitest's browser mode or jsdom for SharedWorker testing
- Mock SharedWorker API if needed for CI environments
- Test both browser-like and Node.js CJS contexts

### Running Tests

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- Tests should run automatically before publishing the package

## Smoke Testing Examples

After making changes to the library, smoke test the examples with the dev server (`npm run dev`) and a browser:

1. **Echo Example** (`/echo/`)
   - Click "Send Echo" — verify a response appears with a client ID and message
   - Click "Subscribe" — verify "Waiting for messages..." appears
   - Click "Send Echo" again — verify the subscription receives the message
   - Open a **second tab** to `/echo/`
   - In tab 2, click "Send Echo" — switch to tab 1 and verify the subscription received the cross-tab message

2. **User Profile Example** (`/user-profile/`)
   - Click "Get User 1" — verify user details (name, email, age) appear
   - Click "Watch User 1" — verify the watch section appears with user data
   - Select "User 1" in the update dropdown, fill in a new name, click "Update User" — verify the watch section updates
   - Open a **second tab** to `/user-profile/`
   - In tab 1, click "Watch User 1"
   - In tab 2, select User 1, update the name, click "Update User"
   - Switch to tab 1 — verify the watch section shows the name updated from tab 2

The multi-tab tests verify SharedWorker communication across browsing contexts.

## Git Best Practices

- **Force Pushing**: Never use `git push --force`. Always use `git push --force-with-lease` instead, which prevents accidentally overwriting commits that others have pushed to the remote branch.
