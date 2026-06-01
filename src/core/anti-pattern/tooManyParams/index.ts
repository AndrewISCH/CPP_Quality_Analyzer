import { Node } from 'web-tree-sitter';
import * as vscode from 'vscode';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/default_config';

export interface TooManyParametersConfigType {
  maxParams: number;
}

const isRequiredParameter = (param: Node): boolean => {
  return !param.children.some((child) => child.text === '=');
};

export const tooManyParametersBuilder: RuleBuilder<
  TooManyParametersConfigType & BaseRuleConfig
> = ({ level, maxParams: maxParameters }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.TOO_MANY_PARAMS
  );
  const severityLevel = level ?? defaultConfig.level;
  const maxParams = maxParameters ?? defaultConfig.maxParams;

  return {
    check(node: Node) {
      const params =
        node.children?.filter((c) => c.type === 'parameter_declaration') ?? [];
      const requiredCount = params.filter(isRequiredParameter).length;

      if (requiredCount <= maxParams) {
        return null;
      }

      return new vscode.Diagnostic(
        nodeToRange(node),
        `Function has too many required parameters: ${requiredCount} (max ${maxParams})`,
        SEVERITY_LEVEL_MAPPING[severityLevel]
      );
    },
  };
};
