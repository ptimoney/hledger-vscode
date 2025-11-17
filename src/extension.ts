import * as path from 'path';
import { workspace, window, commands, ExtensionContext, StatusBarAlignment, StatusBarItem } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let outputChannel = window.createOutputChannel('hledger Language Server');
let statusBarItem: StatusBarItem | undefined;

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

  // Resolve the language server entrypoint.
  // Prefer the installed hledger-language-server package (for published extension),
  // and fall back to the bundled out/server/server.js used in local development.
  let serverModule: string;
  try {
    // When the server is installed as a dependency, this points to server/out/server.js
    // as declared in server/package.json "main".
    serverModule = require.resolve('hledger-language-server/out/server.js');
  } catch {
    outputChannel.appendLine(
      'hledger Language Server: failed to resolve hledger-language-server from node_modules, falling back to bundled out/server/server.js',
    );
    serverModule = context.asAbsolutePath(
      path.join('out', 'server', 'server.js')
    );
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

  context.subscriptions.push(
    reloadCommand,
    showLogCommand,
    toggleInlayHintsCommand,
    toggleValidationCommand,
  );

  // Start the client. This will also launch the server
  client.start();
  if (statusBarItem) {
    statusBarItem.text = 'hledger: running';
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
