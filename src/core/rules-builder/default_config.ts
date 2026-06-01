import { AntiPatternIdentifier } from '../anti-pattern/identifier';
import { AnalyzerConfig } from './rules_builder';

export const DEFAULT_CONFIG: AnalyzerConfig = {
  autoChange: true,
  rules: {
    longFunction: { enabled: true, maxLines: 20, level: 'warn' },
    magicNumbers: { enabled: true, level: 'warn' },
    deepNesting: { enabled: true, maxDepth: 3, level: 'error' },
    nestedTry: { enabled: true, level: 'error' },
    exitCall: { enabled: true, level: 'warn' },
    emptyCatchBlock: { enabled: true, level: 'warn', allowComments: false },
    globalVariables: { enabled: true, level: 'warn', ignoreNamespaces: false },
    booleanComparison: { enabled: true, level: 'warn' },
    tooManyParams: { enabled: true, level: 'warn', maxParams: 5 },
    paramReassignment: { enabled: true, level: 'error' },
    nestedTernary: { enabled: true, maxDepth: 2, level: 'error' },
    redundantBooleanReturn: { enabled: true, level: 'error' },
    namingConvention: { enabled: false, level: 'warn', style: 'google' },
  },
} as const;

export const getRuleFromDefaultConfig = <T extends AntiPatternIdentifier>(
  identifier: T
): AnalyzerConfig['rules'][T] => {
  return DEFAULT_CONFIG.rules[identifier];
};
