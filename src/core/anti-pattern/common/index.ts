import * as vscode from 'vscode';
import { AntiPatternIdentifier } from '../identifier';

export const createDiagnostic = (
  range: vscode.Range,
  message: string,
  severity: vscode.DiagnosticSeverity,
  code: AntiPatternIdentifier
): vscode.Diagnostic => {
  const diagnostic = new vscode.Diagnostic(range, message, severity);
  diagnostic.code = code;
  return diagnostic;
};
