import { isString } from '../../utility/type-guards';

export enum AntiPatternIdentifier {
  LONG_FUNCTION_PATTERN = 'longFunction',
  DEEP_NESTING = 'deepNesting',
  MAGIC_NUMBERS = 'magicNumbers',
  NESTED_TRY = 'nestedTry',
  EXIT_CALL = 'exitCall',
  EMPTY_CATCH_BLOCK = 'emptyCatchBlock',
  GLOBAL_VARIABLES = 'globalVariables',
  BOOLEAN_COMPARISON = 'booleanComparison',
  TOO_MANY_PARAMS = 'tooManyParams',
  PARAM_REASSIGNMENT = 'paramReassignment',
  NESTED_TERNARY = 'nestedTernary',
  REDUNDANT_BOOLEAN_RETURN = 'redundantBooleanReturn',
  NAMING_CONVENTION = 'namingConvention',
  REDUNDANT_BOOLEAN_TERNARY = 'redundantBooleanTernary',
  DUPLICATE_CONDITION = 'duplicateCondition',
}

export const isAntipatternIdentifier = (
  arg: unknown
): arg is AntiPatternIdentifier =>
  isString(arg) &&
  Object.values(AntiPatternIdentifier).includes(arg as AntiPatternIdentifier);
