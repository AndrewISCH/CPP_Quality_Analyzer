import * as vscode from 'vscode';
import { CONFIG_FILENAME, EXTENSION_IDENTIFIER } from './constants/constants';
import { debouncer } from './utility/debouncer';
import { createParser, setExtensionPath } from './core/syntax/syntax-parser';
import { rulesConfig } from './core/rules-builder/rules_builder';
import { analyzeDocument } from './core/syntax/analyzer';

const CONFIG_FILENAME_MATCHER = `**/${CONFIG_FILENAME}`;

const analyzeAllOpenedDocs = (
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  const openedDocs = vscode.workspace.textDocuments.filter(
    (doc) => doc.languageId === 'cpp'
  );

  openedDocs.forEach(async (doc) => analyzeDocument(doc, diagnosticCollection));
};

export async function activate(context: vscode.ExtensionContext) {
  setExtensionPath(context.extensionPath);

  rulesConfig.build();

  await createParser();

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection(EXTENSION_IDENTIFIER);

  context.subscriptions.push(diagnosticCollection);

  analyzeAllOpenedDocs(diagnosticCollection);

  vscode.workspace.onDidOpenTextDocument(
    async (doc) => {
      if (doc.languageId === 'cpp') {
        await analyzeDocument(doc, diagnosticCollection);
      }
    },
    null,
    context.subscriptions
  );

  // vscode.workspace.onDidSaveTextDocument(
  //   async (doc) => {
  //     if (doc.languageId === 'cpp') {
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

  const analyzeDocumentOnChange = debouncer(
    async (event: vscode.TextDocumentChangeEvent) => {
      await analyzeDocument(event.document, diagnosticCollection);
    }
  );
  const watcher = vscode.workspace.createFileSystemWatcher(
    CONFIG_FILENAME_MATCHER
  );

  watcher.onDidChange(() => {
    rulesConfig.build();
    analyzeAllOpenedDocs(diagnosticCollection);
  });
  watcher.onDidCreate(() => {
    rulesConfig.build();
    analyzeAllOpenedDocs(diagnosticCollection);
  });
  watcher.onDidDelete(() => {
    rulesConfig.build();
    analyzeAllOpenedDocs(diagnosticCollection);
  });

  context.subscriptions.push(watcher);

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (event.document.languageId !== 'cpp') {
        return;
      }
      analyzeDocumentOnChange(event);
    },
    null,
    context.subscriptions
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
