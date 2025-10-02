# Bridge Repository - Agent Guidelines

## Build & Development Commands

- **Development**: `npm run dev` - Start Vite dev server with hot reload
- **Build**: `npm run build` - TypeScript check + production build
- **Build Library**: `npm run build:lib` - Build library package to `dist/` using tsdown
- **Type Check**: `npm run typecheck` - Run TypeScript compiler without emitting
- **Preview**: `npm run preview` - Preview production build locally
- **Test**: `npm test` - Run Vitest test suite (to be implemented)

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

## Testing Strategy

**Framework**: Vitest (to be installed)

### Test Structure

- **Unit Tests** (`src/**/*.test.ts`) - Test individual library functions
  - Type system validation (Contract, Query, Mutation, Subscription types)
  - Client creation and proxy generation logic
  - Worker context helpers (notify, subscribe)
  - Structured cloneable type constraints

- **Integration Tests** (`tests/integration/**/*.test.ts`) - Test library from `dist/`
  - Import from `dist/index.js` (ESM) and `dist/index.cjs` (CJS)
  - Verify all public exports are accessible
  - Test SharedWorker communication patterns end-to-end
  - Validate RxJS subscription lifecycle

- **Build Artifact Tests** (`tests/build/**/*.test.ts`) - Verify build output
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
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests (requires built library)
- `npm run test:watch` - Run tests in watch mode
- Tests should run automatically before publishing the package
