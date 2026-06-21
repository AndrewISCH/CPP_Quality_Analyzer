import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface RedundantBooleanTernaryConfigType {}

type StringifiedBoolean = '0' | '1' | 'false' | 'true';

const BOOLEAN_VALUES: Set<StringifiedBoolean> = new Set(['true', 'false']);

const BOOLEAN_NUMERIC_VALUES: Set<StringifiedBoolean> = new Set(['1', '0']);

const CAST_TO_BOOLEAN_MAP = {
  ['true']: true,
  ['false']: false,
  ['1']: true,
  ['0']: false,
};

const extractBooleanValue = (node: Node): StringifiedBoolean | null => {
  if (BOOLEAN_VALUES.has(node.type as StringifiedBoolean)) {
    return node.type as StringifiedBoolean;
  }
  if (
    node.type === 'number_literal' &&
    BOOLEAN_NUMERIC_VALUES.has(node.text as StringifiedBoolean)
  ) {
    return node.text as StringifiedBoolean;
  }
  return null;
};

export const redundantBooleanTernaryBuilder: RuleBuilder<
  RedundantBooleanTernaryConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.REDUNDANT_BOOLEAN_TERNARY
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      const consequence = node.childForFieldName('consequence');
      const alternative = node.childForFieldName('alternative');

      if (!consequence || !alternative) {
        return null;
      }

      const thenValue = extractBooleanValue(consequence);
      if (!thenValue) {
        return null;
      }

      const elseValue = extractBooleanValue(alternative);
      if (!elseValue) {
        return null;
      }

      const isValuesEqual = thenValue === elseValue;
      const displayConditionString = isValuesEqual
        ? thenValue
        : CAST_TO_BOOLEAN_MAP[thenValue]
          ? '<condition>'
          : '!(<condition>)';

      return createDiagnostic(
        nodeToRange(node),
        `Redundant boolean ternary expression. Use '${displayConditionString}' instead`,
        SEVERITY_LEVEL_MAPPING[severityLevel],
        AntiPatternIdentifier.REDUNDANT_BOOLEAN_TERNARY
      );
    },
  };
};
