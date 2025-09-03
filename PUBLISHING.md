# Publishing to npm

This guide explains how to publish the Linear CLI package to npm.

## Prerequisites

1. Create an npm account at https://www.npmjs.com/signup
2. Login to npm:
   ```bash
   npm login
   ```

## Publishing Steps

### 1. Verify the build

```bash
# Run all checks
bun run check

# Build the package
bun run build

# Test locally
./dist/cli.js --help
```

### 2. Update version

```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major
```

### 3. Publish to npm

```bash
# Dry run to see what will be published
npm pack --dry-run

# Publish to npm
npm publish --access public
```

Note: The `--access public` flag is required for scoped packages (`@asazutaiga/linear-cli`).

### 4. Create a GitHub release

After publishing to npm, create a GitHub release:

```bash
git push origin main --tags
```

Then go to GitHub and create a release from the new tag.

## Post-publish

After publishing, users can install the package with:

```bash
npm install -g @asazutaiga/linear-cli
# or
bun install -g @asazutaiga/linear-cli
```

## Troubleshooting

### If the package name is taken

Update the package name in `package.json` to something unique.

### If build fails

Make sure all tests and checks pass:

```bash
bun run check
bun test
```

### If publish fails

1. Make sure you're logged in: `npm whoami`
2. Check your npm permissions
3. Ensure the version number is incremented

## Version Management

Follow semantic versioning:

- **Patch** (0.1.x): Bug fixes, minor updates
- **Minor** (0.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

## Checklist

Before publishing:

- [ ] All tests pass (`bun test`)
- [ ] TypeScript compiles (`bun run typecheck`)
- [ ] Linting passes (`bun run lint`)
- [ ] README is up to date
- [ ] Version number is updated
- [ ] CHANGELOG is updated (if applicable)
- [ ] Build works (`bun run build`)
- [ ] Package works locally (`npm link` and test)