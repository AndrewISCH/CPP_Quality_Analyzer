const CASE_PATTERNS = {
  snake_case: { regex: /^[a-z][a-z0-9_]*$/, name: 'snake_case' },
  SCREAMING_SNAKE_CASE: {
    regex: /^[A-Z][A-Z0-9_]*$/,
    name: 'SCREAMING_SNAKE_CASE',
  },
  lowercase: { regex: /^[a-z][a-z0-9]*%/, name: 'lowercase' },
  camelCase: { regex: /^[a-z][a-zA-Z0-9]*$/, name: 'camelCase' },
  PascalCase: { regex: /^[A-Z][a-zA-Z0-9]*$/, name: 'PascalCase' },
  kPascalCase: { regex: /^k[A-Z][a-zA-Z0-9]*$/, name: 'kPascalCase' },
} as const;

export type CasePattern = (typeof CASE_PATTERNS)[keyof typeof CASE_PATTERNS];

export type NamingStyle = 'google' | 'llvm' | 'microsoft' | 'qt' | 'stl';

export type DeclarationNodeType =
  | 'declaration'
  | 'const_declaration'
  | 'function_definition'
  | 'class_specifier'
  | 'struct_specifier'
  | 'union_specifier'
  | 'namespace_definition'
  | 'enum_specifier';

type StyleRules = Record<DeclarationNodeType, CasePattern[]>;

export const NAMING_CONVENTIONS: Record<NamingStyle, StyleRules> = {
  google: {
    declaration: [CASE_PATTERNS.snake_case],
    const_declaration: [
      CASE_PATTERNS.kPascalCase,
      CASE_PATTERNS.SCREAMING_SNAKE_CASE,
    ],
    function_definition: [CASE_PATTERNS.PascalCase],
    class_specifier: [CASE_PATTERNS.PascalCase],
    struct_specifier: [CASE_PATTERNS.PascalCase],
    union_specifier: [CASE_PATTERNS.PascalCase],
    namespace_definition: [CASE_PATTERNS.snake_case],
    enum_specifier: [CASE_PATTERNS.PascalCase],
  },
  llvm: {
    declaration: [CASE_PATTERNS.PascalCase, CASE_PATTERNS.camelCase],
    const_declaration: [
      CASE_PATTERNS.PascalCase,
      CASE_PATTERNS.SCREAMING_SNAKE_CASE,
    ],
    function_definition: [CASE_PATTERNS.camelCase],
    class_specifier: [CASE_PATTERNS.PascalCase],
    struct_specifier: [CASE_PATTERNS.PascalCase],
    union_specifier: [CASE_PATTERNS.PascalCase],
    namespace_definition: [CASE_PATTERNS.snake_case],
    enum_specifier: [CASE_PATTERNS.PascalCase],
  },
  microsoft: {
    declaration: [CASE_PATTERNS.camelCase, CASE_PATTERNS.PascalCase],
    const_declaration: [
      CASE_PATTERNS.PascalCase,
      CASE_PATTERNS.SCREAMING_SNAKE_CASE,
    ],
    function_definition: [CASE_PATTERNS.PascalCase],
    class_specifier: [CASE_PATTERNS.PascalCase],
    struct_specifier: [CASE_PATTERNS.PascalCase],
    union_specifier: [CASE_PATTERNS.PascalCase],
    namespace_definition: [CASE_PATTERNS.PascalCase],
    enum_specifier: [CASE_PATTERNS.PascalCase],
  },
  qt: {
    declaration: [CASE_PATTERNS.camelCase],
    const_declaration: [CASE_PATTERNS.camelCase, CASE_PATTERNS.PascalCase],
    function_definition: [CASE_PATTERNS.camelCase],
    class_specifier: [CASE_PATTERNS.PascalCase],
    struct_specifier: [CASE_PATTERNS.PascalCase],
    union_specifier: [CASE_PATTERNS.PascalCase],
    namespace_definition: [CASE_PATTERNS.PascalCase, CASE_PATTERNS.snake_case],
    enum_specifier: [CASE_PATTERNS.PascalCase],
  },
  stl: {
    declaration: [CASE_PATTERNS.snake_case],
    const_declaration: [CASE_PATTERNS.snake_case],
    function_definition: [CASE_PATTERNS.snake_case],
    class_specifier: [CASE_PATTERNS.snake_case],
    struct_specifier: [CASE_PATTERNS.snake_case],
    union_specifier: [CASE_PATTERNS.snake_case],
    namespace_definition: [CASE_PATTERNS.snake_case],
    enum_specifier: [CASE_PATTERNS.snake_case],
  },
};

export const NODE_TYPE_TO_READABLE_NAME: Record<DeclarationNodeType, string> = {
  declaration: 'variable',
  const_declaration: 'constant',
  function_definition: 'function',
  class_specifier: 'class',
  struct_specifier: 'struct',
  union_specifier: 'union',
  namespace_definition: 'namespace',
  enum_specifier: 'enum',
};
