import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient } from 'vscode-languageclient/node';

interface WorkspaceGraphEntry {
  display: string;
  path: string;
  uri: string;
}

class WorkspaceGraphItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly fileUri: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly children: WorkspaceGraphItem[] = [],
    public readonly depth: number = 0
  ) {
    super(label, collapsibleState);

    if (filePath && filePath !== '') {
      this.resourceUri = vscode.Uri.file(filePath);
      this.command = {
        command: 'hledgerLanguageServer.openFile',
        title: 'Open File',
        arguments: [filePath]
      };
      this.contextValue = 'journalFile';
      this.iconPath = new vscode.ThemeIcon('file');
      this.tooltip = filePath;

      // Add relative path as description
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        for (const folder of workspaceFolders) {
          if (filePath.startsWith(folder.uri.fsPath)) {
            this.description = path.relative(folder.uri.fsPath, filePath);
            break;
          }
        }
      }
    } else {
      // Cycle marker or invalid entry
      this.contextValue = 'cycleMarker';
      this.iconPath = new vscode.ThemeIcon('warning');
    }
  }
}

export class WorkspaceGraphProvider implements vscode.TreeDataProvider<WorkspaceGraphItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<WorkspaceGraphItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private rootItems: WorkspaceGraphItem[] = [];
  private lastEntries: WorkspaceGraphEntry[] = [];

  constructor(private client: LanguageClient | undefined) {}

  setClient(client: LanguageClient | undefined) {
    this.client = client;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WorkspaceGraphItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: WorkspaceGraphItem): Promise<WorkspaceGraphItem[]> {
    if (element) {
      return element.children;
    }

    // Root level - fetch from LSP
    if (!this.client) {
      return [];
    }

    try {
      const result = await this.client.sendRequest('workspace/executeCommand', {
        command: 'hledger.showWorkspaceGraphStructured',
        arguments: []
      });

      if (!result || !Array.isArray(result)) {
        return [];
      }

      const entries = result as WorkspaceGraphEntry[];
      this.lastEntries = entries;
      return this.buildTree(entries);
    } catch (error) {
      console.error('Error fetching workspace graph:', error);
      return [];
    }
  }

  private buildTree(entries: WorkspaceGraphEntry[]): WorkspaceGraphItem[] {
    if (entries.length === 0) return [];

    const items: WorkspaceGraphItem[] = [];
    const stack: { item: WorkspaceGraphItem; depth: number }[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const depth = this.getDepth(entry.display);
      const label = this.extractLabel(entry.display);

      // Check if this node has children by looking ahead
      const hasChildren = i < entries.length - 1 && this.getDepth(entries[i + 1].display) > depth;

      const collapsibleState = hasChildren
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None;

      const item = new WorkspaceGraphItem(
        label,
        entry.path,
        entry.uri,
        collapsibleState,
        [],
        depth
      );

      // Pop stack until we find the parent
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Root item
        items.push(item);
      } else {
        // Child item - add to parent's children
        stack[stack.length - 1].item.children.push(item);
      }

      stack.push({ item, depth });
    }

    return items;
  }

  private getDepth(display: string): number {
    let depth = 0;

    // Count leading spaces (groups of 4)
    const spaces = display.match(/^( *)/);
    if (spaces) {
      depth += Math.floor(spaces[1].length / 4);
    }

    // Count tree characters
    depth += (display.match(/├/g) || []).length;
    depth += (display.match(/└/g) || []).length;
    depth += (display.match(/│/g) || []).length;

    return depth;
  }

  private extractLabel(display: string): string {
    // Remove tree characters and return the filename
    return display.replace(/^[\s│├└─]+/, '').trim();
  }

  getParent(_element: WorkspaceGraphItem): vscode.ProviderResult<WorkspaceGraphItem> {
    // For simplicity, we don't implement parent tracking
    // VS Code tree view doesn't require this for basic functionality
    return null;
  }
}
