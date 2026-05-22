/**
 * Anthropic Claude 3.5 Sonnet Tool Specifications (Function Calling)
 * Declares the schema and parameters that Claude evaluates during analysis loops.
 */

export const codeAnalyzerTools = [
  {
    name: 'analyze_syntax',
    description:
      'Analyzes TypeScript/JavaScript code structure. Detects unbalanced brackets, missing semicolons, debugging statements (console.log), and missing function returns. Returns issue details with line numbers.',
    input_schema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: 'Source code snippet to analyze',
        },
        language: {
          type: 'string',
          enum: ['typescript', 'javascript'],
          description: 'Target programming language',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'detect_smells',
    description:
      'Detects code smells and anti-patterns: functions exceeding length thresholds (>30 lines), magic numbers, debugging statements, excessive nesting depth, and duplicate lines.',
    input_schema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: 'Source code snippet to analyze',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'calculate_score',
    description:
      'Calculates an objective code quality score (0-100) and letter grade (A-F) based on syntax issue counts, code smells, and lines of code.',
    input_schema: {
      type: 'object' as const,
      properties: {
        syntax_issues_count: {
          type: 'number',
          description: 'Total syntax issues detected',
        },
        smells_count: {
          type: 'number',
          description: 'Total code smells detected',
        },
        lines_of_code: {
          type: 'number',
          description: 'Total lines of code analyzed',
        },
      },
      required: ['syntax_issues_count', 'smells_count'],
    },
  },
];
