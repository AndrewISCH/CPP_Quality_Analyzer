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

const CONFIG_FILENAME_MATCHER = `**/${CONFIG_FILENAME}`;

const analyzeAllOpenedDocs = (
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  const openedDocs = vscode.workspace.textDocuments.filter((doc) =>
    SUPPORTED_LANGUAGE_IDS.includes(doc.languageId)
  );

  openedDocs.forEach(async (doc) => analyzeDocument(doc, diagnosticCollection));
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
      if (SUPPORTED_LANGUAGE_IDS.includes(doc.languageId)) {
        await analyzeDocument(doc, diagnosticCollection);
      }
    },
    null,
    context.subscriptions
  );

  // vscode.workspace.onDidSaveTextDocument(
  //   async (doc) => {
  //     if (SUPPORTED_LANGUAGE_IDS.includes(doc.languageId)) {
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

  const analyzeDocumentOnChange = debouncer(
    async (event: vscode.TextDocumentChangeEvent) => {
      await analyzeDocumentIncrementally(
        event.document,
        event.contentChanges,
        diagnosticCollection
      );
    }
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (SUPPORTED_LANGUAGE_IDS.includes(event.document.languageId)) {
        analyzeDocumentOnChange(event);
      }
    },
    null,
    context.subscriptions
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    CONFIG_FILENAME_MATCHER
  );

  watcher.onDidChange(async () => {
    await rulesConfig.findConfigFile();
    rulesConfig.build();
    analyzeAllOpenedDocs(diagnosticCollection);
  });
  watcher.onDidCreate(() => {
    rulesConfig.build();
    analyzeAllOpenedDocs(diagnosticCollection);
  });
  watcher.onDidDelete(async () => {
    rulesConfig.build();
    analyzeAllOpenedDocs(diagnosticCollection);
  });

  context.subscriptions.push(watcher);
}

export function deactivate() {}
