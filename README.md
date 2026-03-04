# hledger for VS Code

Full IDE support for [hledger](https://hledger.org/) plain text accounting;
completion, validation, formatting, navigation, and more.

Powered by the [hledger language server](https://github.com/ptimoney/hledger-lsp). Also available for [Neovim](https://github.com/ptimoney/hledger-nvim).

## Highlights

| | Feature | Description |
|---|---------|-------------|
| **Completion** | Accounts, payees, commodities, tags | Context-aware suggestions that learn from your transaction patterns |
| **Validation** | 15+ configurable rules | Balance checking, date ordering, undeclared items, periodic transactions, and more |
| **Formatting** | Decimal-point alignment | Auto-format with commodity-aware alignment and configurable indentation |
| **Navigation** | Go to definition, find references | Jump to declarations, find all usages across files |
| **Code Actions** | Quick fixes, rename refactoring | Add missing declarations, rename accounts across all references |
| **Inlay Hints** | Inferred amounts, running balances | See calculated values inline without cluttering your journal |
| **Multi-file** | Include directive support | Full workspace-aware parsing with automatic root file detection |
| **Highlighting** | Semantic tokens | Rich, context-aware syntax coloring for all hledger constructs |

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=patrickt.hledger-vscode), or search for **hledger** in the Extensions view (`Ctrl+Shift+X`).

The extension activates automatically when you open a `.journal` or `.hledger` file. No additional setup is required.

## Quick Start

1. Install the extension
2. Open a hledger journal file (`.journal` or `.hledger`)
3. Start editing &mdash; completions, diagnostics, and formatting work out of the box

### Example Settings

Add to your VS Code `settings.json` or configure in the Settings UI:

```json
{
  "hledgerLanguageServer.inlayHints.showInferredAmounts": true,
  "hledgerLanguageServer.inlayHints.showRunningBalances": true,
  "hledgerLanguageServer.validation.undeclaredAccounts": true
}
```

## Features

### Intelligent Completion

Auto-complete accounts, payees, commodities, tags, directives, and include paths. Smart completions learn from your transaction patterns &mdash; when you type a previously-used payee, the extension suggests the accounts you typically use with that payee. By default, only declared items appear in completions (configurable).

### Validation

15+ validation rules catch errors as you type:

- Transaction balance and missing amounts
- Undeclared accounts, payees, commodities, and tags
- Date ordering, invalid dates, and future dates
- Balance assertions, empty transactions, and empty descriptions
- Periodic transaction (`~`) balance and missing-amount checks
- Auto posting (`=`) undeclared account and commodity checks
- Include file errors and circular dependencies

All rules can be individually enabled/disabled and severity levels customized.

### Formatting

Format entire files or selected ranges with decimal-point alignment, configurable indentation, and commodity format support. Handles negative amounts, periodic transactions, and auto postings. On-type formatting auto-indents postings when you press Enter after a transaction header.

### Navigation

- **Document symbols** &mdash; outline view showing transactions, periodic transactions (`~`), auto posting rules (`=`), and directives with their postings
- **Workspace symbols** &mdash; search across all accounts, payees, commodities, tags, and transactions
- **Go to definition** &mdash; jump to declarations for accounts, payees, commodities, and tags
- **Find references** &mdash; show all usages across regular transactions, periodic transactions, and auto postings

### Code Actions

- **Add declarations** &mdash; quick-fix to add account, payee, commodity, or tag declarations
- **Rename refactoring** &mdash; rename accounts, payees, commodities, or tags across all references
- **Smart insertion** &mdash; directives are grouped with similar types automatically

### Inlay Hints

See calculated values inline: inferred amounts for postings without explicit amounts (including periodic transactions), running balances per account, and cost conversions for `@`/`@@` notation. Each hint type can be independently enabled or disabled.

### Semantic Highlighting

Rich, context-aware syntax coloring for dates, accounts, payees, commodities, tags, directives, amounts, comments, status indicators, and periodic/auto posting operators (`~`, `=`).

### Multi-file Support

Parse and merge multiple journal files via `include` directives. The extension builds a workspace-aware include graph and automatically detects the root file, so features like completion, validation, and running balances work correctly even when editing leaf files.

### Workspace Graph

For multi-file journals, the extension provides a **Hledger Workspace** tree view in the Explorer sidebar showing the hierarchical structure of your journal files and their include relationships.

- **Visual hierarchy** &mdash; see which files include which at a glance
- **Quick navigation** &mdash; click any file to open it
- **Automatic updates** &mdash; refreshes when files change

```
EXPLORER
  Hledger Workspace
    main.journal
      2024.journal
        expenses.journal
        income.journal
      accounts.journal
```

### Code Lens and Folding

- **Balance assertions** &mdash; clickable code lenses show running balances on posting lines
- **Transaction counts** &mdash; see how many transactions each account appears in
- **Folding ranges** &mdash; collapse transactions, periodic transactions, and auto posting blocks
- **Document links** &mdash; clickable include paths that open the referenced file

## Commands

Available via the Command Palette (`Ctrl+Shift+P`):

| Command | Description |
|---------|-------------|
| **Reload Language Server** | Restart the language server |
| **Show Language Server Log** | View server output for debugging |
| **Toggle Inlay Hints** | Show/hide all inlay hints |
| **Toggle Code Lens** | Show/hide code lenses |
| **Toggle Validation** | Enable/disable all validation rules |
| **Refresh Workspace Graph** | Reload the workspace tree view |

## Configuration

All settings are under the `hledgerLanguageServer` prefix. Main categories:

| Category | Prefix | Description |
|----------|--------|-------------|
| Validation | `validation.*` | Toggle individual validation rules |
| Severity | `severity.*` | Set diagnostic severity levels |
| Formatting | `formatting.*` | Configure indentation and alignment |
| Inlay Hints | `inlayHints.*` | Control which hints to display |
| Completion | `completion.*` | Filter completion suggestions |
| Include | `include.*` | Include directive behavior |
| Workspace | `workspace.*` | Workspace-aware parsing settings |
| Code Lens | `codeLens.*` | Toggle code lens features |

For detailed documentation of all settings, see the [language server configuration guide](https://github.com/ptimoney/hledger-lsp#configuration).

## Status Bar

The extension adds a status bar item showing the language server state. Click it to open the server output channel. States: `starting`, `running`, `reloading`, `stopped`.

## Development

### Quick Start

```bash
git clone https://github.com/ptimoney/hledger-vscode.git
cd hledger-vscode
npm install
npm run compile
```

Press **F5** in VS Code to launch the Extension Development Host, then open a `.journal` file.

### Local Server Development

If you're also developing the [language server](https://github.com/ptimoney/hledger-lsp):

```bash
# Build the server (as a sibling directory)
cd /path/to/hledger-lsp
npm install && npm run build

# The extension automatically detects ../hledger-lsp/out/server.js
```

After server changes, rebuild the server and use **Developer: Reload Window** in the Extension Development Host.

## Contributing

Found a bug or have a feature request?

- **Extension issues** (UI, commands, tree view): [hledger-vscode issues](https://github.com/ptimoney/hledger-vscode/issues)
- **Server issues** (parsing, validation, formatting, completion): [hledger-lsp issues](https://github.com/ptimoney/hledger-lsp/issues)

Contributions are welcome &mdash; please feel free to submit a Pull Request.

## Related Projects

| Project | Description |
|---------|-------------|
| [hledger-lsp](https://github.com/ptimoney/hledger-lsp) | Language server powering this extension (also usable with any LSP-compatible editor) |
| [hledger-nvim](https://github.com/ptimoney/hledger-nvim) | Neovim plugin with LSP integration and workspace graph visualization |
| [hledger](https://hledger.org/) | The plain text accounting tool |

## License

MIT
