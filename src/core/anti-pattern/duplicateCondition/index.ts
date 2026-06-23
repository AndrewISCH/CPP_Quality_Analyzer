import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface DuplicateConditionConfigType {}

const normalizeCondition = (text: string): string => text.replace(/\s+/g, '');

const unwrapParentheses = (node: Node): Node => {
  let current = node;
  while (current.type === 'parenthesized_expression') {
    const inner = current.namedChildren[0];
    if (!inner) {
      break;
    }
    current = inner;
  }
  return current;
};

const getConditionText = (ifStatement: Node): string | null => {
  const condition = ifStatement.childForFieldName('condition');
  if (!condition) {
    return null;
  }

  const valueNode = condition.childForFieldName('value');
  return valueNode && unwrapParentheses(valueNode).text;
};

const collectChainConditions = (ifStatement: Node): string[] => {
  const conditions: string[] = [];
  let current: Node | null = ifStatement;

  while (current && current.type === 'if_statement') {
    const conditionText = getConditionText(current);
    if (conditionText) {
      conditions.push(normalizeCondition(conditionText));
    }

    const alternative = current.childForFieldName('alternative');
    if (!alternative || alternative.type !== 'else_clause') {
      break;
    }

    current =
      alternative.namedChildren.find((c) => c.type === 'if_statement') ?? null;
  }

  return conditions;
};

export const duplicateConditionBuilder: RuleBuilder<
  DuplicateConditionConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.DUPLICATE_CONDITION
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      if (node.parent?.type === 'else_clause') {
        return null;
      }

      const conditions = collectChainConditions(node);
      if (conditions.length < 2) {
        return null;
      }

      const seen = new Set<string>();

      for (const condition of conditions) {
        if (seen.has(condition)) {
          return createDiagnostic(
            nodeToRange(node),
            `Duplicate condition '${condition}' found in if-elif chain. Subsequent branches with the same condition are unreachable.`,
            SEVERITY_LEVEL_MAPPING[severityLevel],
            AntiPatternIdentifier.DUPLICATE_CONDITION
          );
        }
        seen.add(condition);
      }

      return null;
    },
  };
};
