import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface NestedTernaryConfigType {
  maxDepth: number;
}

const BOUNDARY_TYPES = new Set([
  'if_statement',
  'while_statement',
  'for_statement',
  'do_statement',
  'switch_statement',
  'return_statement',
  'assignment_expression',
  'init_declarator',
  'argument_list',
  'compound_statement',
  'expression_statement',
  'translation_unit',
]);

const hasTernaryAncestor = (node: Node): boolean => {
  let current = node.parent;
  while (current) {
    if (current.type === 'conditional_expression') {
      return true;
    }
    if (BOUNDARY_TYPES.has(current.type)) {
      return false;
    }
    current = current.parent;
  }
  return false;
};

const RECURSE_INTO_TYPES = new Set([
  'conditional_expression',
  'binary_expression',
  'unary_expression',
  'parenthesized_expression',
  'comma_expression',
  'assignment_expression',
  'call_expression',
  'argument_list',
]);

const calculateMaxTernaryDepth = (node: Node): number => {
  const isTernary = node.type === 'conditional_expression';

  const childrenDepth = node.children.map((child) => {
    if (!RECURSE_INTO_TYPES.has(child.type)) {
      return 0;
    }
    return calculateMaxTernaryDepth(child);
  });

  const maxChildDepth =
    childrenDepth.length > 0 ? Math.max(...childrenDepth) : 0;

  return isTernary ? maxChildDepth + 1 : maxChildDepth;
};

export const nestedTernaryBuilder: RuleBuilder<
  NestedTernaryConfigType & BaseRuleConfig
> = ({ level, maxDepth }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.NESTED_TERNARY
  );
  const severityLevel = level ?? defaultConfig.level;
  const max = maxDepth ?? defaultConfig.maxDepth;

  return {
    check(node: Node) {
      if (hasTernaryAncestor(node)) {
        return null;
      }

      const depth = calculateMaxTernaryDepth(node);

      if (depth <= max) {
        return null;
      }

      return createDiagnostic(
        nodeToRange(node),
        `Ternary expression too deeply nested: ${depth} levels (max ${max})`,
        SEVERITY_LEVEL_MAPPING[severityLevel],
        AntiPatternIdentifier.NESTED_TERNARY
      );
    },
  };
};
