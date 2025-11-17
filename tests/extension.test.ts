/*
 * Tests for the VS Code client extension wiring.
 *
 * These tests run in a Node environment with Jest and ts-jest, using
 * manual mocks for the `vscode` and `vscode-languageclient/node` modules.
 */

// Jest hoists jest.mock calls, so we can declare mocks here.

// vscode is provided via moduleNameMapper to tests/__mocks__/vscode.ts
// where we expose internal arrays for assertions.

// Mock the language client implementation

const mockStart = jest.fn();
const mockStop = jest.fn(() => Promise.resolve());

jest.mock('vscode-languageclient/node', () => {
  const LanguageClient = jest.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
  }));

  return {
    LanguageClient,
    TransportKind: { ipc: 1 },
  };
});

// Now import the module under test

import type { ExtensionContext } from 'vscode';
import { activate, deactivate } from '../src/extension';

// Access mocks after module load
const vscode = require('vscode');
const vslc = require('vscode-languageclient/node');

// Pull in helper arrays from the vscode stub
const { __test } = vscode as any;
const { mockOutputChannels, mockStatusBarItems, mockRegisteredCommands } = __test;

function createMockContext(): ExtensionContext {
  return {
    subscriptions: [],
    asAbsolutePath: (rel: string) => `/abs/${rel}`,
  } as any;
}

describe('hledger VS Code extension', () => {
  beforeEach(() => {
    // reset per-test state
    mockOutputChannels.length = 0;
    mockStatusBarItems.length = 0;
    for (const key of Object.keys(mockRegisteredCommands)) {
      delete mockRegisteredCommands[key];
    }
    mockStart.mockClear();
    mockStop.mockClear();
    vslc.LanguageClient.mockClear();
    (vscode.window.createStatusBarItem as jest.Mock).mockClear();
    (vscode.commands.registerCommand as jest.Mock).mockClear();
  });

  it('activates: creates language client, status bar, and registers commands', () => {
    const context = createMockContext();

    activate(context);

    // LanguageClient is constructed once with expected identifier and name
    expect(vslc.LanguageClient).toHaveBeenCalledTimes(1);
    const [id, name, serverOptions, clientOptions] = vslc.LanguageClient.mock.calls[0];
    expect(id).toBe('hledgerLanguageServer');
    expect(name).toBe('hledger Language Server');
    expect(serverOptions).toBeDefined();
    expect(clientOptions).toBeDefined();

    // Client.start is called
    expect(mockStart).toHaveBeenCalledTimes(1);

    // Output channel and status bar item are created
    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('hledger Language Server');
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
    expect(mockStatusBarItems[0].text).toBe('hledger: running');

    // Commands are registered
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'hledgerLanguageServer.reload',
      expect.any(Function),
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'hledgerLanguageServer.showLog',
      expect.any(Function),
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'hledgerLanguageServer.toggleInlayHints',
      expect.any(Function),
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'hledgerLanguageServer.toggleValidation',
      expect.any(Function),
    );
  });

  it('deactivates by stopping the client when active', async () => {
    const context = createMockContext();
    activate(context);

    await deactivate();

    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockStatusBarItems[0].text).toBe('hledger: stopped');
  });

  it('reload command stops and restarts the client', async () => {
    const context = createMockContext();
    activate(context);

    const reload = mockRegisteredCommands['hledgerLanguageServer.reload'];
    expect(reload).toBeDefined();

    await reload();

    // One start from activate, one stop+start from reload
    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(2);
    expect(mockStatusBarItems[0].text).toBe('hledger: running');
  });

  it('toggleInlayHints command flips all inlayHints settings', async () => {
    const context = createMockContext();
    activate(context);

    const toggle = mockRegisteredCommands['hledgerLanguageServer.toggleInlayHints'];
    expect(toggle).toBeDefined();

    const config = vscode.workspace.getConfiguration('hledgerLanguageServer');

    // Initially, get() should resolve to defaults (true) so command will disable all
    await toggle();

    expect(config.update).toHaveBeenCalledWith('inlayHints.showInferredAmounts', false, true);
    expect(config.update).toHaveBeenCalledWith('inlayHints.showRunningBalances', false, true);
    expect(config.update).toHaveBeenCalledWith('inlayHints.showCostConversions', false, true);
  });

  it('toggleValidation command flips all validation settings', async () => {
    const context = createMockContext();
    activate(context);

    const toggle = mockRegisteredCommands['hledgerLanguageServer.toggleValidation'];
    expect(toggle).toBeDefined();

    const config = vscode.workspace.getConfiguration('hledgerLanguageServer');

    await toggle();

    const keys = [
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

    for (const key of keys) {
      expect(config.update).toHaveBeenCalledWith(key, false, true);
    }
  });
});
