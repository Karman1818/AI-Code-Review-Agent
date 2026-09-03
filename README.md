# 🤖 AI Code Review Agent

> An autonomous code analysis agent powered by **NestJS** and **Anthropic Claude 3.5 Sonnet**, featuring agentic tool calling, heuristic static analysis, and an interactive dark-mode web IDE.

![NestJS](https://img.shields.io/badge/NestJS-v10-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Claude 3.5 Sonnet](https://img.shields.io/badge/Claude%203.5-Sonnet-D97706?style=flat-square&logo=anthropic&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)

---

## 📌 Overview

**AI Code Review Agent** is a full-stack, AI-driven code quality and security review system. It leverages Claude 3.5 Sonnet's **Tool Use (Function Calling)** capabilities within an autonomous agentic loop (up to 5 iterations). The agent inspects code snippets, dynamically executes static analysis tools, calculates quality scores, detects anti-patterns (code smells), and provides actionable refactoring recommendations.

If an Anthropic API key is not supplied, the application gracefully operates in **Local Fallback Mode**, evaluating code using built-in heuristic AST parsing tools without external network dependencies.

---

## ✨ Key Features

- 🤖 **Autonomous Agentic Loop**: Claude independently chooses which analysis tools to execute, processes raw tool results, and iteratively refactors its evaluation.
- 🛠️ **Built-in Static Analysis Tools**:
  - `analyze_syntax`: Identifies unbalanced brackets/parentheses, missing semicolons, stray `console.log` statements, and missing return statements.
  - `detect_smells`: Flags long functions (>30 lines), magic numbers, excessive indentation depth (>8 spaces), and duplicated code blocks.
  - `calculate_score`: Evaluates code quality on a 0–100 scale and assigns letter grades (**A** through **F**).
- 🔄 **Dual-Engine Execution**:
  - **Online Agent Mode**: Powered by Anthropic's Claude 3.5 Sonnet API with structured tool calling.
  - **Offline Local Mode**: Runs deterministic heuristic checks locally when running without an API key.
- 💻 **Interactive Web IDE**: A sleek, dark-themed (Dracula) frontend built with CodeMirror, featuring live execution visualization, tool chips, iteration badges, and full score reporting.
- 📊 **Historical Tracking**: In-memory analysis audit log tracking submission timestamps, lines of code, and assessment metrics.

---

## 🏗️ Architecture Flow

```
                      +-------------------+
                      |   Browser IDE     |
                      |   (CodeMirror)    |
                      +---------+---------+
                                |
                   POST /agent/analyze (JSON)
                                |
                                v
                     +---------------------+
                     |   AgentController   |
                     +----------+----------+
                                |
                                v
                     +---------------------+
                     |    AgentService     |
                     |   (Agentic Loop)    |
                     +----+-----------+----+
                          |           ^
        1. Tool Selection |           | 3. Tool Result Feedback
            & Arguments   v           |
                     +----+-----------+----+
                     |  Claude 3.5 API     |
                     |  (Tool Calling)     |
                     +----+-----------+----+
                          |           ^
       2. Request Tool    |           | 2b. JSON Result
          Execution       v           |
                     +----+-----------+----+
                     | ToolExecutorService |
                     | (Static Analysis)   |
                     +---------------------+
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- *(Optional)* **Anthropic API Key**: [Get your key from Anthropic Console](https://console.anthropic.com/)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Karman1818/AI-Agent-Zaawansowane-Webowe.git
cd AI-Agent-Zaawansowane-Webowe
npm install
```

### 3. Environment Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` to include your Anthropic API Key:

```env
PORT=3000
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

> **Note:** If `ANTHROPIC_API_KEY` is omitted or left as a placeholder, the app automatically runs in **Local Offline Mode**.

### 4. Running the Application

#### Development Mode (with hot-reload):
```bash
npm run start:dev
```

#### Production Build:
```bash
npm run build
npm run start
```

Access the Web UI at:  
👉 **`http://localhost:3000/index.html`** or **`http://localhost:3000`**

---

## 📡 API Endpoints

| Method | Endpoint | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/agent/ping` | Checks system health and Anthropic API connectivity status | N/A |
| `POST` | `/agent/analyze` | Executes full AI agent analysis loop on submitted code | `{ "code": "function test() { console.log(123) }" }` |
| `POST` | `/agent/tool/:name` | Tests an isolated static analysis tool directly | `{ "code": "const x = 42;" }` |
| `GET` | `/agent/history` | Fetches historical analysis logs recorded during session | N/A |

### Example API Response (`POST /agent/analyze`)

```json
{
  "score": 85,
  "grade": "B",
  "issues": [
    "Line 2: Found console.log in code"
  ],
  "smells": [
    "Magic number \"42\" at line 3 (medium)"
  ],
  "suggestion": "Remove console.log calls and replace magic numbers with named constants.",
  "toolsUsed": [
    "analyze_syntax",
    "detect_smells",
    "calculate_score"
  ],
  "iterations": 2
}
```

---

## 📂 Project Structure

```
AI-Agent-Zaawansowane-Webowe/
├── public/
│   └── index.html               # Frontend UI (CodeMirror IDE + Result Cards)
├── src/
│   ├── agent/
│   │   ├── dto/                 # Validation Data Transfer Objects
│   │   │   └── analyze-code.dto.ts
│   │   ├── tools/               # Tool Definitions & Execution Services
│   │   │   ├── code-analyzer.tools.ts    # Anthropic Tool Specs
│   │   │   └── tool-executor.service.ts  # Heuristic Static Parsers
│   │   ├── types/               # TypeScript Interfaces & Agent Types
│   │   │   └── agent-result.ts
│   │   ├── agent.controller.ts  # REST Endpoints
│   │   ├── agent.module.ts      # NestJS Agent Module Definition
│   │   └── agent.service.ts     # Core Agentic Loop & Fallback Engine
│   ├── app.module.ts            # Root NestJS Module
│   └── main.ts                  # NestJS Bootstrap File
├── .env.example                 # Example Environment Configuration
├── nest-cli.json                # NestJS CLI Configuration
├── tsconfig.json                # TypeScript Compiler Configuration
└── package.json                 # Project Dependencies & Scripts
```

---

## 🔬 Code Quality & Tools Overview

The agent executes three core static analysis functions:

1. **`analyze_syntax`**: Checks code structural integrity, bracket balance (`{ [ (`), line-end semicolon consistency, debugging outputs (`console.log`), and missing `return` statements in functions.
2. **`detect_smells`**: Scans for maintainability issues including function line limits (>30 lines), hardcoded magic numbers, excessive indentation depth (>8 spaces), and duplicate lines.
3. **`calculate_score`**: Synthesizes issue weights into an objective score (0–100) and grade (A, B, C, D, F).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/Karman1818/AI-Agent-Zaawansowane-Webowe/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout -b feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
