export interface AgentIssue {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  line?: number;
}

export interface AgentResult {
  score: number;
  grade: string;
  issues: AgentIssue[];
  suggestion: string;
  rawResponse?: string;
  toolCalls: string[];
}

export interface Analysis extends AgentResult {
  id: string;
  createdAt: string;
  codePreview: string;
}
