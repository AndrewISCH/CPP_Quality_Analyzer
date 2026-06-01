import { Node } from 'web-tree-sitter';
import * as vscode from 'vscode';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { AntiPatternIdentifier } from '../identifier';
import { getRuleFromDefaultConfig } from '../../rules-builder/default_config';

export interface EmptyCatchBlockConfigType {
  allowComments: boolean;
}

export const emptyCatchBlockBuilder: RuleBuilder<
  EmptyCatchBlockConfigType & BaseRuleConfig
> = ({ level, allowComments }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.EMPTY_CATCH_BLOCK
  );

  const severityLevel = level ?? defaultConfig.level;
  return {
    check(node: Node) {
      const body = node.children.find(
        (child) => child.type === 'compound_statement'
      );

      if (!body) {
        return null;
      }
      const hasStatements = body.children.some(
        (child) =>
          child.type !== '{' &&
          child.type !== '}' &&
          (allowComments || child.type !== 'comment')
      );

      if (hasStatements) {
        return null;
      }

      return new vscode.Diagnostic(
        nodeToRange(node),
        'Catch block should not be empty',
        SEVERITY_LEVEL_MAPPING[severityLevel]
      );
    },
  };
};
