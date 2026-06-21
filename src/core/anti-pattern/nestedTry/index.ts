import { Node } from 'web-tree-sitter';
import { RuleBuilder, BaseRuleConfig } from '../../rules-builder/types';
import { nodeToRange } from '../../../utility/nodeToRange';
import { AntiPatternIdentifier } from '../identifier';
import { SEVERITY_LEVEL_MAPPING } from '../../../constants/constants';
import { getRuleFromDefaultConfig } from '../../rules-builder/config';
import { createDiagnostic } from '../common';

export interface NestedTryConfigType {}

export const nestedTryBuilder: RuleBuilder<
  NestedTryConfigType & BaseRuleConfig
> = ({ level }) => {
  const defaultConfig = getRuleFromDefaultConfig(
    AntiPatternIdentifier.NESTED_TRY
  );
  const severityLevel = level ?? defaultConfig.level;

  return {
    check(node: Node) {
      let current = node.parent;
      while (current) {
        if (current.type === 'try_statement') {
          return createDiagnostic(
            nodeToRange(node),
            'Nested try statement detected',
            SEVERITY_LEVEL_MAPPING[severityLevel],
            AntiPatternIdentifier.NESTED_TRY
          );
        }
        current = current.parent;
      }

      return null;
    },
  };
};
