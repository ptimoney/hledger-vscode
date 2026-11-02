import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Server-side file watchers for unopened journals arrived in hledger-lsp 0.8.0
// (hledger-lsp#31). Older servers (e.g. in CI's compatibility matrix) skip this.
const MIN_SERVER = [0, 8, 0];

function resolvedServerVersion(extensionPath: string): string | undefined {
  // Mirrors the resolution order in extension.ts: local sibling build, then npm package.
  const candidates = [path.resolve(extensionPath, '..', 'hledger-lsp', 'package.json')];
  try {
    candidates.push(require.resolve('hledger-lsp/package.json'));
  } catch {
    // not installed
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8')).version;
    }
  }
  return undefined;
}

function atLeast(version: string, min: number[]): boolean {
  const parts = version.split('.').map(n => parseInt(n, 10));
  for (let i = 0; i < min.length; i++) {
    if ((parts[i] ?? 0) !== min[i]) return (parts[i] ?? 0) > min[i];
  }
  return true;
}

async function waitFor(condition: () => boolean, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (condition()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return condition();
}

suite('External edits to unopened journals', () => {
  test('editing an unopened included file on disk clears an undeclared-account diagnostic', async function () {
    this.timeout(60000);

    const ext = vscode.extensions.getExtension('patrickt.hledger-lsp-vscode');
    const folder = vscode.workspace.workspaceFolders?.[0];
    const mainPath = folder && path.join(folder.uri.fsPath, 'main.journal');
    if (!ext || !folder || !mainPath || !fs.existsSync(mainPath)) {
      this.skip();
    }
    const version = resolvedServerVersion(ext!.extensionPath);
    if (!version || !atLeast(version, MIN_SERVER)) {
      this.skip();
    }

    const accountsPath = path.join(folder!.uri.fsPath, 'accounts.journal');
    const mainUri = vscode.Uri.file(mainPath!);
    const undeclaredFood = () =>
      vscode.languages.getDiagnostics(mainUri).filter(d => d.message.includes('expenses:food'));

    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(mainUri));
    assert.ok(await waitFor(() => undeclaredFood().length > 0, 30000),
      'expected an undeclared-account diagnostic for expenses:food');

    assert.ok(!vscode.workspace.textDocuments.some(d => d.uri.fsPath === accountsPath),
      'accounts.journal must stay unopened for this test to be meaningful');
    fs.appendFileSync(accountsPath, 'account expenses:food\n');

    assert.ok(await waitFor(() => undeclaredFood().length === 0, 20000),
      'expected the diagnostic to clear after the on-disk edit');
  });
});
