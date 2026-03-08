import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Configuration Toggle Commands', () => {
  const getConfig = () => vscode.workspace.getConfiguration('hledgerLanguageServer');

  const inlayHintKeys = [
    'inlayHints.showInferredAmounts',
    'inlayHints.showRunningBalances',
    'inlayHints.showCostConversions',
  ];

  const validationKeys = [
    'validation.balance',
    'validation.missingAmounts',
    'validation.undeclaredAccounts',
    'validation.undeclaredPayees',
    'validation.undeclaredCommodities',
    'validation.undeclaredTags',
    'validation.dateOrdering',
    'validation.balanceAssertions',
    'validation.emptyTransactions',
    'validation.invalidDates',
    'validation.futureDates',
    'validation.emptyDescriptions',
    'validation.includeFiles',
    'validation.circularIncludes',
  ];

  // Helper: set settings to explicit values
  async function setSettings(keys: string[], value: boolean) {
    const config = getConfig();
    for (const k of keys) {
      await config.update(k, value, true);
    }
  }

  // Helper: clear settings (restore defaults)
  async function clearSettings(keys: string[]) {
    const config = getConfig();
    for (const k of keys) {
      await config.update(k, undefined, true);
    }
  }

  suite('toggleInlayHints', () => {
    setup(async () => {
      // Explicitly set to true (the default state) before each test
      await setSettings(inlayHintKeys, true);
    });

    teardown(async () => {
      await clearSettings(inlayHintKeys);
    });

    test('disables all inlay hints when any are enabled', async () => {
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleInlayHints');
      const config = getConfig();
      for (const key of inlayHintKeys) {
        assert.strictEqual(config.get<boolean>(key), false, `${key} should be false after toggle`);
      }
    });

    test('re-enables all inlay hints on second toggle', async () => {
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleInlayHints');
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleInlayHints');
      const config = getConfig();
      for (const key of inlayHintKeys) {
        assert.strictEqual(config.get<boolean>(key), true, `${key} should be true after double toggle`);
      }
    });
  });

  suite('toggleCodeLens', () => {
    setup(async () => {
      // Explicitly set to false (the default state) before each test
      await setSettings(['codeLens.showTransactionCounts'], false);
    });

    teardown(async () => {
      await clearSettings(['codeLens.showTransactionCounts']);
    });

    test('enables code lens when disabled (default)', async () => {
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleCodeLens');
      const config = getConfig();
      assert.strictEqual(config.get<boolean>('codeLens.showTransactionCounts'), true);
    });

    test('disables code lens on second toggle', async () => {
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleCodeLens');
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleCodeLens');
      const config = getConfig();
      assert.strictEqual(config.get<boolean>('codeLens.showTransactionCounts'), false);
    });
  });

  suite('toggleValidation', () => {
    setup(async () => {
      // Explicitly set to true (the default state) before each test
      await setSettings(validationKeys, true);
    });

    teardown(async () => {
      await clearSettings(validationKeys);
    });

    test('disables all validation when any are enabled', async () => {
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleValidation');
      const config = getConfig();
      for (const key of validationKeys) {
        assert.strictEqual(config.get<boolean>(key), false, `${key} should be false after toggle`);
      }
    });

    test('re-enables all validation on second toggle', async () => {
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleValidation');
      await vscode.commands.executeCommand('hledgerLanguageServer.toggleValidation');
      const config = getConfig();
      for (const key of validationKeys) {
        assert.strictEqual(config.get<boolean>(key), true, `${key} should be true after double toggle`);
      }
    });
  });
});
