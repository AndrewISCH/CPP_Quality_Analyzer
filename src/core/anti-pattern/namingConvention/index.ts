import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import {
  NAMING_CONVENTIONS,
  NODE_TYPE_TO_READABLE_NAME,
  NamingStyle,
  DeclarationNodeType,
} from './patterns';
import { createDiagnostic } from '../common';

export interface NamingConventionConfigType {
  style: NamingStyle;
}

const extractIdentifierName = (
  node: Node
): { name: string; range: Node } | null => {
  switch (node.type) {
    case 'function_definition': {
      const funcDeclarator = node.childForFieldName('declarator');
      const identifier = funcDeclarator?.childForFieldName('declarator');
      if (identifier?.type === 'identifier') {
        return { name: identifier.text, range: identifier };
      }
      return null;
    }

    case 'class_specifier':
    case 'struct_specifier':
    case 'union_specifier':
    case 'enum_specifier': {
      const nameNode = node.childForFieldName('name');
      if (nameNode?.type === 'type_identifier') {
        return { name: nameNode.text, range: nameNode };
      }
      return null;
    }

    case 'namespace_definition': {
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        return { name: nameNode.text, range: nameNode };
      }
      return null;
    }

    case 'declaration': {
      const declarator = node.childForFieldName('declarator');
      if (!declarator) {
        return null;
      }

      const identifier =
        declarator.type === 'init_declarator'
          ? declarator.childForFieldName('declarator')
          : declarator;

      if (identifier?.type === 'identifier') {
        return { name: identifier.text, range: identifier };
      }
      return null;
    }

    default:
      return null;
  }
};

const isConstantDeclaration = (node: Node): boolean => {
  if (node.type !== 'declaration') {
    return false;
  }
  return node.text.trimStart().startsWith('const');
};

const getRuleNodeType = (node: Node): DeclarationNodeType => {
  if (node.type === 'declaration' && isConstantDeclaration(node)) {
    return 'const_declaration';
  }
  return node.type as DeclarationNodeType;
};

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

export const namingConventionBuilder: RuleBuilder<
  NamingConventionConfigType & BaseRuleConfig
> = ({ level, style }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.NAMING_CONVENTION
  );
  const severityLevel = level ?? defaultConfig.level;
  const namingStyle = style ?? defaultConfig.style;
  const namingRules = NAMING_CONVENTIONS[namingStyle];
  return {
    check(node: Node) {
      const result = extractIdentifierName(node);
      if (!result) {
        return null;
      }

      const { name, range } = result;
      const ruleNodeType = getRuleNodeType(node);

      const patterns = namingRules[ruleNodeType];
      if (!patterns) {
        return null;
      }

      if (patterns.some((pattern) => pattern.regex.test(name))) {
        return null;
      }

      const readableName = NODE_TYPE_TO_READABLE_NAME[ruleNodeType];

      const patternsName =
        patterns.length > 1
          ? `(${patterns.map((pattern) => pattern.name).join(', ')})`
          : patterns[0].name;

      return createDiagnostic(
        nodeToRange(range),
        `${capitalize(readableName)} '${name}' does not match ${patternsName} naming convention (style: ${namingStyle})`,
        SEVERITY_LEVEL_MAPPING[severityLevel],
        AntiPatternIdentifier.NAMING_CONVENTION
      );
    },
  };
};
