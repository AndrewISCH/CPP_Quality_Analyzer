import * as vscode from 'vscode';
import { SyntaxNode } from '../core/syntax/syntax-parser';

export const nodeToRange = (node: SyntaxNode): vscode.Range =>
  new vscode.Range(
    new vscode.Position(node.startPosition.row, node.startPosition.column),
    new vscode.Position(node.endPosition.row, node.endPosition.column)
  );
