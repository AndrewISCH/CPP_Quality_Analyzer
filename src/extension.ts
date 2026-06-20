import * as vscode from 'vscode';
import {
  CONFIG_FILENAME,
  EXTENSION_IDENTIFIER,
  SUPPORTED_LANGUAGE_IDS,
} from './constants/constants';
import { debouncer } from './utility/debouncer';
import { createParser, setExtensionPath } from './core/syntax/syntax-parser';
import { rulesConfig } from './core/rules-builder/rules_builder';
import {
  analyzeDocument,
  analyzeDocumentIncrementally,
  deleteTree,
} from './core/syntax/analyzer';
import {
  clearDiagnosticForIgnoredDocs,
  shouldIgnore,
} from './core/rules-builder/ignore';

const CONFIG_FILENAME_MATCHER = `**/${CONFIG_FILENAME}`;

const isDocValid = (doc: vscode.TextDocument) => {
  const ignoredPatterns = rulesConfig.getOptions().ignore;

  return (
    SUPPORTED_LANGUAGE_IDS.includes(doc.languageId) &&
    (!ignoredPatterns || !shouldIgnore(doc.uri, ignoredPatterns))
  );
};

const PENDING_CHANGES = new Map<
  string,
  {
    document: vscode.TextDocument;
    changes: vscode.TextDocumentContentChangeEvent[];
  }
>();

const analyzeAllOpenedDocs = (
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  const openedDocs = vscode.workspace.textDocuments.filter(isDocValid);

  openedDocs.forEach(async (doc) => analyzeDocument(doc, diagnosticCollection));
};

const rebuildConfig = (diagnosticCollection: vscode.DiagnosticCollection) => {
  rulesConfig.build();
  const ignoredPatterns = rulesConfig.getOptions().ignore;
  ignoredPatterns &&
    clearDiagnosticForIgnoredDocs(diagnosticCollection, ignoredPatterns);
  analyzeAllOpenedDocs(diagnosticCollection);
};

export async function activate(context: vscode.ExtensionContext) {
  setExtensionPath(context.extensionPath);

  await rulesConfig.findConfigFile();

  rulesConfig.build();

  await createParser();

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection(EXTENSION_IDENTIFIER);

  context.subscriptions.push(diagnosticCollection);

  analyzeAllOpenedDocs(diagnosticCollection);

  vscode.workspace.onDidOpenTextDocument(
    async (doc) => {
      if (isDocValid(doc)) {
        await analyzeDocument(doc, diagnosticCollection);
      }
    },
    null,
    context.subscriptions
  );

  const processChanges = debouncer(async () => {
    const values = Array.from(PENDING_CHANGES.values());
    PENDING_CHANGES.clear();

    values.forEach(async ({ document, changes }) => {
      await analyzeDocumentIncrementally(
        document,
        changes,
        diagnosticCollection
      );
    });
  });

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (!isDocValid(event.document)) {
        return;
      }
      const uriKey = event.document.uri.toString();
      const existing = PENDING_CHANGES.get(uriKey);

      if (existing) {
        existing.changes.push(...event.contentChanges);
      } else {
        PENDING_CHANGES.set(uriKey, {
          document: event.document,
          changes: [...event.contentChanges],
        });
      }

      processChanges();
    },
    null,
    context.subscriptions
  );

  // vscode.workspace.onDidSaveTextDocument(
  //   async (doc) => {
  //     if (isDocValid(doc)) {
  //       // console.log('applying, blablabla');
  //       // const edit = new vscode.WorkspaceEdit();
  //       // edit.insert(
  //       //   doc.uri,
  //       //   new vscode.Position(0, 0),
  //       //   '#include <iostream>\n'
  //       // );
  //       // await vscode.workspace.applyEdit(edit);
  //     }
  //   },
  //   null,
  //   context.subscriptions
  // );
  vscode.workspace.onDidDeleteFiles(
    async (doc) => {
      doc.files?.forEach((uri) => deleteTree(uri.toString()));
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidCloseTextDocument(
    (doc) => {
      deleteTree(doc.uri.toString());
      diagnosticCollection.delete(doc.uri);
    },
    null,
    context.subscriptions
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    CONFIG_FILENAME_MATCHER
  );

  watcher.onDidChange(async () => {
    await rulesConfig.findConfigFile();
    rebuildConfig(diagnosticCollection);
  });
  watcher.onDidCreate(async () => {
    rebuildConfig(diagnosticCollection);
  });
  watcher.onDidDelete(async () => {
    rebuildConfig(diagnosticCollection);
  });

  context.subscriptions.push(watcher);
}

export function deactivate() {}
