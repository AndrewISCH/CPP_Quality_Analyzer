import { Tree } from 'web-tree-sitter';
import { rulesConfig } from '../rules-builder/rules_builder';
import {
  getParser,
  parseCode,
  parseCodeIncremental,
  SyntaxNode,
} from './syntax-parser';
import * as vscode from 'vscode';

const PARSED_TREE_CACHE: Map<string, Tree> = new Map();

export const deleteTree = (uri: string) => PARSED_TREE_CACHE.delete(uri);

export const analyzeDocument = async (
  doc: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  const uriKey = doc.uri.toString();
  const oldTree = PARSED_TREE_CACHE.get(uriKey);
  if (oldTree) {
    const diagnostics = analyzeSyntaxTree(oldTree);
    diagnosticCollection.set(doc.uri, diagnostics);
  } else {
    const parser = await getParser();
    const code = doc.getText();
    const parsedTree = parseCode(parser, code);
    const diagnostics = parsedTree ? analyzeSyntaxTree(parsedTree) : [];
    parsedTree && PARSED_TREE_CACHE.set(uriKey, parsedTree);
    diagnosticCollection.set(doc.uri, diagnostics);
  }
};

export const analyzeDocumentIncrementally = async (
  doc: vscode.TextDocument,
  changes: readonly vscode.TextDocumentContentChangeEvent[],
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  const parser = await getParser();
  const code = doc.getText();
  const uriKey = doc.uri.toString();
  const oldTree = PARSED_TREE_CACHE.get(uriKey);
  const parsedTree = oldTree
    ? parseCodeIncremental(parser, code, oldTree, changes)
    : parseCode(parser, code);
  if (parsedTree) {
    const diagnostics = analyzeSyntaxTree(parsedTree);
    PARSED_TREE_CACHE.set(uriKey, parsedTree);
    diagnosticCollection.set(doc.uri, diagnostics);
  } else {
    diagnosticCollection.set(doc.uri, []);
  }
};

const analyzeSyntaxTree = (tree: Tree): vscode.Diagnostic[] => {
  const diagnostics: vscode.Diagnostic[] = [];
  const rules = rulesConfig.getRules();
  const rootNode = tree?.rootNode;
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
