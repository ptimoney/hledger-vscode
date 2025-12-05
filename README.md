# hledger-vscode

VS Code extension for [hledger](https://hledger.org/) plain text accounting, powered by the [hledger-lsp](https://github.com/ptimoney/hledger-lsp) language server.

## Features

This extension provides full IDE support for hledger journal files (`.journal`, `.hledger`):

- **Intelligent completion** for accounts, payees, commodities, and tags
- **Validation** with configurable rules (balance checking, date ordering, undeclared items, etc.)
- **Formatting** with decimal-point alignment
- **Navigation** (go to definition, find references, document/workspace symbols)
- **Code actions** (add declarations, rename refactoring)
- **Inlay hints** for inferred amounts, running balances, and cost conversions
- **Semantic highlighting** for richer syntax coloring
- **Multi-file support** via include directives

For a complete feature list and examples, see the [hledger-lsp server documentation](https://github.com/ptimoney/hledger-lsp/tree/main/server#features).

## Installation

Install from the VS Code marketplace or the Extensions view (`Ctrl+Shift+X`).

The extension will start automatically when you open a `.journal` or `.hledger` file.

## Quick Start

1. Install the extension
2. Open a hledger journal file (`.journal` or `.hledger`)
3. Start editing! The language server provides completions, diagnostics, and more

### Example Settings

Add to your VS Code `settings.json`:

```json
{
  "hledgerLanguageServer.inlayHints.showInferredAmounts": true,
  "hledgerLanguageServer.inlayHints.showRunningBalances": true,
  "hledgerLanguageServer.validation.undeclaredAccounts": true
}
```

For all available settings, see the [Server Configuration Documentation](https://github.com/ptimoney/hledger-lsp/tree/main/server#user-configuration).

## Commands

Available via the Command Palette (`Ctrl+Shift+P`):

- **Reload Language Server** (`hledgerLanguageServer.reload`) - Restart the server
- **Show Language Server Log** (`hledgerLanguageServer.showLog`) - View server output
- **Toggle Inlay Hints** (`hledgerLanguageServer.toggleInlayHints`) - Show/hide all inlay hints
- **Toggle Validation** (`hledgerLanguageServer.toggleValidation`) - Enable/disable all validation

## Configuration

The extension exposes all language server settings under the `hledgerLanguageServer` prefix. Main categories:

- **Validation** (`hledgerLanguageServer.validation.*`) - Toggle individual validation rules
- **Formatting** (`hledgerLanguageServer.formatting.*`) - Configure indentation and alignment
- **Inlay Hints** (`hledgerLanguageServer.inlayHints.*`) - Control which hints to display
- **Completion** (`hledgerLanguageServer.completion.*`) - Filter completion suggestions
- **Severity** (`hledgerLanguageServer.severity.*`) - Set diagnostic severity levels

For detailed documentation of all settings, visit the [server configuration guide](https://github.com/ptimoney/hledger-lsp/tree/main/server#user-configuration).

## Status Bar

The extension adds a status bar item showing the server state:
- Click it to open the Language Server output channel
- Shows: `starting`, `running`, `reloading`, or `stopped`

## Development

From the repository root (`hledger-lsp`):

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Press **F5** in VS Code to launch the Extension Development Host
4. Open a `.journal` file to test the extension

Changes require rebuilding with `npm run build` and reloading the dev host.

## License

MIT

## Links

- [hledger-lsp repository](https://github.com/ptimoney/hledger-lsp)
- [Server features documentation](https://github.com/ptimoney/hledger-lsp/tree/main/server#features)
- [Configuration guide](https://github.com/ptimoney/hledger-lsp/tree/main/server#user-configuration)
- [hledger documentation](https://hledger.org/)
