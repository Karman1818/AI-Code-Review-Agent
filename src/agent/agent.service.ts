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

  private readonly systemPrompt = `You are an expert Senior Code Reviewer and Software Architect.
Your role is to autonomously evaluate user-submitted code snippets for syntax correctness, architectural design, maintainability, and security.

ALWAYS leverage available analysis tools in this sequence:
1. analyze_syntax - check syntax integrity and bracket balance
2. detect_smells - flag anti-patterns, code smells, and complexity
3. calculate_score - synthesize findings into an objective score

After utilizing all tools, generate a CONCISE, ACTIONABLE summary (max 3 sentences).
Be specific and prioritize critical refactorings over generalities.`;

  constructor(
    private configService: ConfigService,
    private toolExecutor: ToolExecutorService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey && !apiKey.includes('YOUR_KEY') && !apiKey.includes('your-key') && !apiKey.includes('TWOJ_KLUCZ')) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async ping() {
    let apiResponse = 'LOCAL_MODE';

    if (this.anthropic) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Respond with one word only: ONLINE' }],
        });
        const textBlock = response.content.find((block) => block.type === 'text');
        apiResponse = textBlock?.text ?? 'ONLINE';
      } catch (e) {
        apiResponse = 'API_ERROR';
      }
    }

    return {
      status: 'ok',
      model: 'claude-3-5-sonnet-20241022',
      message: this.anthropic ? 'Agent online (Claude 3.5 Sonnet)' : 'Agent online (Local Fallback Mode)',
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

    const messages: Anthropic.Messages.MessageParam[] = [
      { role: 'user', content: `Please review the following code snippet:\n\n\`\`\`typescript\n${code}\n\`\`\`` },
    ];

    let finalText = 'Analysis complete.';

    for (let i = 0; i < 5; i++) {
      iterations++;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: this.systemPrompt,
        tools: codeAnalyzerTools as any,
        messages,
      });

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
    return this.history.map((h) => ({
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
      issues: syntax.issues.map((issue: any) =>
        issue.line ? `Line ${issue.line}: ${issue.description}` : issue.description,
      ),
      smells: smells.smells.map((smell: any) => `${smell.description} (${smell.severity})`),
      suggestion: suggestion || score.summary,
      toolsUsed: toolsUsed.length
        ? toolsUsed
        : ['analyze_syntax', 'detect_smells', 'calculate_score'],
      iterations,
    };
  }
}
