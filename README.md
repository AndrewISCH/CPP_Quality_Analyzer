# C++ Quality Analyzer

A Visual Studio Code extension that performs static analysis of C++ code to detect anti-patterns and code quality issues. Built on top of tree-sitter for efficient AST-based analysis with real-time feedback.

## Features

- Detection of 15 anti-patterns in C++ code
- Configurable rules via `.cppquality.json` file
- Support for multiple naming conventions (Google, LLVM, Microsoft, Qt, STL)
- Automatic fixes for selected anti-patterns
- Real-time analysis during typing

## Anti-patterns detected

### Structural

- Long Function
- Deep Nesting
- Too Many Parameters
- Deeply Nested Ternary
- Global Variables
- Parameter Reassignment
- Duplicate Condition

### Stylistic

- Magic Numbers
- Boolean Comparison
- Redundant Boolean Return
- Redundant Boolean Ternary
- Naming Convention

### C++ specific

- Nested Try
- Exit Call
- Empty Catch Block

## Configuration

Create a `.cppquality.json` file in your project root:

```json
{
  "rules": {
    "longFunction": {
      "enabled": true,
      "level": "warning",
      "maxLines": 30
    },
    "namingConvention": {
      "enabled": true,
      "style": "google"
    }
  }
}
```

## Requirements

- Visual Studio Code 1.85.0 or higher
- C++ source files (.cpp, .h, .hpp, .cc, .cxx)

## Release Notes

### 0.0.1

Initial prototype release with basic anti-pattern detection.
