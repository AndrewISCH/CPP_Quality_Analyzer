// src/core/code-actions/redundantBooleanTernaryFix.ts
import { Node } from 'web-tree-sitter';
import * as vscode from 'vscode';
import { CodeActionBuilder } from '../provider';
import { nodeToRange } from '../../../utility/nodeToRange';

type StringifiedBoolean = '0' | '1' | 'false' | 'true';

const BOOLEAN_VALUES: Set<StringifiedBoolean> = new Set(['true', 'false']);
const BOOLEAN_NUMERIC_VALUES: Set<StringifiedBoolean> = new Set(['1', '0']);

const CAST_TO_BOOLEAN_MAP: Record<StringifiedBoolean, boolean> = {
  true: true,
  false: false,
  '1': true,
  '0': false,
};

const extractBooleanValue = (node: Node): StringifiedBoolean | null => {
  if (BOOLEAN_VALUES.has(node.type as StringifiedBoolean)) {
    return node.type as StringifiedBoolean;
  }
  if (
    node.type === 'number_literal' &&
    BOOLEAN_NUMERIC_VALUES.has(node.text as StringifiedBoolean)
  ) {
    return node.text as StringifiedBoolean;
  }
  return null;
};

export const createRedundantBooleanTernaryFix: CodeActionBuilder = (
  document,
  conditionalExpr,
  diagnostic
) => {
  const condition = conditionalExpr.childForFieldName('condition');
  const consequence = conditionalExpr.childForFieldName('consequence');
  const alternative = conditionalExpr.childForFieldName('alternative');

  if (!condition || !consequence || !alternative) {
    return null;
  }

  const thenValue = extractBooleanValue(consequence);
  const elseValue = extractBooleanValue(alternative);
  if (!thenValue || !elseValue) {
    return null;
  }

  const replacement =
    thenValue === elseValue
      ? thenValue
      : CAST_TO_BOOLEAN_MAP[thenValue]
        ? condition.text
        : `!(${condition.text})`;

  const action = new vscode.CodeAction(
    `Replace ternary with '${replacement}'`,
    vscode.CodeActionKind.QuickFix
  );

  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(document.uri, nodeToRange(conditionalExpr), replacement);
  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  return action;
};
