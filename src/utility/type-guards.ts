type PRIMITIVES = 'string' | 'number' | 'boolean';

export const isString = (arg: unknown): arg is string =>
  typeof arg === 'string';

export const isBoolean = (arg: unknown): arg is boolean =>
  typeof arg === 'boolean';

export const isNumber = (arg: unknown): arg is number =>
  typeof arg === 'number';

type PrimitiveTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

export const isArray = <T extends PRIMITIVES>(type: T) => {
  return (arg: unknown): arg is PrimitiveTypeMap[T][] => {
    return Array.isArray(arg) && arg.every((item) => typeof item === type);
  };
};

export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};
