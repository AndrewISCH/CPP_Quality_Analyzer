import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface ParameterReassignmentConfigType {}

const FUNCTION_BOUNDARY_TYPES = new Set([
  'function_definition',
  'lambda_expression',
]);

const EARLY_EXIT_TYPES = new Set([
  'class_specifier',
  'struct_specifier',
  'union_specifier',
  'namespace_definition',
  'enum_specifier',
]);

type VariableModificationNodeType =
  | 'assignment_expression'
  | 'update_expression';

const getTargetIdentifierFromAssignment = (node: Node): string | null => {
  const left = node.childForFieldName('left');
  return left?.type === 'identifier' ? left.text : null;
};

const getTargetIdentifierFromUpdate = (node: Node): string | null => {
  const argument = node.childForFieldName('argument');
  return argument?.type === 'identifier' ? argument.text : null;
};

const IDENTIFIER_SELECTORS: Record<
  VariableModificationNodeType,
  (node: Node) => string | null
> = {
  assignment_expression: getTargetIdentifierFromAssignment,
  update_expression: getTargetIdentifierFromUpdate,
};

const findEnclosingFunction = (node: Node): Node | null => {
  let current = node.parent;
  while (current) {
    if (FUNCTION_BOUNDARY_TYPES.has(current.type)) {
      return current;
    }
    if (EARLY_EXIT_TYPES.has(current.type)) {
      return null;
    }
    current = current.parent;
  }
  return null;
};

const extractValueParamIdentifier = (param: Node): string | null => {
  if (param.text.trimStart().startsWith('const')) {
    return null;
  }
  const identifierNode = param.children.find(
    (child) => child.type === 'identifier'
  );

  return identifierNode?.text ?? null;
};

const valueParamsCache = new WeakMap<Node, Set<string>>();

const getValueParameters = (funcDefNode: Node): Set<string> => {
  const cacheValue = valueParamsCache.get(funcDefNode);
  if (cacheValue) {
    return cacheValue;
  }

  const result = new Set<string>();

  const declarator = funcDefNode.childForFieldName('declarator');
  const paramList = declarator?.children.find(
    (c) => c.type === 'parameter_list'
  );

  if (paramList) {
    const params = paramList.children.filter(
      (c) => c.type === 'parameter_declaration'
    );

    params.forEach((param) => {
      const identifier = extractValueParamIdentifier(param);
      if (identifier) {
        result.add(identifier);
      }
    });
  }

  valueParamsCache.set(funcDefNode, result);
  return result;
};

export const parameterReassignmentBuilder: RuleBuilder<
  ParameterReassignmentConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.PARAM_REASSIGNMENT
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      const targetIdentifierSelector =
        IDENTIFIER_SELECTORS[node.type as VariableModificationNodeType];

      const targetId = targetIdentifierSelector(node);
      if (!targetId) {
        return null;
      }

      const funcDef = findEnclosingFunction(node);
      if (!funcDef) {
        return null;
      }

      const valueParams = getValueParameters(funcDef);

      if (!valueParams.has(targetId)) {
        return null;
      }

      return createDiagnostic(
        nodeToRange(node),
        `Parameter '${targetId}' is reassigned. Avoid modifying value parameters`,
        SEVERITY_LEVEL_MAPPING[severityLevel],
        AntiPatternIdentifier.PARAM_REASSIGNMENT
      );
    },
  };
};
