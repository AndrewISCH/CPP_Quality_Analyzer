import * as vscode from 'vscode';
import {
  AntiPatternIdentifier,
  isAntipatternIdentifier,
} from '../anti-pattern/identifier';
import { PARSED_TREE_CACHE } from '../syntax/analyzer';
import { SyntaxNode } from '../syntax/syntax-parser';
import { createBooleanComparisonFix } from './booleanComparisonFix';
import { rulesConfig } from '../rules-builder/rules_builder';
import { createRedundantBooleanReturnFix } from './redundantBooleanReturnFix';
import { createRedundantBooleanTernaryFix } from './redundantBooleanTernaryFix';

const FIX_ALL_KIND = vscode.CodeActionKind.SourceFixAll.append('cppaquality');

export type CodeActionBuilder = (
  document: vscode.TextDocument,
  node: SyntaxNode,
  diagnostic: vscode.Diagnostic
) => vscode.CodeAction | null;

const CODE_ACTION_FOR_ANTIPATTERN: Partial<
  Record<AntiPatternIdentifier, CodeActionBuilder>
> = {
  [AntiPatternIdentifier.BOOLEAN_COMPARISON]: createBooleanComparisonFix,
  [AntiPatternIdentifier.REDUNDANT_BOOLEAN_RETURN]:
    createRedundantBooleanReturnFix,
  [AntiPatternIdentifier.REDUNDANT_BOOLEAN_TERNARY]:
    createRedundantBooleanTernaryFix,
};

export const SUPPORTED_ANTIPATTERNS = Object.keys(
  CODE_ACTION_FOR_ANTIPATTERN
) as AntiPatternIdentifier[];

export class AnalyzerCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    FIX_ALL_KIND,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    _: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const tree = PARSED_TREE_CACHE.get(document.uri.toString());
    if (!tree) {
      return [];
    }

    if (context.only?.contains(FIX_ALL_KIND)) {
      return this.provideFixAllAction(document, tree);
    }

    return this.provideQuickFixActions(document, tree, context);
  }

  private provideQuickFixActions(
    document: vscode.TextDocument,
    tree: NonNullable<ReturnType<typeof PARSED_TREE_CACHE.get>>,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    return context.diagnostics.flatMap((diagnostic) => {
      const code = diagnostic.code;
      if (!isAntipatternIdentifier(code)) {
        return [];
      }

      const builder = CODE_ACTION_FOR_ANTIPATTERN[code];
      if (!builder) {
        return [];
      }

      const startIndex = document.offsetAt(diagnostic.range.start);
      const endIndex = document.offsetAt(diagnostic.range.end);
      const node = tree.rootNode.descendantForIndex(startIndex, endIndex);
      if (!node) {
        return [];
      }

      const action = builder(document, node, diagnostic);
      return action ? [action] : [];
    });
  }

  private provideFixAllAction(
    document: vscode.TextDocument,
    tree: NonNullable<ReturnType<typeof PARSED_TREE_CACHE.get>>
  ): vscode.CodeAction[] {
    const fixOnSaveConfig = rulesConfig.getOptions().fixOnSave;
    if (!fixOnSaveConfig) {
      return [];
    }

    const allowedRules = fixOnSaveConfig.rules ?? SUPPORTED_ANTIPATTERNS;

    const allDiagnostics = vscode.languages.getDiagnostics(document.uri);
    const fixableDiagnostics = allDiagnostics.filter((d) => {
      const code = d.code;
      return isAntipatternIdentifier(code) && allowedRules.includes(code);
    });

    if (fixableDiagnostics.length === 0) {
      return [];
    }

    const aggregatedEdit = new vscode.WorkspaceEdit();
    let hasAnyEdit = false;

    for (const diagnostic of fixableDiagnostics) {
      const code = diagnostic.code as AntiPatternIdentifier;
      const builder = CODE_ACTION_FOR_ANTIPATTERN[code];
      if (!builder) {
        continue;
      }

      const startIndex = document.offsetAt(diagnostic.range.start);
      const endIndex = document.offsetAt(diagnostic.range.end);
      const node = tree.rootNode.descendantForIndex(startIndex, endIndex);
      if (!node) {
        continue;
      }

      const partialAction = builder(document, node, diagnostic);
      if (!partialAction?.edit) {
        continue;
      }

      for (const [uri, edits] of partialAction.edit.entries()) {
        for (const edit of edits) {
          if (edit instanceof vscode.TextEdit) {
            aggregatedEdit.replace(uri, edit.range, edit.newText);
            hasAnyEdit = true;
          }
        }
      }
    }

    if (!hasAnyEdit) {
      return [];
    }

    const action = new vscode.CodeAction(
      'Fix all auto-fixable problems (CPP Quality Analyzer)',
      FIX_ALL_KIND
    );
    action.edit = aggregatedEdit;
    action.diagnostics = fixableDiagnostics;

    return [action];
  }
}
