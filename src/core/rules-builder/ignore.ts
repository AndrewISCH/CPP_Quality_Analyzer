import * as vscode from 'vscode';
import { minimatch } from 'minimatch';

export const shouldIgnore = (
  uri: vscode.Uri,
  ignorePatterns: string[]
): boolean => {
  const path = uri.fsPath.replace(/\\/g, '/');
  return ignorePatterns.some((pattern) =>
    minimatch(path, pattern, { matchBase: true })
  );
};

export const clearDiagnosticForIgnoredDocs = (
  diagnosticCollection: vscode.DiagnosticCollection,
  ignorePatterns: string[]
) => {
  if (ignorePatterns.length === 0) {
    return;
  }

  diagnosticCollection.forEach((uri) => {
    if (shouldIgnore(uri, ignorePatterns)) {
      diagnosticCollection.delete(uri);
    }
  });
};
