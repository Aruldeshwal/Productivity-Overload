# Productive Overload

A private, local-first AI desktop productivity app that parses markdown learning plans and timetable, tracks daily progress in SQLite, runs local Ollama models against end-of-day reflections, and surfaces everything through a Tauri v2 + React dashboard with native desktop notifications.

## Features

- **Markdown Learning Plan Parsing** — Drop in `.md` files with checklists (`- [x]` / `- [ ]`), and the app automatically tracks completion percentages over time
- **Daily Review with AI Extraction** — Submit end-of-day reflections; Qwen2.5-Coder (7B) extracts structured data: procrastination severity, delayed tasks, and emotional triggers
- **Weekly CBT Coaching Reports** — DeepSeek-R1 (7B) generates weekly Cognitive Behavioral Therapy-style coaching reports with specific cognitive distortion identification and actionable exercises
- **Native Desktop Notifications** — Timetable-based reminders fire as native OS notifications based on your markdown schedule
- **Progress Dashboard** — Recharts-powered visualizations of learning progress and procrastination trends over time
- **Fully Offline & Private** — All data stays local. No cloud APIs, no telemetry, no external services. Your reflections never leave your device.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust backend + OS webview) |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite via `tauri-plugin-sql` |
| Charts | Recharts |
| LLM Runtime | Ollama (local) |
| Models | `qwen2.5-coder:7b` (structured extraction), `deepseek-r1:7b` (CBT reports) |
| Notifications | `@tauri-apps/plugin-notification` |

## Screenshots / Demo

> Screenshots will be added once the dashboard is complete.

## Architecture

The app follows a local-first architecture with a clear separation between deterministic processing (regex-based markdown parsing) and non-deterministic AI calls (LLM-powered reflection analysis).

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, data flow diagrams, and security model.

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Rust toolchain** (install via [rustup](https://rustup.rs/))
- **Ollama** installed and running ([ollama.com](https://ollama.com))
- Required Ollama models pulled locally

### Installation

```bash
# Clone the repository
git clone https://github.com/Aruldeshwal/Productivity-Overload.git
cd Productivity-Overload

# Install frontend dependencies
npm install

# Pull required Ollama models
ollama pull qwen2.5-coder:7b
ollama pull deepseek-r1:7b

# Run the app in development mode
npm run tauri dev
```

## Project Structure

```
productive-overload/
├── src-tauri/                  # Rust backend (Tauri v2)
│   ├── capabilities/           # ACL permission scopes
│   ├── src/                    # Rust source (plugin registration)
│   └── tauri.conf.json         # Tauri configuration
├── src/                        # React frontend
│   ├── components/             # UI components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── DashboardCharts.tsx
│   │   ├── DayReviewForm.tsx
│   │   ├── LearningPlanList.tsx
│   │   ├── TimetableReminders.tsx
│   │   └── WeeklyCBTReport.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useOllama.ts        # Ollama API client
│   │   ├── useScheduler.ts     # Background task scheduler
│   │   └── useSQLite.ts        # Database operations
│   ├── utils/                  # Utility functions
│   │   ├── mdParser.ts         # Markdown checklist parser
│   │   └── timeHelpers.ts      # Timetable parsing & time utilities
│   ├── App.tsx                 # Root application component
│   ├── index.css               # Tailwind + theme configuration
│   └── main.tsx                # React entry point
├── ARCHITECTURE.md             # System design documentation
├── CHANGELOG.md                # Version history
├── DECISIONS.md                # Architecture Decision Records
├── DIFFICULTIES.md             # Challenges encountered (interview prep)
├── LEARNINGS.md                # Skills and concepts gained
└── README.md                   # This file
```

## Roadmap / Future Improvements

- **Local Vector Embeddings + RAG** — Integrate a lightweight embedding model (e.g., `nomic-embed-text`) to build a local vector store over past reflections, enabling DeepSeek-R1 to cross-reference recurring roadblocks and patterns across weeks rather than analyzing each week in isolation
- **SQLCipher-Encrypted Storage** — Encrypt the SQLite database at rest using SQLCipher, since daily reviews contain genuinely sensitive personal reflections about failures, self-doubt, and emotional triggers
- **CalDAV Sync** — Mirror an external calendar app (Google Calendar, Outlook, etc.) via CalDAV protocol so the timetable can stay synchronized instead of living only in a local markdown file

## License

MIT
