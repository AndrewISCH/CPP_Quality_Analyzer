export const deepMerge = <T extends Record<string, unknown>>(
  obj1: T,
  obj2: T
): T => {
  const result: Record<string, unknown> = { ...obj1 };

  for (const [key, value2] of Object.entries(obj2)) {
    const value1 = result[key];

    if (
      value1 !== null &&
      value2 !== null &&
      typeof value1 === 'object' &&
      typeof value2 === 'object' &&
      !Array.isArray(value1) &&
      !Array.isArray(value2)
    ) {
      result[key] = deepMerge(
        value1 as Record<string, unknown>,
        value2 as Record<string, unknown>
      );
    } else {
      result[key] = value2;
    }
  }

  return result as T;
};
