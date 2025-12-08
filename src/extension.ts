import { workspace, window, commands, ExtensionContext, StatusBarAlignment, StatusBarItem, Uri } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

import { WorkspaceGraphProvider } from './workspaceGraphProvider';

let client: LanguageClient | undefined;
let outputChannel = window.createOutputChannel('hledger Language Server');
let statusBarItem: StatusBarItem | undefined;
let workspaceGraphProvider: WorkspaceGraphProvider | undefined;

export function activate(context: ExtensionContext) {
  context.subscriptions.push(outputChannel);

  // Create a status bar item to show basic language server state and provide quick access to the log
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
  statusBarItem.text = 'hledger: starting';
  statusBarItem.tooltip = 'hledger Language Server';
  statusBarItem.command = 'hledgerLanguageServer.showLog';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  outputChannel.appendLine('Activating hledger language client');

  // Resolve the language server. Prefer a bundled server at `out/server/server.js` (this
  // is produced by our esbuild bundling). If not present, prefer a local sibling build
  // useful during development, and finally fall back to the installed `hledger-lsp`
  // package (npm/yarn/npm link).
  let serverModule: string | undefined;
  try {
    // Prefer a bundled server inside the extension: <extension_root>/out/server/server.js
    const bundledServerPath = path.resolve(context.extensionPath, 'out', 'server', 'server.js');
    if (fs.existsSync(bundledServerPath)) {
      serverModule = bundledServerPath;
      outputChannel.appendLine(`hledger Language Server: using bundled server at ${serverModule}`);
    } else {
      // Check for a local sibling build: <extension_root>/../../hledger-lsp/out/server.js
      const localServerPath = path.resolve(context.extensionPath, '..', '..', 'hledger-lsp', 'out', 'server.js');
      if (fs.existsSync(localServerPath)) {
        serverModule = localServerPath;
        outputChannel.appendLine(`hledger Language Server: using local server module at ${serverModule}`);
      } else {
        // Fall back to resolving the installed package (this also works with `npm link`)
        serverModule = require.resolve('hledger-lsp/out/server.js');
        outputChannel.appendLine(`hledger Language Server: resolved server module at ${serverModule}`);
      }
    }
  } catch (error) {
    const errorMsg =
      'ERROR: Failed to resolve hledger-lsp package or local build.\n\n' +
      'If you want to use a locally-built language server for development, either:\n' +
      "  - build the server and place it at '../hledger-lsp/out/server.js' relative to the extension, or\n" +
      "  - use npm link:\n" +
      '      cd /path/to/hledger-lsp && npm link\n' +
      '      cd /path/to/hledger-vscode && npm link hledger-lsp\n\n' +
      'Or ensure the dependency is installed via `npm install` in the extension.\n\n' +
      `Error details: ${error}`;

    outputChannel.appendLine(errorMsg);
    // Show an error to real clients if possible
    if (typeof window.showErrorMessage === 'function') {
      window.showErrorMessage('hledger Language Server: Failed to load. See output for details.');
    }

    // In test environments (Jest) we allow activation to continue so unit tests
    // can exercise extension wiring without a real server module. Detect common
    // test environment variables and fall back to a benign placeholder.
    const inTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    if (inTest) {
      outputChannel.appendLine('Test environment detected: continuing activation without a real server module');
      serverModule = serverModule || '';
    } else {
      throw new Error('hledger-lsp package not found');
    }
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for hledger documents
    documentSelector: [
      { scheme: 'file', language: 'hledger' },
      { scheme: 'untitled', language: 'hledger' }
    ],
    synchronize: {
      // Notify the server about file changes to '.clientrc' files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    },
    outputChannel,
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'hledgerLanguageServer',
    'hledger Language Server',
    serverOptions,
    clientOptions
  );

  outputChannel.appendLine('Starting hledger language client (which will launch the server)');
  if (statusBarItem) {
    statusBarItem.text = 'hledger: starting';
  }

  // Register commands for lifecycle and visibility
  const reloadCommand = commands.registerCommand('hledgerLanguageServer.reload', async () => {
    if (!client) {
      window.showInformationMessage('hledger Language Server client is not running.');
      return;
    }
    outputChannel.appendLine('Reloading hledger language client (stop + start)');
    if (statusBarItem) {
      statusBarItem.text = 'hledger: reloading';
    }
    await client.stop();
    client.start();
    if (statusBarItem) {
      statusBarItem.text = 'hledger: running';
    }
  });

  const showLogCommand = commands.registerCommand('hledgerLanguageServer.showLog', () => {
    outputChannel.show(true);
  });

  const toggleInlayHintsCommand = commands.registerCommand('hledgerLanguageServer.toggleInlayHints', async () => {
    const config = workspace.getConfiguration('hledgerLanguageServer');
    const anyEnabled = (
      config.get<boolean>('inlayHints.showInferredAmounts', true) ||
      config.get<boolean>('inlayHints.showRunningBalances', true) ||
      config.get<boolean>('inlayHints.showCostConversions', true)
    );
    const enable = !anyEnabled;

    await Promise.all([
      config.update('inlayHints.showInferredAmounts', enable, true),
      config.update('inlayHints.showRunningBalances', enable, true),
      config.update('inlayHints.showCostConversions', enable, true),
    ]);

    window.showInformationMessage(`hledger inlay hints ${enable ? 'enabled' : 'disabled'}.`);
  });

  const toggleCodeLensCommand = commands.registerCommand('hledgerLanguageServer.toggleCodeLens', async () => {
    const config = workspace.getConfiguration('hledgerLanguageServer');
    const currentValue = config.get<boolean>('codeLens.showTransactionCounts', false);
    const enable = !currentValue;

    await config.update('codeLens.showTransactionCounts', enable, true);

    window.showInformationMessage(`hledger code lens ${enable ? 'enabled' : 'disabled'}.`);
  });

  const toggleValidationCommand = commands.registerCommand('hledgerLanguageServer.toggleValidation', async () => {
    const config = workspace.getConfiguration('hledgerLanguageServer');
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

    const anyEnabled = keys.some(key => config.get<boolean>(key, true));
    const enable = !anyEnabled;

    await Promise.all(keys.map(key => config.update(key, enable, true)));

    window.showInformationMessage(`hledger validation ${enable ? 'enabled' : 'disabled'}.`);
  });

  // Create workspace graph tree view
  workspaceGraphProvider = new WorkspaceGraphProvider(undefined);
  const treeView = window.createTreeView('hledgerWorkspaceGraph', {
    treeDataProvider: workspaceGraphProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(treeView);

  // Command to refresh the workspace graph
  const refreshWorkspaceGraphCommand = commands.registerCommand(
    'hledgerLanguageServer.refreshWorkspaceGraph',
    () => {
      if (workspaceGraphProvider) {
        workspaceGraphProvider.refresh();
      }
    }
  );

  // Command to open a file from the tree view
  const openFileCommand = commands.registerCommand(
    'hledgerLanguageServer.openFile',
    (filePath: string) => {
      if (filePath) {
        workspace.openTextDocument(Uri.file(filePath)).then(doc => {
          window.showTextDocument(doc);
        });
      }
    }
  );

  context.subscriptions.push(
    reloadCommand,
    showLogCommand,
    toggleInlayHintsCommand,
    toggleCodeLensCommand,
    toggleValidationCommand,
    refreshWorkspaceGraphCommand,
    openFileCommand,
  );

  // Start the client. This will also launch the server
  client.start();
  if (statusBarItem) {
    statusBarItem.text = 'hledger: running';
  }

  // Set the client on the workspace graph provider after it's started
  if (workspaceGraphProvider) {
    workspaceGraphProvider.setClient(client);
  }
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  if (statusBarItem) {
    statusBarItem.text = 'hledger: stopped';
  }
  return client.stop();
}
