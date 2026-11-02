# Roadmap

## Next
- **Bump `hledger-lsp` to `^0.8.0`** — pending: 0.8.0 (server-side file watchers for
  external journal edits, hledger-lsp#31) wasn't on npm as of 2026-11-02 (latest 0.7.0).
  Dependabot should pick it up; otherwise bump by hand, rebuild, then release the
  extension.
- Consider turning the throwaway external-edit check (open `main.journal`, append
  `account …` to an unopened included file on disk, expect the undeclared-account
  diagnostic to clear) into a real harness test once the npm server is ≥0.8.0. The
  current harness opens no workspace folder, so it would need a fixture workspace.

## Notes / TODO
- `CHANGELOG.md` stops at 0.1.5, but the extension is at 0.4.9. Either backfill it
  or drop it in favour of GitHub releases.

## Completed
- Removed the leftover `**/.clientrc` `synchronize.fileEvents` watcher from the LSP
  template, because the server now registers its own watchers (hledger-lsp#31).
