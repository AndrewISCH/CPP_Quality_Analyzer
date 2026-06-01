import * as vscode from 'vscode';
import { SyntaxNode } from '../syntax/syntax-parser';

export interface RuleConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface AntiPattern {
  name: string;
  severity: vscode.DiagnosticSeverity;
  check: (
    node: SyntaxNode,
    source: string,
    config: RuleConfig
  ) => vscode.Diagnostic | null;
}
