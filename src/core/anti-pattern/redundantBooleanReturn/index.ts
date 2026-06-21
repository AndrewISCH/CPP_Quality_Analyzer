import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface RedundantBooleanReturnConfigType {}

type StringifiedBoolean = '0' | '1' | 'false' | 'true';

const BOOLEAN_VALUES: Set<StringifiedBoolean> = new Set(['true', 'false']);

const BOOLEAN_NUMERIC_VALUES: Set<StringifiedBoolean> = new Set(['1', '0']);

const CAST_TO_BOOLEAN_MAP = {
  ['true']: true,
  ['false']: false,
  ['1']: true,
  ['0']: false,
};
const getSingleBooleanReturn = (
  block: Node | null
): StringifiedBoolean | null => {
  if (!block) {
    return null;
  }

  if (block.type === 'return_statement') {
    return extractBooleanValue(block);
  }

  if (block.type !== 'compound_statement') {
    return null;
  }

  const meaningful = block.namedChildren.filter((c) => c.type !== 'comment');

  if (meaningful.length !== 1) {
    return null;
  }
  if (meaningful[0].type !== 'return_statement') {
    return null;
  }

  return extractBooleanValue(meaningful[0]);
};

const extractBooleanValue = (returnStmt: Node): StringifiedBoolean | null => {
  const valueNode = returnStmt.namedChildren.find((c) => c.type !== 'return');
  if (!valueNode) {
    return null;
  }

  if (BOOLEAN_VALUES.has(valueNode.type as StringifiedBoolean)) {
    return valueNode.type as StringifiedBoolean;
  }
  if (
    valueNode.type === 'number_literal' &&
    BOOLEAN_NUMERIC_VALUES.has(valueNode.text as StringifiedBoolean)
  ) {
    return valueNode.text as StringifiedBoolean;
  }
  return null;
};

export const redundantBooleanReturnBuilder: RuleBuilder<
  RedundantBooleanReturnConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.REDUNDANT_BOOLEAN_RETURN
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      const consequence = node.childForFieldName('consequence');
      const alternative = node.childForFieldName('alternative');

      if (!consequence || !alternative) {
        return null;
      }

      const thenValue = getSingleBooleanReturn(consequence);
      if (!thenValue) {
        return null;
      }

      const elseBlock =
        alternative.type === 'else_clause'
          ? (alternative.namedChildren.find((c) => c.type !== 'else') ?? null)
          : alternative;

      const elseValue = getSingleBooleanReturn(elseBlock);
      if (!elseValue) {
        return null;
      }

      const isReturnValuesEqual = thenValue === elseValue;
      const displayConditionString = isReturnValuesEqual
        ? thenValue
        : CAST_TO_BOOLEAN_MAP[thenValue]
          ? '<condition>'
          : '!(<condition>)';

      return createDiagnostic(
        nodeToRange(node),
        `Redundant if-else returning boolean. Use 'return ${displayConditionString};' instead`,
        SEVERITY_LEVEL_MAPPING[severityLevel],
        AntiPatternIdentifier.REDUNDANT_BOOLEAN_RETURN
      );
    },
  };
};
