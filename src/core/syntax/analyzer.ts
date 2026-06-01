import { rulesConfig } from '../rules-builder/rules_builder';
import { getParser, logTree, parseCode, SyntaxNode } from './syntax-parser';
import * as vscode from 'vscode';

export const analyzeDocument = async (
  doc: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  const parser = await getParser();
  const code = doc.getText();
  const parsedTree = parseCode(parser, code);
  parsedTree && logTree(parsedTree);
  const diagnostics = parsedTree ? analyzeSyntaxTree(parsedTree) : [];
  diagnosticCollection.set(doc.uri, diagnostics);
};

const analyzeSyntaxTree = (rootNode: SyntaxNode): vscode.Diagnostic[] => {
  const diagnostics: vscode.Diagnostic[] = [];
  const rules = rulesConfig.getRules();

  function walk(node: SyntaxNode) {
    const matchedRules = rules[node.type] ?? [];

    matchedRules.forEach((rule) => {
      const diagnostic = rule.check(node);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    });

    node.children.forEach((child) => walk(child));
  }

  walk(rootNode);
  return diagnostics;
};
