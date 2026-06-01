import { AnalyzerConfig, RuleBuilder } from '../../rules-builder/types';
import * as vscode from 'vscode';
import { AntiPatternIdentifier } from '../identifier';
import { SyntaxNode } from '../../syntax/syntax-parser';
import { nodeToRange } from '../../../utility/nodeToRange';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/default_config';

export interface LongFunctionConfigType {
  maxLines: number;
}

export const longFunctionBuilder: RuleBuilder<
  AnalyzerConfig['rules'][AntiPatternIdentifier.LONG_FUNCTION_PATTERN]
> = (config) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.LONG_FUNCTION_PATTERN
  );

  const maxLines = config?.maxLines ?? defaultConfig.maxLines;
  const severityLevel = config?.level ?? defaultConfig.level;

  return {
    check(node: SyntaxNode) {
      const lineCount = node.text
        .split('\n')
        .filter((line) => line.trim().length > 0).length;

      if (lineCount <= maxLines) {
        return null;
      }
      return new vscode.Diagnostic(
        nodeToRange(node),
        `Function too long. Current: ${lineCount} lines (max ${maxLines})`,
        SEVERITY_LEVEL_MAPPING[severityLevel]
      );
    },
  };
};
