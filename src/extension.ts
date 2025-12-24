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

/**
 * Attempts to read the version from hledger-lsp package.json
 */
function getHledgerLspVersion(serverModulePath: string): string | undefined {
  try {
    // Navigate up from server.js to find package.json
    const serverDir = path.dirname(serverModulePath);
    let packageJsonPath: string;

    // For bundled server: out/server/server.js -> need to go up to node_modules/hledger-lsp
    // For local server: ../hledger-lsp/out/server.js -> go to ../hledger-lsp
    // For npm package: no
    // de_modules/hledger-lsp/out/server.js -> go up one level

    // Try common locations
    const possiblePaths = [
      path.join(serverDir, '..', 'package.json'), // For npm package or local build
      path.join(serverDir, '..', '..', 'hledger-lsp', 'package.json'), // For some local setups
      require.resolve('hledger-lsp/package.json'), // Use Node resolution
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        packageJsonPath = testPath;
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version;
      }
    }
  } catch (error) {
    // Silently fail - version logging is not critical
    outputChannel.appendLine(`Note: Could not determine hledger-lsp version: ${error}`);
  }
  return undefined;
}

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

  // Resolve the language server in priority order:
  // 1. Local sibling build for active development: <extension_root>/../../hledger-lsp/out/server.js
  // 2. npm package (node_modules or npm link): hledger-lsp/out/server.js
  // 3. Bundled server (fallback for published extension): <extension_root>/out/server/server.js
  let serverModule: string | undefined;
  try {
    // First, check for a local sibling build - highest priority for development
    const localServerPath = path.resolve(context.extensionPath, '..', 'hledger-lsp', 'out', 'server.js');
    outputChannel.appendLine(`looking in: ${localServerPath}`)
    if (fs.existsSync(localServerPath)) {
      serverModule = localServerPath;
      outputChannel.appendLine(`hledger Language> Server: using local development build at ${serverModule}`);
    } else {
      // Try to resolve from node_modules (also works with npm link)
      try {
        serverModule = require.resolve('hledger-lsp/out/server.js');
        outputChannel.appendLine(`hledger Language Server: using npm package at ${serverModule}`);
      } catch {
        // Fall back to bundled server if npm package not found
        const bundledServerPath = path.resolve(context.extensionPath, 'out', 'server', 'server.js');
        if (fs.existsSync(bundledServerPath)) {
          serverModule = bundledServerPath;
          outputChannel.appendLine(`hledger Language Server: using bundled server at ${serverModule}`);
        }
      }
    }

    // Log the hledger-lsp version if available
    if (serverModule) {
      const version = getHledgerLspVersion(serverModule);
      if (version) {
        outputChannel.appendLine(`hledger-lsp version: ${version}`);
      }
    } else {
      // No server module found - throw an error
      throw new Error('No hledger-lsp server module found');
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

  // TypeScript assertion: at this point serverModule should always be defined
  // (either found successfully or set to '' in test environments)
  if (serverModule === undefined) {
    throw new Error('Internal error: serverModule is undefined after initialization');
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const debugOptions = process.env.DEBUG_LSP === 'true'
    ? { execArgv: ['--nolazy', '--inspect=6009'] }
    : {};

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
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
