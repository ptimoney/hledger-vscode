import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Open a throwaway copy of the fixture workspace: tests edit its files on disk
    const fixture = path.resolve(__dirname, '../../src/test/fixtures/external-edit');
    const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hledger-vscode-test-'));
    fs.cpSync(fixture, workspaceDir, { recursive: true });

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // Idle timeout for the VS Code download; the default 15s is too tight for
      // the ~315MB archive and intermittently fails CI
      timeout: 60_000,
      launchArgs: [
        workspaceDir,
        '--disable-extensions', // Disable other extensions during tests
        '--disable-gpu', // Disable GPU for stability
      ],
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
