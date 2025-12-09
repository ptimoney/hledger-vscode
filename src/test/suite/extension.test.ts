import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

suite('hledger VS Code Extension Test Suite', () => {
  vscode.window.showInformationMessage('Running extension tests...');

  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('patrickt.hledger-lsp-vscode'));
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('patrickt.hledger-lsp-vscode');
    assert.ok(ext);

    // Activate the extension
    await ext.activate();
    assert.strictEqual(ext.isActive, true);
  });

  test('Commands should be registered', async () => {
    // Get all commands
    const allCommands = await vscode.commands.getCommands(true);

    // Check that our commands are registered
    const hledgerCommands = [
      'hledgerLanguageServer.reload',
      'hledgerLanguageServer.showLog',
      'hledgerLanguageServer.toggleInlayHints',
      'hledgerLanguageServer.toggleCodeLens',
      'hledgerLanguageServer.toggleValidation',
      'hledgerLanguageServer.refreshWorkspaceGraph',
    ];

    for (const cmd of hledgerCommands) {
      assert.ok(
        allCommands.includes(cmd),
        `Command ${cmd} should be registered`
      );
    }
  });

  test('toggleInlayHints command should execute without error', async () => {
    // Simply verify the command can be executed
    await vscode.commands.executeCommand('hledgerLanguageServer.toggleInlayHints');
    assert.ok(true, 'Command executed successfully');
  });

  test('toggleCodeLens command should execute without error', async () => {
    // Simply verify the command can be executed
    await vscode.commands.executeCommand('hledgerLanguageServer.toggleCodeLens');
    assert.ok(true, 'Command executed successfully');
  });

  test('toggleValidation command should execute without error', async () => {
    // Simply verify the command can be executed
    await vscode.commands.executeCommand('hledgerLanguageServer.toggleValidation');
    assert.ok(true, 'Command executed successfully');
  });

  test('showLog command should open output channel', async () => {
    // This command should open the output channel without throwing
    await vscode.commands.executeCommand('hledgerLanguageServer.showLog');
    // If we get here without throwing, the test passes
    assert.ok(true);
  });
});
