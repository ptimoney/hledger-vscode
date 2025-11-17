// Jest stub for the `vscode` module used in extension tests.

export const mockOutputChannels: any[] = [];
export const mockStatusBarItems: any[] = [];
export const mockRegisteredCommands: Record<string, (...args: any[]) => any> = {};

export const window = {
  createOutputChannel: jest.fn((name: string) => {
    const ch = {
      name,
      appendLine: jest.fn(),
      show: jest.fn(),
    };
    mockOutputChannels.push(ch);
    return ch;
  }),
  createStatusBarItem: jest.fn(() => {
    const item = {
      text: '',
      tooltip: undefined as string | undefined,
      command: undefined as string | undefined,
      show: jest.fn(),
    };
    mockStatusBarItems.push(item);
    return item;
  }),
  showInformationMessage: jest.fn(),
};

// Simple per-section configuration store so tests and code share the same object
const configStore: Record<string, { get: jest.Mock; update: jest.Mock }> = {};

export const workspace = {
  getConfiguration: jest.fn((section?: string) => {
    const key = section || '__default__';
    if (!configStore[key]) {
      const store: Record<string, any> = {};
      const cfg = {
        get: jest.fn((k: string, defaultValue?: any) => {
          return k in store ? store[k] : defaultValue;
        }),
        update: jest.fn((k: string, value: any) => {
          store[k] = value;
          return Promise.resolve();
        }),
      };
      configStore[key] = cfg as any;
    }
    return configStore[key];
  }),
  createFileSystemWatcher: jest.fn(() => ({})),
};

export const commands = {
  registerCommand: jest.fn((id: string, handler: (...args: any[]) => any) => {
    mockRegisteredCommands[id] = handler;
    return { dispose: jest.fn() };
  }),
};

export const StatusBarAlignment = { Left: 1 } as const;

// Re-export helpers for tests
export const __test = {
  mockOutputChannels,
  mockStatusBarItems,
  mockRegisteredCommands,
  configStore,
};
