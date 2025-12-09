# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a VS Code extension for [hledger](https://hledger.org/), the plain text accounting tool. The extension provides IDE features powered by the [hledger-lsp](https://github.com/ptimoney/hledger-lsp) language server.

## Build and Development Commands

### Common Operations

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-recompile on changes)
npm run watch

# Full build (includes bundling the server with esbuild)
npm run build

# Lint
npm run lint

# Run tests
npm test

# Package extension for distribution
npm run package

# Publish to VS Code marketplace
npm run publish
```

### Running Tests

Tests use Mocha with the TDD interface and run in a VS Code Extension Development Host:

```bash
# Run all tests
npm test

# On Linux (CI), use xvfb:
xvfb-run -a npm test
```

Test files are in `src/test/suite/` and use `.test.ts` suffix. The test runner (`src/test/suite/index.ts`) uses Mocha's TDD interface with `suite()` and `test()` functions.

### Local Development with Language Server

The extension has a multi-tiered server resolution strategy (priority order):

1. **Local sibling build** (for active development): `../hledger-lsp/out/server.js`
2. **npm package** (via `npm link` or `node_modules`): `hledger-lsp/out/server.js`
3. **Bundled server** (for published extension): `out/server/server.js`

To develop with a local language server:

```bash
# Option A: Sibling directory (automatic)
cd /path/to/hledger-lsp
npm install && npm run build

cd /path/to/hledger-vscode
# Extension will automatically detect ../hledger-lsp/out/server.js

# Option B: npm link (manual)
cd /path/to/hledger-lsp
npm link

cd /path/to/hledger-vscode
npm link hledger-lsp
```

To revert to the published package:

```bash
npm unlink hledger-lsp
npm install
```

## Architecture

### Extension Entry Point

The main extension code is in `src/extension.ts`, which:

1. **Resolves the language server** using the multi-tiered strategy
2. **Creates a status bar item** showing server state (starting/running/reloading/stopped)
3. **Instantiates the Language Client** from `vscode-languageclient`
4. **Registers VS Code commands** for extension functionality
5. **Creates the Workspace Graph tree view** provider
6. **Sets up inlay hints refresh** on document changes (debounced 100ms)

Key extension lifecycle:
- `activate()`: Called when extension loads (on hledger file open or workspace with .journal files)
- `deactivate()`: Stops the language client

### Workspace Graph Provider

The `WorkspaceGraphProvider` (`src/workspaceGraphProvider.ts`) implements a VS Code tree view showing the hierarchical structure of multi-file journals:

- Communicates with the language server via `workspace/executeCommand` with command `hledger.showWorkspaceGraphStructured`
- Receives structured graph data with display string, file path, and URI
- Parses depth from indentation/tree characters to build parent-child relationships
- Each tree item is clickable to open the corresponding journal file

The tree view refreshes when:
- The user clicks the refresh button
- The language client is set/changed
- Files are modified (manually triggered via `refresh()`)

### Commands

The extension registers these commands:

- `hledgerLanguageServer.reload` - Restart the language server
- `hledgerLanguageServer.showLog` - Open output channel with server logs
- `hledgerLanguageServer.toggleInlayHints` - Toggle all inlay hint settings
- `hledgerLanguageServer.toggleCodeLens` - Toggle code lens display
- `hledgerLanguageServer.toggleValidation` - Toggle all validation rules
- `hledgerLanguageServer.refreshWorkspaceGraph` - Refresh the workspace tree view
- `hledgerLanguageServer.openFile` - Internal command to open files from tree view

Toggle commands flip the state of all related settings and update them in global configuration.

### Build Process

The build uses three separate compilation steps (see `package.json` scripts):

1. **TypeScript compilation** (`npm run build:ts`): Compiles `src/**/*.ts` to `out/`
2. **Server bundling** (`npm run build:server`): Uses esbuild to bundle `node_modules/hledger-lsp/out/server.js` into `out/server/server.js` as a single minified file
3. **Extension bundling** (`npm run build:extension`): Uses esbuild to bundle `out/extension.js` with dependencies (excluding vscode) into a single minified file

The bundled server is only used for the published extension. During development, the extension prefers the local or npm-linked server.

### Testing Framework

Tests use Mocha with the TDD interface and `@vscode/test-electron` to launch a VS Code instance:

- `src/test/runTest.ts`: Downloads and launches VS Code with the extension
- `src/test/suite/index.ts`: Configures Mocha and discovers test files
- `src/test/suite/extension.test.ts`: Basic extension activation and command tests

Tests use Sinon for mocking. The extension handles test environments by checking `process.env.NODE_ENV === 'test'` or `process.env.JEST_WORKER_ID` and allows activation without a real server module.

## Configuration

All settings are under the `hledgerLanguageServer` namespace in `package.json`:

- `validation.*` - Individual validation rule toggles (balance, dates, undeclared items, etc.)
- `severity.*` - Diagnostic severity levels (error/warning/information/hint)
- `formatting.*` - Column alignment, indentation, decimal positioning
- `inlayHints.*` - Toggle inferred amounts, running balances, cost conversions
- `codeLens.*` - Toggle transaction counts
- `completion.*` - Filter completions to declared items only
- `include.*` - Follow include directives, max depth
- `workspace.*` - Enable workspace-aware parsing, auto-detect root file

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **ci-multiplatform.yml**: Runs tests on Linux/Windows/macOS with Node 18/20, runs lint, build, and package smoke test. Also runs compatibility tests with multiple hledger-lsp versions.
- **release.yml**: Publishes to VS Code marketplace (triggered on version tags or manual dispatch)

## File Structure

```
src/
  extension.ts              # Main extension entry point
  workspaceGraphProvider.ts # Tree view provider for journal file hierarchy
  test/
    runTest.ts              # Test runner setup
    suite/
      index.ts              # Mocha configuration
      extension.test.ts     # Extension tests
out/                        # Compiled JavaScript (gitignored)
package.json                # Extension manifest and dependencies
tsconfig.json               # TypeScript configuration
language-configuration.json # Language syntax config for .journal/.hledger files
```

## Language Server Dependency

This extension depends on `hledger-lsp` (npm package). All LSP features (validation, completion, formatting, etc.) are implemented in the language server. The extension is a thin client that:

1. Starts and manages the language server process
2. Provides VS Code UI integration (commands, status bar, tree view)
3. Forwards configuration to the server
4. Handles extension lifecycle

For server-side issues (parsing, LSP features), report bugs in the [hledger-lsp repository](https://github.com/ptimoney/hledger-lsp/issues).
