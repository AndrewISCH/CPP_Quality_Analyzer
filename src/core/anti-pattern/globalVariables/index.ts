import { Node } from 'web-tree-sitter';
import * as vscode from 'vscode';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/default_config';

export interface GlobalVariablesConfigType {
  ignoreNamespaces: boolean;
}

export const globalVariablesBuilder: RuleBuilder<
  GlobalVariablesConfigType & BaseRuleConfig
> = ({ level, ignoreNamespaces }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.GLOBAL_VARIABLES
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      if (node.text.trimStart().startsWith('const')) {
        return null;
      }

      const parentType = node.parent?.type;
      if (
        parentType !== 'translation_unit' &&
        (ignoreNamespaces || parentType !== 'declaration_list')
      ) {
        return null;
      }

      return new vscode.Diagnostic(
        nodeToRange(node),
        'Avoid using global variables',
        SEVERITY_LEVEL_MAPPING[severityLevel]
      );
    },
  };
};
