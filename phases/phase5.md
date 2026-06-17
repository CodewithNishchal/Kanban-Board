# Phase 5: Search, Filter, Log & UI Polish

## 🎯 Objectives
* Implement the FilterBar UI and tie it to search keywords and priority parameters.
* Integrate the collapsible right Activity Log drawer displaying the last 20 actions with relative timestamps (e.g. "2 minutes ago").
* Add visual micro-animations (transitions on hover, card creation expansions, slide-in sidebar overlays).
* Run side-by-side tab test scenarios to verify synchronization speed, echo prevention, and persistence.

---

## 💻 Technical Checklist

### 1. View Filtering (Keyword & Priority)
Do not store filtered card lists in the Zustand store. Compute them at the view layer:

```typescript
const searchNormalized = searchQuery.toLowerCase().trim();
const filteredCardIds = column.cardIds.filter(id => {
  const card = cards[id];
  if (!card) return false;
  
  const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
  const matchesKeyword = searchNormalized === '' ||
    card.title.toLowerCase().includes(searchNormalized) ||
    card.description.toLowerCase().includes(searchNormalized);
    
  return matchesPriority && matchesKeyword;
});
```

### 2. Relative Timestamp Helper
To keep timestamps in the activity log looking clean, use a small helper function in `src/utils/time.ts`:

```typescript
export function getRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}
```
*Tip: Set up a small interval in the `ActivityLog` component to trigger a force-rerender every 15 seconds to update relative logs text automatically.*

### 3. Polish & Interaction Touches
* **Custom Confirm Overlay**: In `EditPanel.tsx`, click "Delete Card" to render an inline question `"Delete card permanently? [Yes] [No]"` inline, using CSS fade-in transitions.
* **Add Card Form**: Focus the text field immediately on `Add Card` click. Support pressing `Enter` to submit and `Escape` to discard.
* **Tab Identifiers in Logs**: Log entries should note the initiating tab's truncated ID (e.g., `Tab #28a1`) so the user can easily trace which actions originated from other tabs.

---

## 🧪 Side-by-Side Test Walkthrough
Once everything is built, verify these testing parameters:
1. Open two browser windows side-by-side.
2. Drag card in Tab A; verify it appears in Tab B within 50ms.
3. Edit title in Tab B; verify it updates in Tab A immediately.
4. Open Tab C (late-joining tab); verify it starts in the identical state matching the latest `localStorage` write.
5. Close Tab C; verify Tab A and B's connected counters decrement instantly.
