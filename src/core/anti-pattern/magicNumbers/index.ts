import { Node } from 'web-tree-sitter';
import * as vscode from 'vscode';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/default_config';

export interface MagicNumbersConfigType {}

const IGNORED_VALUES = new Set(['0', '1']);

const DELIMITERS_NODE_TYPES = ['function_definition', 'translation_unit'];

const isConstantDeclaration = (node: Node): boolean => {
  let current = node.parent;

  while (current) {
    if (current.type === 'declaration') {
      return current.text.trimStart().startsWith('const');
    }
    if (DELIMITERS_NODE_TYPES.includes(current.type)) {
      return false;
    }
    current = current.parent;
  }

  return false;
};

const isInsideExpression = (node: Node): boolean => {
  const parent = node.parent;
  if (!parent) {
    return false;
  }

  const expressionTypes = [
    'binary_expression',
    'unary_expression',
    'argument_list',
    'condition_clause',
    'return_statement',
    'subscript_expression',
  ];

  return expressionTypes.includes(parent.type);
};

export const magicNumbersBuilder: RuleBuilder<
  MagicNumbersConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.MAGIC_NUMBERS
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      if (IGNORED_VALUES.has(node.text)) {
        return null;
      }
      if (isConstantDeclaration(node)) {
        return null;
      }
      if (!isInsideExpression(node)) {
        return null;
      }

      return new vscode.Diagnostic(
        nodeToRange(node),
        `Magic number detected: ${node.text}`,
        SEVERITY_LEVEL_MAPPING[severityLevel]
      );
    },
  };
};
