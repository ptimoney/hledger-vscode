import * as assert from 'assert';
import * as vscode from 'vscode';
import { WorkspaceGraphProvider, WorkspaceGraphEntry } from '../../workspaceGraphProvider';

suite('WorkspaceGraphProvider', () => {
  let provider: WorkspaceGraphProvider;

  setup(() => {
    provider = new WorkspaceGraphProvider(undefined);
  });

  suite('getDepth()', () => {
    test('root-level entry returns 0', () => {
      assert.strictEqual(provider.getDepth('main.journal'), 0);
    });

    test('4 leading spaces returns 1', () => {
      assert.strictEqual(provider.getDepth('    child.journal'), 1);
    });

    test('entry with ├── tree character returns depth 1', () => {
      assert.strictEqual(provider.getDepth('├── child.journal'), 1);
    });

    test('entry with └── tree character returns depth 1', () => {
      assert.strictEqual(provider.getDepth('└── child.journal'), 1);
    });

    test('deep nesting with spaces and tree chars', () => {
      // 4 spaces (depth 1) + │ (depth 1) + ├── (depth 1) = 3
      assert.strictEqual(provider.getDepth('    │   ├── deep.journal'), 3);
    });

    test('8 leading spaces returns 2', () => {
      assert.strictEqual(provider.getDepth('        grandchild.journal'), 2);
    });
  });

  suite('extractLabel()', () => {
    test('plain filename unchanged', () => {
      assert.strictEqual(provider.extractLabel('main.journal'), 'main.journal');
    });

    test('removes ├── prefix', () => {
      assert.strictEqual(provider.extractLabel('├── child.journal'), 'child.journal');
    });

    test('removes └── prefix', () => {
      assert.strictEqual(provider.extractLabel('└── last.journal'), 'last.journal');
    });

    test('removes leading spaces and tree chars', () => {
      assert.strictEqual(provider.extractLabel('    ├── nested.journal'), 'nested.journal');
    });

    test('removes │ with tree chars', () => {
      assert.strictEqual(provider.extractLabel('    │   └── deep.journal'), 'deep.journal');
    });
  });

  suite('buildTree()', () => {
    function entry(display: string, filePath: string = '/test/' + display.replace(/[^a-zA-Z0-9.]/g, '')): WorkspaceGraphEntry {
      return { display, path: filePath, uri: 'file://' + filePath };
    }

    test('empty entries returns empty array', () => {
      const result = provider.buildTree([]);
      assert.strictEqual(result.length, 0);
    });

    test('single root entry', () => {
      const result = provider.buildTree([entry('main.journal', '/test/main.journal')]);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].label, 'main.journal');
      assert.strictEqual(result[0].children.length, 0);
      assert.strictEqual(result[0].collapsibleState, vscode.TreeItemCollapsibleState.None);
    });

    test('root with one child', () => {
      const result = provider.buildTree([
        entry('main.journal', '/test/main.journal'),
        entry('├── child.journal', '/test/child.journal'),
      ]);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].label, 'main.journal');
      assert.strictEqual(result[0].collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
      assert.strictEqual(result[0].children.length, 1);
      assert.strictEqual(result[0].children[0].label, 'child.journal');
    });

    test('multiple roots', () => {
      const result = provider.buildTree([
        entry('first.journal', '/test/first.journal'),
        entry('second.journal', '/test/second.journal'),
      ]);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].label, 'first.journal');
      assert.strictEqual(result[1].label, 'second.journal');
    });

    test('deep nesting (3 levels)', () => {
      const result = provider.buildTree([
        entry('root.journal', '/test/root.journal'),
        entry('├── mid.journal', '/test/mid.journal'),
        entry('    ├── leaf.journal', '/test/leaf.journal'),
      ]);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].label, 'root.journal');
      assert.strictEqual(result[0].children.length, 1);

      const mid = result[0].children[0];
      assert.strictEqual(mid.label, 'mid.journal');
      assert.strictEqual(mid.children.length, 1);
      assert.strictEqual(mid.children[0].label, 'leaf.journal');
    });

    test('mixed siblings and children', () => {
      const result = provider.buildTree([
        entry('root.journal', '/test/root.journal'),
        entry('├── child1.journal', '/test/child1.journal'),
        entry('└── child2.journal', '/test/child2.journal'),
      ]);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].children.length, 2);
      assert.strictEqual(result[0].children[0].label, 'child1.journal');
      assert.strictEqual(result[0].children[1].label, 'child2.journal');
    });

    test('entry with empty path creates cycle marker', () => {
      const result = provider.buildTree([
        entry('├── (cycle)', ''),
      ]);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, '');
      assert.strictEqual(result[0].contextValue, 'cycleMarker');
    });
  });
});
