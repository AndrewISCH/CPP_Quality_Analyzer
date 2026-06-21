import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { AntiPatternIdentifier } from '../identifier';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface DeepNestingConfigType {
  maxDepth: number;
}

const BOUNDARY_TYPES = [
  'function_definition',
  'translation_unit',
  'lambda_expression',
  'method_definition',
];
const getDepth = (node: Node): number => {
  const nestingTypes = [
    'if_statement',
    'for_statement',
    'while_statement',
    'switch_statement',
  ];

  let depth = 1;
  let current = node.parent;

  while (current) {
    if (BOUNDARY_TYPES.includes(current.type) || current.parent === null) {
      break;
    }
    if (nestingTypes.includes(current.type)) {
      depth++;
    }
    current = current.parent;
  }

  return depth;
};

export const deepNestingBuilder: RuleBuilder<
  DeepNestingConfigType & BaseRuleConfig
> = (config) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.DEEP_NESTING
  );

  const maxDepth = config?.maxDepth ?? defaultConfig.maxDepth;
  const severityLevel = config?.level ?? defaultConfig.level;

  return {
    check(node: Node) {
      const depth = getDepth(node);
      if (depth <= maxDepth) {
        return null;
      }
      return createDiagnostic(
        nodeToRange(node),
        `Nesting too deep: ${depth} levels (max ${maxDepth})`,
        SEVERITY_LEVEL_MAPPING[severityLevel],
        AntiPatternIdentifier.DEEP_NESTING
      );
    },
  };
};
