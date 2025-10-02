# GitHub Actions Workflows

## Publish to npm

The `publish.yml` workflow automatically publishes the package to npm when PRs are merged to `main`.

### Setup Required

1. **Create an npm access token:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token

2. **Add token to GitHub repository:**
   - Go to your repo's Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

3. **Remove `"private": true` from package.json** before merging a PR that should trigger publishing

### How it works

- Triggers on push to `main` branch (when PR is merged)
- Installs dependencies with `npm ci`
- Builds the library with `npm run build:lib`
- Runs tests with `npm test`
- Checks if the version in package.json already exists on npm
- If version is new, publishes with `npm publish --access public`

### Publishing pre-releases

Pre-release versions (e.g., `0.0.1-alpha.0`) will be published under the `latest` tag by default. To publish under a different tag:

Modify the publish step to:

```yaml
- name: Publish to npm
  run: npm publish --access public --tag alpha
```
