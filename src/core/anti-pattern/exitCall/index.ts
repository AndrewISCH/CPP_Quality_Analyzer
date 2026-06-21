import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface ExitCallConfigType {}

const EXIT_FUNCTIONS = new Set(['exit', 'abort', '_Exit', 'quick_exit']);

export const exitCallBuilder: RuleBuilder<
  ExitCallConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.EXIT_CALL
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      const functionNode = node.childForFieldName('function');
      if (!functionNode) {
        return null;
      }

      if (!EXIT_FUNCTIONS.has(functionNode.text)) {
        return null;
      }

      return createDiagnostic(
        nodeToRange(node),
        `Avoid using '${functionNode.text}' for program termination`,
        SEVERITY_LEVEL_MAPPING[severityLevel],
        AntiPatternIdentifier.EMPTY_CATCH_BLOCK
      );
    },
  };
};
