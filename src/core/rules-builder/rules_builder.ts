import { AnalyzerConfig, BuiltRule, RuleBuilder } from './types';
import { DEFAULT_CONFIG } from './default_config';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { CONFIG_FILENAME } from '../../constants/constants';
import { AntiPatternIdentifier } from '../anti-pattern/identifier';
import { longFunctionBuilder } from '../anti-pattern/longFunction';
import { deepNestingBuilder } from '../anti-pattern/deepNesting';
import { magicNumbersBuilder } from '../anti-pattern/magicNumbers';
import { deepMerge } from '../../utility/object';
import { nestedTryBuilder } from '../anti-pattern/nestedTry';
import { exitCallBuilder } from '../anti-pattern/exitCall';
import { emptyCatchBlockBuilder } from '../anti-pattern/emptyCatchBlock';
import { globalVariablesBuilder } from '../anti-pattern/globalVariables';
import { booleanComparisonBuilder } from '../anti-pattern/booleanComparison';
import { tooManyParametersBuilder } from '../anti-pattern/tooManyParams';
import { parameterReassignmentBuilder } from '../anti-pattern/parameterReassignment';
import { nestedTernaryBuilder } from '../anti-pattern/nestedTernary';
import { redundantBooleanReturnBuilder } from '../anti-pattern/redundantBooleanReturn';
import { namingConventionBuilder } from '../anti-pattern/namingConvention';
import { redundantBooleanTernaryBuilder } from '../anti-pattern/redundantBooleanTernary';
import { duplicateConditionBuilder } from '../anti-pattern/duplicateCondition';

const NODE_TYPE_TO_APPLIED_RULES: Record<string, AntiPatternIdentifier[]> = {
  ['declaration']: [
    AntiPatternIdentifier.GLOBAL_VARIABLES,
    AntiPatternIdentifier.NAMING_CONVENTION,
  ],
  ['function_definition']: [
    AntiPatternIdentifier.LONG_FUNCTION_PATTERN,
    AntiPatternIdentifier.NAMING_CONVENTION,
  ],
  ['class_specifier']: [AntiPatternIdentifier.NAMING_CONVENTION],
  ['struct_specifier']: [AntiPatternIdentifier.NAMING_CONVENTION],
  ['union_specifier']: [AntiPatternIdentifier.NAMING_CONVENTION],
  ['namespace_definition']: [AntiPatternIdentifier.NAMING_CONVENTION],
  ['enum_specifier']: [AntiPatternIdentifier.NAMING_CONVENTION],
  ['if_statement']: [
    AntiPatternIdentifier.DEEP_NESTING,
    AntiPatternIdentifier.REDUNDANT_BOOLEAN_RETURN,
    AntiPatternIdentifier.DUPLICATE_CONDITION,
  ],
  ['for_statement']: [AntiPatternIdentifier.DEEP_NESTING],
  ['while_statement']: [AntiPatternIdentifier.DEEP_NESTING],
  ['switch_statement']: [AntiPatternIdentifier.DEEP_NESTING],
  ['number_literal']: [AntiPatternIdentifier.MAGIC_NUMBERS],
  ['try_statement']: [AntiPatternIdentifier.NESTED_TRY],
  ['call_expression']: [AntiPatternIdentifier.EXIT_CALL],
  ['catch_clause']: [AntiPatternIdentifier.EMPTY_CATCH_BLOCK],
  ['==']: [AntiPatternIdentifier.BOOLEAN_COMPARISON],
  ['!=']: [AntiPatternIdentifier.BOOLEAN_COMPARISON],
  ['parameter_list']: [AntiPatternIdentifier.TOO_MANY_PARAMS],
  ['assignment_expression']: [AntiPatternIdentifier.PARAM_REASSIGNMENT],
  ['update_expression']: [AntiPatternIdentifier.PARAM_REASSIGNMENT],
  ['conditional_expression']: [
    AntiPatternIdentifier.NESTED_TERNARY,
    AntiPatternIdentifier.REDUNDANT_BOOLEAN_TERNARY,
  ],
};

const RULE_BUILDERS: {
  [K in AntiPatternIdentifier]: RuleBuilder<AnalyzerConfig['rules'][K]>;
} = {
  [AntiPatternIdentifier.LONG_FUNCTION_PATTERN]: longFunctionBuilder,
  [AntiPatternIdentifier.DEEP_NESTING]: deepNestingBuilder,
  [AntiPatternIdentifier.MAGIC_NUMBERS]: magicNumbersBuilder,
  [AntiPatternIdentifier.NESTED_TRY]: nestedTryBuilder,
  [AntiPatternIdentifier.EXIT_CALL]: exitCallBuilder,
  [AntiPatternIdentifier.EMPTY_CATCH_BLOCK]: emptyCatchBlockBuilder,
  [AntiPatternIdentifier.GLOBAL_VARIABLES]: globalVariablesBuilder,
  [AntiPatternIdentifier.BOOLEAN_COMPARISON]: booleanComparisonBuilder,
  [AntiPatternIdentifier.TOO_MANY_PARAMS]: tooManyParametersBuilder,
  [AntiPatternIdentifier.PARAM_REASSIGNMENT]: parameterReassignmentBuilder,
  [AntiPatternIdentifier.NAMING_CONVENTION]: namingConventionBuilder,
  [AntiPatternIdentifier.NESTED_TERNARY]: nestedTernaryBuilder,
  [AntiPatternIdentifier.DUPLICATE_CONDITION]: duplicateConditionBuilder,
  [AntiPatternIdentifier.REDUNDANT_BOOLEAN_RETURN]:
    redundantBooleanReturnBuilder,
  [AntiPatternIdentifier.REDUNDANT_BOOLEAN_TERNARY]:
    redundantBooleanTernaryBuilder,
};

type OtherOptionsProperties = {
  [K in keyof Omit<AnalyzerConfig, 'rules'>]: AnalyzerConfig[K];
};

class RulesConfig {
  private rules: Record<string, BuiltRule[]> = {};
  private options: Partial<OtherOptionsProperties> = {};
  private configFilePath: string | null = null;

  constructor() {
    this.build();
  }

  public getRules(): Record<string, BuiltRule[]> {
    return this.rules;
  }

  public getOptions(): Partial<OtherOptionsProperties> {
    return this.options;
  }

  public async findConfigFile(): Promise<void> {
    const files = await vscode.workspace.findFiles(
      `**/${CONFIG_FILENAME}`,
      '**/node_modules/**',
      1
    );
    this.configFilePath = files[0]?.fsPath ?? null;
  }

  public build(): void {
    const config = this.loadConfig();
    const { rules, ...options } = config;
    this.rules = {};
    this.options = options;

    for (const [nodeType, ruleIds] of Object.entries(
      NODE_TYPE_TO_APPLIED_RULES
    )) {
      this.rules[nodeType] = ruleIds
        .filter((id) => rules[id]?.enabled !== false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((id) => RULE_BUILDERS[id](rules[id] as any));
    }
  }

  private loadConfig(): AnalyzerConfig {
    if (!this.configFilePath || !fs.existsSync(this.configFilePath)) {
      return DEFAULT_CONFIG;
    }

    try {
      const raw = fs.readFileSync(this.configFilePath, 'utf-8');
      const userConfig = JSON.parse(raw);
      return deepMerge(DEFAULT_CONFIG, userConfig);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
}

export const rulesConfig = new RulesConfig();
export { AnalyzerConfig };
