import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { codeAnalyzerTools } from './tools/code-analyzer.tools';
import { ToolExecutorService } from './tools/tool-executor.service';

export interface AgentResult {
  score: number;
  grade: string;
  issues: string[];
  smells: string[];
  suggestion: string;
  toolsUsed: string[];
  iterations: number;
}

@Injectable()
export class AgentService {
  private anthropic?: Anthropic;
  private history: { code: string; result: AgentResult; timestamp: Date }[] = [];

  private readonly systemPrompt = `Jesteś doświadczonym code reviewer. 
Twoim zadaniem jest przeanalizowanie kodu przekazanego przez użytkownika.

ZAWSZE używaj dostępnych narzędzi w tej kolejności:
1. analyze_syntax — sprawdź składnię i błędy
2. detect_smells — wykryj zapachy kodu  
3. calculate_score — oblicz końcową ocenę

Po użyciu wszystkich narzędzi napisz ZWIĘZŁE podsumowanie po polsku (max 3 zdania).
Bądź konkretny — podaj co naprawić, nie ogólniki.`;

  constructor(
    private configService: ConfigService,
    private toolExecutor: ToolExecutorService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey && !apiKey.includes('TWOJ_KLUCZ') && !apiKey.includes('your-key')) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async ping() {
    let apiResponse = 'LOCAL_MODE';

    if (this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Odpowiedz tylko słowem: ONLINE' }],
      });
      const textBlock = response.content.find((block) => block.type === 'text');
      apiResponse = textBlock?.text ?? 'ONLINE';
    }

    return {
      status: 'ok',
      model: 'claude-3-5-sonnet-20241022',
      message: this.anthropic ? 'Agent online' : 'Agent online (tryb lokalny)',
      apiResponse,
    };
  }

  async analyze(code: string): Promise<AgentResult> {
    if (!this.anthropic) {
      const result = this.runLocalTools(code, [], 0);
      this.history.push({ code, result, timestamp: new Date() });
      return result;
    }

    const toolsUsed: string[] = [];
    let iterations = 0;

    // Inicjalizacja wiadomości
    const messages: Anthropic.Messages.MessageParam[] = [
      { role: 'user', content: `Przeanalizuj poniższy kod:\n\n\`\`\`typescript\n${code}\n\`\`\`` },
    ];

    /**
     * MISJA 3: Zaimplementuj pętlę agenta (agentic loop)
     *
     * Algorytm:
     * 1. Wyślij messages do Claude z tools
     * 2. Jeśli stop_reason === 'end_turn' → wyjdź z pętli, mamy odpowiedź
     * 3. Jeśli stop_reason === 'tool_use':
     *    a. Znajdź bloki type === 'tool_use' w response.content
     *    b. Wywołaj this.toolExecutor.execute(tool.name, tool.input)
     *    c. Dodaj odpowiedź asystenta do messages
     *    d. Dodaj tool_result do messages
     *    e. Wróć do punktu 1
     * 4. Powtarzaj maksymalnie 5 razy
     */

    let finalText = 'Analiza zakończona.';

    for (let i = 0; i < 5; i++) {
      iterations++;
      console.log(`\n🔄 Iteracja agenta: ${i + 1}`);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: this.systemPrompt,
        tools: codeAnalyzerTools as any,
        messages,
      });

      console.log(`   stop_reason: ${response.stop_reason}`);

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find((block) => block.type === 'text');
        finalText = textBlock?.text || finalText;
        break;
      }

      if (response.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: response.content });

        const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            toolsUsed.push(block.name);
            const result = this.toolExecutor.execute(block.name, {
              code,
              ...(block.input as object),
            });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        messages.push({ role: 'user', content: toolResults });
      }
    }

    const result = this.runLocalTools(code, toolsUsed, iterations, finalText);

    this.history.push({ code, result, timestamp: new Date() });
    return result;
  }

  testTool(name: string, code: string) {
    return JSON.parse(this.toolExecutor.execute(name, { code }));
  }

  getHistory() {
    return this.history.map(h => ({
      timestamp: h.timestamp,
      linesOfCode: h.code.split('\n').length,
      result: h.result,
    }));
  }

  private runLocalTools(
    code: string,
    toolsUsed: string[] = [],
    iterations = 0,
    suggestion?: string,
  ): AgentResult {
    const syntax = JSON.parse(this.toolExecutor.execute('analyze_syntax', { code }));
    const smells = JSON.parse(this.toolExecutor.execute('detect_smells', { code }));
    const score = JSON.parse(
      this.toolExecutor.execute('calculate_score', {
        syntax_issues_count: syntax.issues.length,
        smells_count: smells.smells.length,
        lines_of_code: syntax.linesOfCode,
      }),
    );

    return {
      score: score.score,
      grade: score.grade,
      issues: syntax.issues.map((issue) =>
        issue.line ? `Linia ${issue.line}: ${issue.description}` : issue.description,
      ),
      smells: smells.smells.map((smell) => `${smell.description} (${smell.severity})`),
      suggestion: suggestion || score.summary,
      toolsUsed: toolsUsed.length
        ? toolsUsed
        : ['analyze_syntax', 'detect_smells', 'calculate_score'],
      iterations,
    };
  }
}
