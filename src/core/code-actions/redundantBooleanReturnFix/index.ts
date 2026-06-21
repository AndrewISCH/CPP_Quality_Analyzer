// src/core/code-actions/redundantBooleanReturnFix.ts
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

const extractBooleanValue = (returnStmt: Node): StringifiedBoolean | null => {
  const valueNode = returnStmt.namedChildren.find((c) => c.type !== 'return');
  if (!valueNode) {
    return null;
  }

  if (BOOLEAN_VALUES.has(valueNode.type as StringifiedBoolean)) {
    return valueNode.type as StringifiedBoolean;
  }
  if (
    valueNode.type === 'number_literal' &&
    BOOLEAN_NUMERIC_VALUES.has(valueNode.text as StringifiedBoolean)
  ) {
    return valueNode.text as StringifiedBoolean;
  }
  return null;
};

const getSingleBooleanReturn = (
  block: Node | null
): StringifiedBoolean | null => {
  if (!block) {
    return null;
  }

  if (block.type === 'return_statement') {
    return extractBooleanValue(block);
  }

  if (block.type !== 'compound_statement') {
    return null;
  }

  const meaningful = block.namedChildren.filter((c) => c.type !== 'comment');
  if (meaningful.length !== 1 || meaningful[0].type !== 'return_statement') {
    return null;
  }

  return extractBooleanValue(meaningful[0]);
};

const getConditionText = (ifStatement: Node): string | null => {
  const condition = ifStatement.childForFieldName('condition');
  const value = condition?.childForFieldName('value');
  return value?.text ?? null;
};

export const createRedundantBooleanReturnFix: CodeActionBuilder = (
  document,
  ifStatement,
  diagnostic
) => {
  const consequence = ifStatement.childForFieldName('consequence');
  const alternative = ifStatement.childForFieldName('alternative');
  if (!consequence || !alternative) {
    return null;
  }

  const thenValue = getSingleBooleanReturn(consequence);
  if (!thenValue) {
    return null;
  }

  const elseBlock =
    alternative.type === 'else_clause'
      ? (alternative.namedChildren.find((c) => c.type !== 'else') ?? null)
      : alternative;

  const elseValue = getSingleBooleanReturn(elseBlock);
  if (!elseValue) {
    return null;
  }

  const condText = getConditionText(ifStatement);
  if (!condText) {
    return null;
  }

  const condition =
    thenValue === elseValue
      ? thenValue
      : CAST_TO_BOOLEAN_MAP[thenValue]
        ? condText
        : `!(${condText})`;

  const replacement = `return ${condition}`;

  const action = new vscode.CodeAction(
    `Replace with '${replacement}'`,
    vscode.CodeActionKind.QuickFix
  );

  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(document.uri, nodeToRange(ifStatement), replacement);
  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  return action;
};
