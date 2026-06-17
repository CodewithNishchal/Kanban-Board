# Collaborative Kanban Board

A high-performance, local-first Kanban board application built to demonstrate real-time collaborative capabilities within the browser, without the need for a backend, database, or user accounts.

## 🚀 Features

* **Visual Workflow**
    * Manage tasks through a column-based system: `To Do`, `In Progress`, `In Review`, `Done`.
* **Real-time Collaboration**
    * Utilizes the `BroadcastChannel` API for instant multi-tab synchronization.
    * Actions performed in one browser tab—such as moving a card, editing details, or renaming a column—are synchronized instantly across all other open tabs without a backend or WebSockets.
* **Persistence**
    * State is automatically saved to `localStorage` (debounced by 250ms) to ensure data survives page refreshes.
* **Interactive Design**
    * Features drag-and-drop reordering with a visible drop indicator.
    * Inline card editing via a persistent side panel (no modals).
    * Live activity log tracking the last 20 actions with relative timestamps.
* **Custom Confirmations**
    * Inline deletion flow to ensure data safety without using browser-native `confirm()` alerts.
* **Live Monitoring**
    * Includes a live tab count indicator and a periodic activity log refresh (60s) to keep relative timestamps accurate.

## 🏗️ Architecture: BroadcastChannel & Sync Logic

This project uses the `BroadcastChannel` API to coordinate state across multiple tabs on the same origin.

### Echo-Loop Prevention
To prevent infinite update loops where a tab receives its own broadcast, every `BroadcastMessage` includes a unique `originTabId`. When a tab receives an event, it verifies this ID against its own; if it matches, the event is ignored, ensuring redundant processing is avoided.

## 🛠️ Getting Started

### Prerequisites
- Node.js installed (latest LTS recommended).

### Setup
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
2. Install dependencies:
   ```bash
   npm install
3. Start the development server:
   ```bash
   npm run dev
4. Open http://localhost:3000 in two side-by-side browser tabs to test the live synchronization.


## ⚙️ Tech Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) / [useReducer](https://react.dev/reference/react/useReducer)
* **Drag-and-Drop**: [@dnd-kit/core](https://dndkit.com/)

  
