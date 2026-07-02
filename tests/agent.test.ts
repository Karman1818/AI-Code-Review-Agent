import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ToolExecutorService } from '../src/agent/tools/tool-executor.service.js';
import { AgentService } from '../src/agent/agent.service.js';

describe('AI Code Review Agent Test Suite', () => {
  const toolExecutor = new ToolExecutorService();

  describe('ToolExecutorService - Syntax Analysis', () => {
    it('1. should pass on clean, balanced code', () => {
      const code = `function add(a: number, b: number): number {\n  return a + b;\n}`;
      const res = toolExecutor.analyzeSyntax(code);
      assert.equal(res.issues.length, 0);
    });

    it('2. should flag unbalanced closing brackets', () => {
      const code = `function broken() {\n  return 1;\n}}`;
      const res = toolExecutor.analyzeSyntax(code);
      assert.ok(res.issues.some((i) => i.type === 'unbalanced_brackets'));
    });

    it('3. should flag unclosed opening brackets', () => {
      const code = `function unclosed() {\n  if (true) {\n    return 1;\n  }`;
      const res = toolExecutor.analyzeSyntax(code);
      assert.ok(res.issues.some((i) => i.type === 'unbalanced_brackets'));
    });

    it('4. should flag console.log debugging statements', () => {
      const code = `const x = 10;\nconsole.log(x);`;
      const res = toolExecutor.analyzeSyntax(code);
      assert.ok(res.issues.some((i) => i.type === 'console_log'));
    });
  });

  describe('ToolExecutorService - Code Smells', () => {
    it('5. should identify unextracted magic numbers', () => {
      const code = `const discount = price * 0.85;\nconst tax = total * 99;`;
      const res = toolExecutor.detectSmells(code);
      assert.ok(res.smells.some((s) => s.type === 'magic_number'));
    });

    it('6. should detect deep indentation nesting', () => {
      const code = `function deep() {\n          if (true) {\n            return 1;\n          }\n}`;
      const res = toolExecutor.detectSmells(code);
      assert.ok(res.smells.some((s) => s.type === 'deep_nesting'));
    });
  });

  describe('ToolExecutorService - Quality Scoring', () => {
    it('7. should assign Grade A (100) to clean code', () => {
      const res = toolExecutor.calculateScore(0, 0, 15);
      assert.equal(res.score, 100);
      assert.equal(res.grade, 'A');
    });

    it('8. should decrement score and assign lower grade when issues accumulate', () => {
      const res = toolExecutor.calculateScore(3, 4, 30);
      // 100 - (3 * 15) - (4 * 5) = 100 - 45 - 20 = 35 -> Grade F
      assert.equal(res.score, 35);
      assert.equal(res.grade, 'F');
    });
  });

  describe('AgentService - Local Fallback Execution', () => {
    const mockConfig = {
      get: (key: string) => undefined,
    } as any;

    const agentService = new AgentService(mockConfig, toolExecutor);

    it('9. should return valid AgentResult in local mode without Anthropic API key', async () => {
      const code = `function calculateTotal(items) {\n  let sum = 0;\n  for (let i = 0; i < items.length; i++) {\n    sum += items[i].price;\n  }\n  console.log(sum);\n  return sum;\n}`;
      const res = await agentService.analyze(code);

      assert.ok(typeof res.score === 'number');
      assert.ok(['A', 'B', 'C', 'D', 'F'].includes(res.grade));
      assert.ok(res.toolsUsed.includes('analyze_syntax'));
      assert.ok(res.toolsUsed.includes('detect_smells'));
      assert.ok(res.toolsUsed.includes('calculate_score'));
      assert.ok(res.suggestion.length > 0);
    });

    it('10. should report ping telemetry accurately', async () => {
      const ping = await agentService.ping();
      assert.equal(ping.status, 'ok');
      assert.equal(ping.apiResponse, 'LOCAL_MODE');
      assert.ok(ping.message.includes('Local'));
    });
  });
});
