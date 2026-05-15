# 🤖 AI Code Review Agent — NestJS + Claude

## Szybki start
```bash
cp .env.example .env
# wpisz swój ANTHROPIC_API_KEY w .env

npm install
npm run start:dev
```

Otwórz http://localhost:3000/index.html

Jeśli w `.env` zostawisz przykładowy placeholder klucza, aplikacja uruchomi się w trybie lokalnym i użyje tych samych narzędzi heurystycznych bez wywoływania Claude API.

## Endpointy
| Metoda | URL | Opis |
|--------|-----|------|
| GET | /agent/ping | Test połączenia z API |
| POST | /agent/analyze | Analizuje kod przez agenta |
| POST | /agent/tool/:name | Testuje pojedyncze narzędzie |
| GET | /agent/history | Historia analiz |

## Pliki do uzupełnienia (TODO)
1. `src/agent/tools/tool-executor.service.ts` — MISJA 2
2. `src/agent/agent.service.ts` — MISJA 3 (agentic loop)
3. `public/index.html` — MISJA 4 (funkcja analyze())

## Architektura
```
User → Frontend (CodeMirror)
         ↓ POST /agent/analyze
      AgentController
         ↓
      AgentService (agentic loop)
         ↓ messages[]
      Claude API (tool_use)
         ↓ tool calls
      ToolExecutorService
      (analyzeSyntax, detectSmells, calculateScore)
         ↓ tool_results
      Claude API (end_turn)
         ↓
      AgentResult → Frontend
```
