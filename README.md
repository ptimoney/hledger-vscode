# hledger-vscode

VS Code client for the hledger Language Server.

This extension wires VS Code’s editor features to the hledger LSP implementation
in this repository, providing completions, validation, formatting, navigation,
inlay hints, and more for hledger journal files.

## Features

For files with the `hledger` language (by default: `*.journal`, `*.hledger`):

- **Language server integration**
  - Context-aware **completion** for accounts, payees, commodities, and tags.
  - **Hover** information for key entities.
  - **Go to definition** and **find references** across included files.
  - **Document symbols** (outline) and **workspace symbols**.
  - **Code actions** for common issues and **rename** for
  accounts/payees/commodities/tags.
  - **Folding ranges**, **document links** (e.g. includes), and **selection
  ranges**.
  - **Semantic tokens** for richer theming.

- **Validation** (configurable)
  - Transaction balancing per commodity.
  - Missing amounts (at most one posting without amount).
  - Undeclared accounts, payees, commodities, tags.
  - Date checks (ordering, invalid dates, future dates).
  - Balance assertions and empty transactions/descriptions.
  - Include issues (missing files, circular includes).

- **Formatting**
  - Document, range, and on-type formatting.
  - Indentation and column alignment for accounts, commodities, amounts, and
  balance assertions, following the server’s alignment rules.

- **Inlay hints**
  - Inferred posting amounts.
  - Running balances.
  - Cost conversions.

- **UX helpers**
  - Status bar indicator (left): shows basic hledger server state (`starting`,
  `running`, `reloading`, `stopped`) and opens the log when clicked.
  - Output channel: **“hledger Language Server”** with startup and configuration
  logs.

## Commands

The extension contributes the following commands (available via the Command Palette):

- `hledger: Reload Language Server` (`hledgerLanguageServer.reload`)
  - Stops and restarts the language client/server.
- `hledger: Show Language Server Log` (`hledgerLanguageServer.showLog`)
  - Opens the **hledger Language Server** output channel.
- `hledger: Toggle Inlay Hints` (`hledgerLanguageServer.toggleInlayHints`)
  - Toggles all inlay hints on/off (`inlayHints.showInferredAmounts`,
  `inlayHints.showRunningBalances`, `inlayHints.showCostConversions`).
- `hledger: Toggle Validation` (`hledgerLanguageServer.toggleValidation`)
  - Toggles all validation rules on/off (`validation.*`).

## Settings

This extension exposes the language server’s configuration via the
`hledgerLanguageServer` section in VS Code settings.

The main groups are:

- **General**
  - `hledgerLanguageServer.maxNumberOfProblems` – max diagnostics per file.
  - `hledgerLanguageServer.hledgerPath` – path to the `hledger` executable (if
  needed by validations).

- **Validation** (`hledgerLanguageServer.validation.*`)
  - Flags for: `balance`, `missingAmounts`, `undeclaredAccounts`,
  `undeclaredPayees`, `undeclaredCommodities`, `undeclaredTags`, `dateOrdering`,
  `balanceAssertions`, `emptyTransactions`, `invalidDates`, `futureDates`,
  `emptyDescriptions`, `includeFiles`, `circularIncludes`.

- **Severity** (`hledgerLanguageServer.severity.*`)
  - Per-issue severity for undeclared accounts/payees/commodities/tags (`error`
  / `warning` / `information` / `hint`).

- **Include behavior** (`hledgerLanguageServer.include.*`)
  - `followIncludes` – whether to follow include directives.
  - `maxDepth` – maximum include depth.

- **Completion filters** (`hledgerLanguageServer.completion.*`)
  - `onlyDeclaredAccounts`, `onlyDeclaredPayees`, `onlyDeclaredCommodities`,
  `onlyDeclaredTags`.

- **Formatting** (`hledgerLanguageServer.formatting.*`)
  - `indentation`, `maxAccountWidth`, `maxCommodityWidth`, `maxAmountWidth`,
  `minSpacing`, `decimalAlignColumn`, `assertionDecimalAlignColumn`.

- **Inlay hints** (`hledgerLanguageServer.inlayHints.*`)
  - `showInferredAmounts`, `showRunningBalances`, `showCostConversions`.

All settings have sensible defaults matching the server’s internal
`defaultSettings`. Changing a setting triggers a configuration refresh in the
server and revalidation of open documents.

## Language association

This extension contributes a single language id, `hledger`:

- **Language id**: `hledger`
- **Extensions**: `.journal`, `.hledger`

Any file using these extensions will be treated as `hledger` and get language
server support.

## Requirements

- Node.js ≥ 16 for the language server.
- `hledger` installed and on `PATH` if you use features that rely on the
executable.

## Development

From the repository root:

1. Install dependencies:
   - `npm install`
2. Build server + client bundles:
   - `npm run build`
3. Open the `hledger_lsp` folder in VS Code and press **F5** to launch an
Extension Development Host.
4. In the dev host, open a `*.journal` or `*.hledger` file to activate the
extension.

Changes to the server or client can then be rebuilt with `npm run build` and the
dev host reloaded.

### Packaging and server loading

The VS Code client loads the language server in two ways:

- **Published / installed extension** – the server is pulled from the
`hledger-language-server` npm dependency in `node_modules` using
`require.resolve('hledger-language-server/out/server.js')`.
- **Local development** – as a fallback, the extension uses the bundled server
at `out/server/server.js`, which is produced by `server`’s TypeScript build and
copied into `vscode-client/out/server` by `scripts/copy-server.js`.

This keeps the packaged extension smaller (no copied `server/node_modules`),
while preserving a simple dev workflow in this monorepo.
