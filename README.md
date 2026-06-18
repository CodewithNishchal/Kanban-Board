# Collaborative Kanban Board

A high-performance, local-first Kanban board application built to demonstrate real-time collaborative capabilities within the browser, without the need for a backend, database, or user accounts.

## ✨ Features

- **Multi-Tab Live Synchronization**: Open the board in multiple tabs or windows. Any action (moving a card, editing a title, adding a comment) is instantly reflected across all open tabs in real-time without the need for a backend server or WebSockets.
- **Drag and Drop Interface**: Smooth, animated drag-and-drop experience for moving cards between columns and reordering them, powered by `@dnd-kit`.
- **Persistent State**: The board's entire state (cards, columns, and activity history) is automatically persisted to `localStorage` and instantly restored upon reloading or late-joining tabs.
- **Robust Conflict Resolution**: Built-in mechanisms to handle simultaneous edits and network race conditions using a Last-Write-Wins (LWW) strategy.
- **Interactive Activity Log**: A global, collapsible sidebar that tracks and logs the last 20 actions across all active tabs.
- **Optimistic UI**: Interactions respond instantly. State changes are rendered locally before being broadcasted out, ensuring zero latency for the active user.

## 🏗️ Architecture

The application is built around a centralized, reactive state management pattern using **React**, **Zustand**, and the native browser **BroadcastChannel API**. 

### State Management (`Zustand`)
The single source of truth is the `useBoardStore`. To maintain $O(1)$ lookups and simple updates:
- Cards are stored in a flat dictionary (`Record<string, Card>`).
- Columns simply hold an array of ordered `cardIds`. 
- State is debounced and persisted locally using Zustand's `persist` middleware.

### Multi-Tab Synchronization & Echo Loop Prevention
The technical centerpiece of this application is its zero-backend, multi-tab sync system. It strictly enforces one-way data flows to prevent infinite sync loops (echo loops):

1. **Local Mutations (The Transmitter)**: When a user interacts with the UI, the component triggers a standard mutation (e.g., `moveCard`). The store updates the local state and then calls an injected `_broadcastAction` function to transmit the change over the `BroadcastChannel`.
2. **Tab Identification (The Filter)**: Every browser session generates a unique `TAB_ID` upon load. When the channel listener receives a message, it immediately drops any message originating from its own `TAB_ID`.
3. **Remote Application (The Silent Listener)**: When Tab B receives an event from Tab A, it passes the payload to `applyRemoteAction`. This specialized function acts as a massive switchboard that updates the Zustand store locally, but **structurally bypasses the `_broadcastAction` trigger**. Because it is silent, an incoming remote update can never trigger an outgoing broadcast, making an echo loop impossible.

### Dynamic Presence System
Late-joining tabs gracefully sync using a dedicated `kanban-presence` channel. Active tabs periodically exchange heartbeat (`PING` / `PONG`) messages. This allows the application to maintain an accurate count of active collaborators without polling a server.

## 🛠️ Getting Started

### Prerequisites
- Node.js installed (latest LTS recommended).

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/CodewithNishchal/Kanban-Board
2. Change Directory to Project Directory:
   ```bash
   cd Kanban-Board
3. Install dependencies:
   ```bash
   npm install
3. Start the development server:
   ```bash
   npm run dev
4. Open http://localhost:3000 in two side-by-side browser tabs to test the live synchronization.

## 🧠 Development Methodology: AI Divide & Conquer

This project was not generated using a straightforward, zero-shot AI prompt. Instead, it was built using a structured **Divide and Conquer** methodology, orchestrating multiple AI models to leverage their specific strengths while maintaining tight architectural control.

### Orchestration Breakdown

*   **Claude AI (Architecture & Complex Logic):** 
    Used strictly as a high-level architectural sounding board. I collaborated with Claude to design the optimized state synchronization system. Rather than settling for a basic browser ID check, we engineered a **3-way security architecture** (ID filtering, structural action isolation, and remote-bypass updates) to guarantee the prevention of BroadcastChannel echo-loops.
*   **Gemini (Project Management & Phasing):** 
    Used to structure the software development lifecycle. Gemini helped break the project down into **5 distinct development phases**, generating comprehensive `.md` files for each phase. This ensured the project maintained a clear roadmap and scope boundaries.
*   **AntiGravity IDE Agent (Implementation & Scaffolding):** 
    Used as an intelligent pair programmer to write boilerplate, structure the UI cards, and handle redundant layout tasks. 

### Enforcing Context & Mitigating Hallucination
To prevent AI hallucination and code drift during implementation, the phase-specific `.md` files generated by Gemini were fed directly to AntiGravity as strict context. Whenever the agent deviated from the architecture, the documentation was used to ground it. Furthermore, AntiGravity was instructed to treat the Phase 5 `.md` file as a "living document," dynamically editing it to document all real-time changes, ensuring the documentation always matched the codebase.

## ⚙️ Tech Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) / [useReducer](https://react.dev/reference/react/useReducer)
* **Drag-and-Drop**: [@dnd-kit/core](https://dndkit.com/)

  
