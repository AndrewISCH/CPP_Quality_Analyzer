import { Node } from 'web-tree-sitter';
import * as vscode from 'vscode';
import { nodeToRange } from '../../../utility/nodeToRange';
import { CodeActionBuilder } from '../provider';

const BOOLEAN_LITERAL_TYPES = new Set(['true', 'false']);

const isBooleanLiteral = (node: Node): boolean => {
  return BOOLEAN_LITERAL_TYPES.has(node.type);
};

const shouldNegate = (literal: Node, operator: string): boolean => {
  const isTrueLiteral = literal.type === 'true';
  const isEqualOp = operator === '==';
  return isEqualOp !== isTrueLiteral;
};

export const createBooleanComparisonFix: CodeActionBuilder = (
  document,
  binaryExpr,
  diagnostic
) => {
  const left = binaryExpr.child(0);
  const operatorNode = binaryExpr.child(1);
  const right = binaryExpr.child(2);

  if (!left || !right || !operatorNode) {
    return null;
  }

  const operator = operatorNode.text;
  let literalNode: Node;
  let operandNode: Node;

  if (isBooleanLiteral(left)) {
    literalNode = left;
    operandNode = right;
  } else if (isBooleanLiteral(right)) {
    literalNode = right;
    operandNode = left;
  } else {
    return null;
  }

  const replacement = shouldNegate(literalNode, operator)
    ? `!(${operandNode.text})`
    : operandNode.text;

  const action = new vscode.CodeAction(
    `Replace comparison with '${replacement}'`,
    vscode.CodeActionKind.QuickFix
  );

  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(document.uri, nodeToRange(binaryExpr), replacement);
  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  return action;
};
