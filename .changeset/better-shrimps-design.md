---
"@grancalavera/bridge": minor
---

• Configure ESLint with TypeScript and React support for automated code quality checks
• Add Prettier for consistent code formatting across the project
• Set up Husky pre-commit hooks to run typecheck, lint, and format before each commit
• Separate library build from examples by moving React dependencies to devDependencies
• Configure examples to build to separate dist-examples/ directory
• Simplify tsdown configuration for cleaner library builds

These changes improve developer experience and code quality without affecting the library's runtime behavior or
public API.
