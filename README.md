# C++ Quality Analyzer

A Visual Studio Code extension that performs static analysis of C++ code to detect anti-patterns and code quality issues. Built on top of tree-sitter for efficient AST-based analysis with real-time feedback.

## Features

- Detection of 15 anti-patterns in C++ code
- Configurable rules via `.cppquality.json` file
- Support for multiple naming conventions (Google, LLVM, Microsoft, Qt, STL)
- File ignore patterns via glob expressions
- Quick Fix actions for particular anti-patterns
- Optional automatic fixes on save
- Incremental parsing for efficient analysis of large files
- Real-time analysis during typing

## Anti-patterns detected

### Structural

- Long Function — functions exceeding configured line count
- Deep Nesting — excessively nested control flow statements
- Too Many Parameters — functions with too many required parameters
- Deeply Nested Ternary — chained ternary operators beyond configured depth
- Global Variables — non-const global mutable state
- Parameter Reassignment — modification of by-value parameters inside function body
- Duplicate Condition — repeated conditions in if-else if chains
- Magic Numbers — numeric literals without named constants
- Boolean Comparison — redundant comparison with `true` / `false`
- Redundant Boolean Return — `if-else` returning boolean literals
- Redundant Boolean Ternary — `cond ? true : false` patterns
- Naming Convention — identifier names not matching chosen style guide
- Nested Try — nested try-catch blocks
- Exit Call — usage of `exit()`, `abort()`, `_Exit()`, `quick_exit()`
- Empty Catch Block — silent exception handling

## Quick Fix actions

Three rules support automatic code transformations through the Quick Fix menu (`Ctrl+.`):

- Boolean Comparison
- Redundant Boolean Return
- Redundant Boolean Ternary

## Configuration

Create a `.cppquality.json` file in your project root (or anywhere within the workspace):

\`\`\`json
{
"ignore": ["**/build/**", "**/third_party/**", "*.generated.cpp"],
"fixOnSave": {
"enabled": true,
"rules": ["booleanComparison", "redundantBooleanReturn"]
},
"rules": {
"longFunction": {
"enabled": true,
"level": "warn",
"maxLines": 30
},
"deepNesting": {
"enabled": true,
"level": "warn",
"maxDepth": 4
},
"namingConvention": {
"enabled": true,
"level": "warn",
"style": "google"
},
"magicNumbers": {
"enabled": false
}
}
}
\`\`\`

### Configuration options

- **ignore** — array of glob patterns for files to exclude from analysis.
- **fixOnSave** — controls automatic fix application on save. Requires VS Code `editor.codeActionsOnSave` to be enabled (see below). The `rules` field is optional; when omitted, all supported auto-fixable rules will run.
- **rules** — per-rule configuration. Each rule supports `enabled` (boolean) and `level` (`"warn"`, `"info"`, `"error"`). Some rules have additional options (`maxLines`, `maxDepth`, `style`, etc).

### Enabling fixes on save

To enable automatic fix application on save, add the following to your VS Code `settings.json`:

\`\`\`json
{
"editor.codeActionsOnSave": {
"source.fixAll.cppaquality": "explicit"
}
}
\`\`\`

Use `"explicit"` to apply fixes only on manual save (`Ctrl+S`), or `"always"` to apply on any save event including autosave.

### Supported naming styles

`namingConvention` rule supports five popular style guides:

- `google` — snake_case variables, PascalCase functions/types, kPascalCase constants
- `llvm` — PascalCase variables, camelCase functions, SCREAMING_SNAKE_CASE constants
- `microsoft` — camelCase variables, PascalCase functions/types, SCREAMING_SNAKE_CASE constants
- `qt` — camelCase variables/functions, PascalCase types
- `stl` — snake_case everywhere

## Requirements

- Visual Studio Code 1.85.0 or higher
- C++ source files (`.cpp`, `.cxx`, `.cc`, `.c++`, `.hpp`, `.hxx`, `.h++`, `.h`)

## Release Notes

### 1.0.0

- Added incremental parsing with tree caching for improved performance
- Added file ignore patterns via `ignore` config field
- Added Quick Fix actions for Boolean Comparison, Redundant Boolean Return, Redundant Boolean Ternary
- Added optional automatic fixes on save via `fixOnSave` config
- Added Duplicate Condition detection
- Added Redundant Boolean Ternary detection

### 0.0.2

- Refactoring and small fixes

### 0.0.1

- Initial prototype release with basic anti-pattern detection
