# hledger-vscode

VS Code extension for [hledger](https://hledger.org/) the plain text accounting tool,
powered by the [hledger-lsp](https://github.com/ptimoney/hledger-lsp) language server.

## Features

This extension provides full IDE support for hledger journal files (`.journal`, `.hledger`):

- **Intelligent completion** for accounts, payees, commodities, and tags
- **Validation** with configurable rules (balance checking, date ordering,
undeclared items, etc.)
- **Auto formatting** with automatic commodity formatting and column alignment
throughout the journal file
- **Navigation** (go to definition, find references, document/workspace symbols)
- **Code actions** (add declarations, rename refactoring)
- **Inlay hints** for inferred amounts, running balances, and cost conversions
- **Semantic highlighting** for richer syntax coloring
- **Multi-file support** via include directives with automatic or configurable
root file detection
- **Workspace graph** tree view showing your journal file structure and include relationships

For a complete feature list and examples, see the [hledger-lsp server documentation](https://github.com/ptimoney/hledger-lsp/tree/main/server#features).

## Installation

Install from the [VS Code marketplace](https://marketplace.visualstudio.com/items?itemName=patrickt.hledger-vscode).

The extension will start automatically when you open a `.journal` or `.hledger` file.

## Quick Start

1. Install the extension
2. Open a hledger journal file (`.journal` or `.hledger`)
3. Start editing! The language server provides completions, diagnostics, and more

### Example Settings

Add to your VS Code `settings.json` or set in the Settings UI:

```json
{
  "hledgerLanguageServer.inlayHints.showInferredAmounts": true,
  "hledgerLanguageServer.inlayHints.showRunningBalances": true,
  "hledgerLanguageServer.validation.undeclaredAccounts": true
}
```

For all available settings, see the [Server Configuration Documentation](https://github.com/ptimoney/hledger-lsp/tree/main/server#user-configuration).

## Workspace Graph

For multi-file journals using `include` directives, the extension provides a
**Hledger Workspace** tree view in the Explorer sidebar. This shows the
hierarchical structure of your journal files and their include relationships.

- **Visual hierarchy**: See which files include which other files at a glance
- **Quick navigation**: Click any file to open it in the editor
- **Workspace-relative paths**: Shows file locations relative to your workspace
- **Automatic updates**: Refreshes when files change or when you click the
refresh button

### Example

```
EXPLORER
├─ Hledger Workspace          [🔄]
   ├─ 📄 main.journal
   ├─ 📄 2024.journal
   │  ├─ 📄 expenses.journal
   │  └─ 📄 income.journal
   └─ 📄 accounts.journal
```

The tree view appears automatically when you open a workspace containing hledger
journal files (`.journal` or `.hledger` extensions).

## Commands

Available via the Command Palette (`Ctrl+Shift+P`):

- **Reload Language Server** (`hledgerLanguageServer.reload`) - Restart the server
- **Show Language Server Log** (`hledgerLanguageServer.showLog`) - View server output
- **Toggle Inlay Hints** (`hledgerLanguageServer.toggleInlayHints`)
  Show/hide all inlay hints
- **Toggle Code Lens** (`hledgerLanguageServer.toggleCodeLens`)
  Show/hide code lens
- **Toggle Validation** (`hledgerLanguageServer.toggleValidation`)
  Enable/disable all validation
- **Refresh Workspace Graph** (`hledgerLanguageServer.refreshWorkspaceGraph`)
  Reload the workspace tree view

## Configuration

The extension exposes all language server settings under the
`hledgerLanguageServer` prefix. Main categories:

- **Validation** (`hledgerLanguageServer.validation.*`) - Toggle individual
validation rules
- **Formatting** (`hledgerLanguageServer.formatting.*`) - Configure indentation
and alignment
- **Inlay Hints** (`hledgerLanguageServer.inlayHints.*`) - Control which hints
to display
- **Completion** (`hledgerLanguageServer.completion.*`) - Filter completion suggestions
- **Severity** (`hledgerLanguageServer.severity.*`) - Set diagnostic severity levels

For detailed documentation of all settings, visit the [server configuration guide](https://github.com/ptimoney/hledger-lsp/tree/main/server#user-configuration).

## Status Bar

The extension adds a status bar item showing the server state:

- Click it to open the Language Server output channel
- Shows: `starting`, `running`, `reloading`, or `stopped`

## Development

### Using Published Server (Recommended for Contributors)

1. Clone this repository:

   ```bash
   git clone https://github.com/ptimoney/hledger-vscode.git
   cd hledger-vscode
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build:

   ```bash
   npm run compile
   ```

4. Press **F5** in VS Code to launch Extension Development Host

5. Open a `.journal` file to test

Changes to the extension require `npm run compile` and reloading the dev host.

### Using Local Server (For Server Development)

If you're also developing the language server:

1. Clone and link the server:

   ```bash
   cd /path/to/hledger-lsp
   npm install && npm run build
   npm link
   ```

2. Link in extension:

   ```bash
   cd /path/to/hledger-vscode
   npm link hledger-lsp
   npm run watch  # or compile
   ```

3. Press **F5** to test changes

Server changes require `npm run build` in the server directory, then reload the
Extension Development Host.

To revert to the published package:

```bash
npm unlink hledger-lsp
npm install
```

## License

MIT

## Contributing

Found a bug or have a feature request? Please [open an issue](https://github.com/ptimoney/hledger-vscode/issues)

For server-side bugs (parsing, validation, LSP features), please report them
in the [hledger-lsp repository](https://github.com/ptimoney/hledger-lsp/issues).

## Links

- **Extension Repository**: [hledger-vscode](https://github.com/ptimoney/hledger-vscode)
- **Language Server**: [hledger-lsp repository](https://github.com/ptimoney/hledger-lsp)
- **Report Issues**: [Extension issues](https://github.com/ptimoney/hledger-vscode/issues) | [Server issues](https://github.com/ptimoney/hledger-lsp/issues)
- **Documentation**: [Server features](https://github.com/ptimoney/hledger-lsp/tree/main/server#features) | [Configuration guide](https://github.com/ptimoney/hledger-lsp/tree/main/server#user-configuration)
- **hledger**: [Official documentation](https://hledger.org/)
