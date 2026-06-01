import * as vscode from 'vscode';
import { AntiPatternIdentifier } from '../anti-pattern/identifier';
import { LongFunctionConfigType } from '../anti-pattern/longFunction';
import { DeepNestingConfigType } from '../anti-pattern/deepNesting';
import { MagicNumbersConfigType } from '../anti-pattern/magicNumbers';
import { SyntaxNode } from '../syntax/syntax-parser';
import { EmptyCatchBlockConfigType } from '../anti-pattern/emptyCatchBlock';
import { NestedTryConfigType } from '../anti-pattern/nestedTry';
import { ExitCallConfigType } from '../anti-pattern/exitCall';
import { GlobalVariablesConfigType } from '../anti-pattern/globalVariables';
import { BooleanComparisonConfigType } from '../anti-pattern/booleanComparison';
import { TooManyParametersConfigType } from '../anti-pattern/tooManyParams';
import { ParameterReassignmentConfigType } from '../anti-pattern/parameterReassignment';
import { RedundantBooleanReturnConfigType } from '../anti-pattern/redundantBooleanReturn';
import { NamingConventionConfigType } from '../anti-pattern/namingConvention';

export type DiagnosticLevel = 'error' | 'warn' | 'info';

export interface BaseRuleConfig {
  enabled: boolean;
  level: DiagnosticLevel;
}

interface AntiPatternExtendedConfiguration {
  [AntiPatternIdentifier.LONG_FUNCTION_PATTERN]: LongFunctionConfigType;
  [AntiPatternIdentifier.DEEP_NESTING]: DeepNestingConfigType;
  [AntiPatternIdentifier.MAGIC_NUMBERS]: MagicNumbersConfigType;
  [AntiPatternIdentifier.EMPTY_CATCH_BLOCK]: EmptyCatchBlockConfigType;
  [AntiPatternIdentifier.EXIT_CALL]: ExitCallConfigType;
  [AntiPatternIdentifier.NESTED_TRY]: NestedTryConfigType;
  [AntiPatternIdentifier.GLOBAL_VARIABLES]: GlobalVariablesConfigType;
  [AntiPatternIdentifier.BOOLEAN_COMPARISON]: BooleanComparisonConfigType;
  [AntiPatternIdentifier.TOO_MANY_PARAMS]: TooManyParametersConfigType;
  [AntiPatternIdentifier.PARAM_REASSIGNMENT]: ParameterReassignmentConfigType;
  [AntiPatternIdentifier.NESTED_TERNARY]: DeepNestingConfigType;
  [AntiPatternIdentifier.REDUNDANT_BOOLEAN_RETURN]: RedundantBooleanReturnConfigType;
  [AntiPatternIdentifier.NAMING_CONVENTION]: NamingConventionConfigType;
}

export interface AnalyzerConfig {
  autoChange: boolean;
  rules: {
    [K in AntiPatternIdentifier]: (K extends keyof AntiPatternExtendedConfiguration
      ? AntiPatternExtendedConfiguration[K]
      : {}) &
      BaseRuleConfig;
  };
}

export interface BuiltRule {
  check: (node: SyntaxNode) => vscode.Diagnostic | null;
}

export type RuleBuilder<T extends BaseRuleConfig = BaseRuleConfig> = (
  config: T
) => BuiltRule;
