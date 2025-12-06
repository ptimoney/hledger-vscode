# Change Log

All notable changes to the hledger VS Code extension are documented in this file.

## [0.1.5] - 2024-12-06

### Changed
- **Repository separated from hledger-lsp monorepo**
  - Extension now has its own repository at [ptimoney/hledger-vscode](https://github.com/ptimoney/hledger-vscode)
  - Consumes `hledger-lsp` as an npm dependency (was bundled from monorepo)
  - Simplified build process (removed esbuild bundling)
  - Independent versioning and release cycle

### Fixed
- Better error messages when language server package not found
- Improved server resolution to support both `npm install` and `npm link` workflows

### Compatibility
- Requires `hledger-lsp ^0.1.7`

## [0.1.4] - Previous Releases

Previous versions were part of the [hledger-lsp monorepo](https://github.com/ptimoney/hledger-lsp).
For older changes, see the [hledger-lsp CHANGELOG](https://github.com/ptimoney/hledger-lsp/blob/main/vscode-client/CHANGELOG.md).
