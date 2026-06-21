import {
  isArray,
  isBoolean,
  isNumber,
  isPlainObject,
  isString,
} from '../../utility/type-guards';
import { AntiPatternIdentifier } from '../anti-pattern/identifier';
import { AnalyzerConfig } from './rules_builder';

export const DEFAULT_CONFIG: AnalyzerConfig = {
  fixOnSave: { rules: 'all' },
  ignore: [],
  rules: {
    longFunction: { enabled: true, maxLines: 50, level: 'warn' },
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
    duplicateCondition: { enabled: true, level: 'error' },
    redundantBooleanReturn: { enabled: true, level: 'error' },
    redundantBooleanTernary: { enabled: true, level: 'error' },
    namingConvention: { enabled: false, level: 'warn', style: 'google' },
  },
} as const;

const isOneOfLiterals = (literals: string[]) => {
  return (value: unknown) => isString(value) && literals.includes(value);
};

type ValidatorSchema = {
  [key: string]: ValidatorSchema | ((value: unknown) => boolean);
};

const isPredicate = (
  value: ValidatorSchema | ((value: unknown) => boolean)
): value is (value: unknown) => boolean => {
  return typeof value === 'function';
};

const SEVERITY_LEVELS = ['warn', 'info', 'error'];
const NAMING_CONVENTIONS = ['google', 'llvm', 'microsoft', 'qt', 'stl'];

const CONFIG_VALIDATOR: ValidatorSchema = {
  fixOnSave: {
    rules: (val: unknown) => val === 'all' || isArray('string')(val),
  },
  ignore: isArray('string'),
  rules: {
    longFunction: {
      enabled: isBoolean,
      maxLines: isNumber,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    magicNumbers: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    deepNesting: {
      enabled: isBoolean,
      maxDepth: isNumber,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    nestedTry: { enabled: isBoolean, level: isOneOfLiterals(SEVERITY_LEVELS) },
    exitCall: { enabled: isBoolean, level: isOneOfLiterals(SEVERITY_LEVELS) },
    emptyCatchBlock: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
      allowComments: isBoolean,
    },
    globalVariables: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
      ignoreNamespaces: isBoolean,
    },
    booleanComparison: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    tooManyParams: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
      maxParams: isNumber,
    },
    paramReassignment: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    nestedTernary: {
      enabled: isBoolean,
      maxDepth: isNumber,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    duplicateCondition: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    redundantBooleanReturn: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    redundantBooleanTernary: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
    },
    namingConvention: {
      enabled: isBoolean,
      level: isOneOfLiterals(SEVERITY_LEVELS),
      style: isOneOfLiterals(NAMING_CONVENTIONS),
    },
  },
};

export const validateConfig = (
  input: unknown,
  schema: ValidatorSchema = CONFIG_VALIDATOR
): Partial<AnalyzerConfig> => {
  if (!isPlainObject(input)) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, validator] of Object.entries(schema)) {
    const value = input[key];

    if (value === undefined) {
      continue;
    }

    if (isPredicate(validator)) {
      if (validator(value)) {
        result[key] = value;
      }
    } else {
      const nestedResult = validateConfig(value, validator);
      if (Object.keys(nestedResult).length > 0) {
        result[key] = nestedResult;
      }
    }
  }

  return result;
};

export const getRuleFromDefaultConfig = <T extends AntiPatternIdentifier>(
  identifier: T
): AnalyzerConfig['rules'][T] => {
  return DEFAULT_CONFIG.rules[identifier];
};
