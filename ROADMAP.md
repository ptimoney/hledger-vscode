# Roadmap

## Next
- Release the extension: push `main` and tag. This ships the bundled hledger-lsp 0.8.0
  server, which picks up external edits to unopened journals (hledger-lsp#31).

## Notes / TODO
- `CHANGELOG.md` stops at 0.1.5, but the extension is at 0.4.9. Either backfill it
  or drop it in favour of GitHub releases.

## Completed
- Bumped `hledger-lsp` to `^0.8.0` and rebuilt the bundled server.
- Added a harness test: an on-disk edit to an unopened included journal clears an
  undeclared-account diagnostic. It uses a temp fixture workspace and skips on
  servers older than 0.8.0 (the CI compatibility matrix).
- Removed the leftover `**/.clientrc` `synchronize.fileEvents` watcher from the LSP
  template, because the server now registers its own watchers (hledger-lsp#31).
