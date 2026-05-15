/**
 * MISJA 2: Definicje narzędzi dla Claude API
 *
 * To są "deklaracje" — mówimy Claude JAKIE narzędzia ma do dyspozycji.
 * Implementacja logiki jest w tool-executor.service.ts
 */

export const codeAnalyzerTools = [
  {
    name: 'analyze_syntax',
    description:
      'Analizuje składnię kodu TypeScript/JavaScript. Wykrywa niezbalansowane nawiasy, brakujące średniki i podstawowe błędy składniowe. Zwraca listę problemów z numerami linii.',
    input_schema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: 'Kod źródłowy do analizy',
        },
        language: {
          type: 'string',
          enum: ['typescript', 'javascript'],
          description: 'Język programowania',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'detect_smells',
    description:
      'Wykrywa "zapachy kodu" (code smells): za długie funkcje, magiczne liczby, console.log w produkcji, zduplikowany kod, zbyt głębokie zagnieżdżenie. Zwraca listę zapachów z kategorią i opisem.',
    input_schema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: 'Kod źródłowy do analizy',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'calculate_score',
    description:
      'Oblicza końcowy wynik jakości kodu (0-100) na podstawie wyników analizy składni i zapachów kodu. Zwraca score, literową ocenę (A-F) i krótkie podsumowanie.',
    input_schema: {
      type: 'object' as const,
      properties: {
        syntax_issues_count: {
          type: 'number',
          description: 'Liczba problemów składniowych',
        },
        smells_count: {
          type: 'number',
          description: 'Liczba wykrytych zapachów kodu',
        },
        lines_of_code: {
          type: 'number',
          description: 'Liczba linii kodu',
        },
      },
      required: ['syntax_issues_count', 'smells_count'],
    },
  },
];
