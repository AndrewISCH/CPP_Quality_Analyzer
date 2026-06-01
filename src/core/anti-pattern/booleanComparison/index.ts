import { Node } from 'web-tree-sitter';
import * as vscode from 'vscode';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/default_config';

export interface BooleanComparisonConfigType {}

const BOOLEAN_LITERALS = new Set(['true', 'false']);
const NUMERIC_BOOLEAN_LITERALS = new Set(['0', '1']);

const isBooleanLiteral = (node: Node): boolean => {
  if (BOOLEAN_LITERALS.has(node.type)) {
    return true;
  }
  if (
    node.type === 'number_literal' &&
    NUMERIC_BOOLEAN_LITERALS.has(node.text)
  ) {
    return true;
  }
  return false;
};

export const booleanComparisonBuilder: RuleBuilder<
  BooleanComparisonConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.BOOLEAN_COMPARISON
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      const parent = node.parent;
      if (parent?.type !== 'binary_expression') {
        return null;
      }

      const leftOperand = parent.child(0);
      const rightOperand = parent.child(2);

      if (!leftOperand || !rightOperand) {
        return null;
      }

      const leftIsBool = isBooleanLiteral(leftOperand);
      const rightIsBool = isBooleanLiteral(rightOperand);

      if (leftIsBool === rightIsBool) {
        return null;
      }

      return new vscode.Diagnostic(
        nodeToRange(parent),
        `Avoid direct comparison with boolean literals`,
        SEVERITY_LEVEL_MAPPING[severityLevel]
      );
    },
  };
};
