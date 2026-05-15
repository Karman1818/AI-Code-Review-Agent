import { Injectable } from '@nestjs/common';

export interface SyntaxIssue {
  line?: number;
  type: string;
  description: string;
}

export interface CodeSmell {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ScoreResult {
  score: number;
  grade: string;
  summary: string;
}

@Injectable()
export class ToolExecutorService {

  execute(toolName: string, input: any): string {
    console.log(`\n🛠  Narzędzie: ${toolName}`, JSON.stringify(input, null, 2));

    try {
      switch (toolName) {
        case 'analyze_syntax':
          return JSON.stringify(this.analyzeSyntax(input.code, input.language));
        case 'detect_smells':
          return JSON.stringify(this.detectSmells(input.code));
        case 'calculate_score':
          return JSON.stringify(this.calculateScore(input.syntax_issues_count, input.smells_count, input.lines_of_code));
        default:
          return JSON.stringify({ error: `Nieznane narzędzie: ${toolName}` });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Nieznany błąd narzędzia';
      return JSON.stringify({ error: message });
    }
  }

  /**
   * MISJA 2: Uzupełnij tę metodę!
   * Wykryj problemy składniowe w kodzie.
   */
  private analyzeSyntax(code: string, language = 'typescript'): { issues: SyntaxIssue[]; linesOfCode: number } {
    const issues: SyntaxIssue[] = [];
    const lines = code.split('\n');

    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;

    lines.forEach((line, idx) => {
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;

        if (braceCount < 0 || parenCount < 0 || bracketCount < 0) {
          issues.push({
            line: idx + 1,
            type: 'unbalanced_brackets',
            description: 'Nawias zamykający pojawia się bez pasującego nawiasu otwierającego',
          });
          braceCount = Math.max(0, braceCount);
          parenCount = Math.max(0, parenCount);
          bracketCount = Math.max(0, bracketCount);
        }
      }

      const trimmed = line.trim();
      const shouldEndWithSemicolon =
        trimmed.length > 0 &&
        !trimmed.startsWith('//') &&
        !trimmed.endsWith(';') &&
        !trimmed.endsWith('{') &&
        !trimmed.endsWith('}') &&
        !trimmed.endsWith(',') &&
        /^(const|let|var|return|throw|await|[a-zA-Z_$][\w$]*\()/u.test(trimmed);

      if (shouldEndWithSemicolon) {
        issues.push({
          line: idx + 1,
          type: 'missing_semicolon',
          description: 'Możliwy brak średnika na końcu instrukcji',
        });
      }

      if (line.includes('console.log')) {
        issues.push({
          line: idx + 1,
          type: 'console_log',
          description: 'Znaleziono console.log w kodzie',
        });
      }
    });

    if (braceCount > 0) {
      issues.push({ type: 'unbalanced_brackets', description: `Brakuje ${braceCount} nawiasu/nawiasów }` });
    }
    if (parenCount > 0) {
      issues.push({ type: 'unbalanced_brackets', description: `Brakuje ${parenCount} nawiasu/nawiasów )` });
    }
    if (bracketCount > 0) {
      issues.push({ type: 'unbalanced_brackets', description: `Brakuje ${bracketCount} nawiasu/nawiasów ]` });
    }

    const functions = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g) ?? [];
    functions.forEach((fn, idx) => {
      if (!/\breturn\b/.test(fn)) {
        issues.push({
          type: 'missing_return',
          description: `Funkcja #${idx + 1} wygląda na funkcję obliczeniową, ale nie ma return`,
        });
      }
    });

    return { issues, linesOfCode: lines.length };
  }

  /**
   * MISJA 2: Uzupełnij tę metodę!
   * Wykryj "zapachy kodu".
   */
  private detectSmells(code: string): { smells: CodeSmell[] } {
    const smells: CodeSmell[] = [];
    const lines = code.split('\n');

    let functionStart: number | null = null;
    let braceDepth = 0;

    lines.forEach((line, idx) => {
      if (functionStart === null && /\bfunction\b|=>\s*\{/.test(line)) {
        functionStart = idx + 1;
      }

      braceDepth += (line.match(/\{/g) ?? []).length;
      braceDepth -= (line.match(/\}/g) ?? []).length;

      if (functionStart !== null && braceDepth <= 0) {
        const length = idx + 1 - functionStart + 1;
        if (length > 30) {
          smells.push({
            type: 'long_function',
            description: `Funkcja zaczynająca się w linii ${functionStart} ma ${length} linii`,
            severity: 'high',
          });
        }
        functionStart = null;
      }

      const numbers = line.match(/\b([2-9]\d*|1\d+)(?:\.\d+)?\b/g) ?? [];
      for (const number of numbers) {
        if (!['100', '200', '404', '500'].includes(number)) {
          smells.push({
            type: 'magic_number',
            description: `Magiczna liczba "${number}" w linii ${idx + 1}`,
            severity: 'medium',
          });
        }
      }

      if (line.includes('console.log')) {
        smells.push({
          type: 'debug_code',
          description: `Znaleziono console.log w linii ${idx + 1} — usuń przed wdrożeniem`,
          severity: 'medium',
        });
      }

      const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
      if (indent > 8) {
        smells.push({
          type: 'deep_nesting',
          description: `Linia ${idx + 1} ma zbyt głębokie zagnieżdżenie`,
          severity: 'medium',
        });
      }
    });

    const seen = new Map<string, number>();
    lines.forEach((line, idx) => {
      const normalized = line.trim();
      if (normalized.length < 8 || normalized === '{' || normalized === '}') return;

      const firstLine = seen.get(normalized);
      if (firstLine) {
        smells.push({
          type: 'duplicate_code',
          description: `Linia ${idx + 1} duplikuje kod z linii ${firstLine}`,
          severity: 'low',
        });
      } else {
        seen.set(normalized, idx + 1);
      }
    });

    return { smells };
  }

  /**
   * MISJA 2: Uzupełnij tę metodę!
   * Oblicz wynik i oceń kod.
   */
  private calculateScore(syntaxIssues: number, smells: number, linesOfCode = 20): ScoreResult {
    let score = 100;
    score -= (syntaxIssues || 0) * 15;
    score -= (smells || 0) * 5;
    if (linesOfCode > 80) score -= 5;
    score = Math.max(0, Math.min(100, score));

    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 45) grade = 'D';

    const summary =
      score >= 75
        ? `Wynik: ${score}/100 (${grade}). Kod jest w niezłej kondycji, ale warto dopracować wykryte drobiazgi.`
        : `Wynik: ${score}/100 (${grade}). Zacznij od błędów składniowych, debug logów i magicznych liczb.`;

    return { score, grade, summary };
  }
}
