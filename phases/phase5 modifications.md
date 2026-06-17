# Phase 5 Modifications

## Implemented Features

1. **View Filtering Utility**:
   - Created `src/utils/filter.ts` with the `filterCards` function. 
   - This keeps the Zustand store pure and computes the filtered lists at the view layer based on keyword search and priority (supporting 'all', 'low', 'medium', 'high').
   - **Edge Case Addressed (Gap 1)**: Keyword search accurately matches against *both* the card's `title` AND `description`, ensuring robust search functionality per UI requirements.

2. **Relative Timestamp Helper & Refresh Mechanism**:
   - Created `src/utils/time.ts` with the `getRelativeTime` function to format timestamps for the `ActivityLog` drawer dynamically (e.g., "Just now", "45s ago", "2m ago").
   - **Stale Timestamps Prevented (Gap 2)**: Created `src/hooks/useRelativeTimeRefresh.ts` which uses `setInterval` to trigger a re-render every 30 seconds. The `ActivityLog` component will consume this hook to keep relative timestamps live after their first render.

3. **Polish & Interaction Architecture**:
   - **Tab Identifiers**: The `ActivityEntry` type already correctly tracks `tabId` to help identify where actions originated. Truncation can be directly implemented in the UI layer.
   - **Micro-Animations & Overlays**: The design requirements for custom confirm overlays (Delete Card) and autofocus inputs (Add Card) have been reviewed. 

*Note: The actual integrations of these utilities (FilterBar, ActivityLog drawer interval hook, and EditPanel transitions) are ready to be wired in as soon as the respective Phase 1 React UI components are scaffolded and fully built out.*

## Additional UI Adjustments (Design 2 Refinements)

4. **Floating Navigation Header**:
   - Extracted global search and user actions from the Projects board div to the main grey viewport background above the board container.
   - Added a hamburger `Menu` icon next to the search input.
   - Set the global search input and profile card backgrounds to solid white to float beautifully.

5. **Projects Board Visual Overhaul**:
   - Re-aligned layout to 4 columns ("To Do", "In Progress", "In Review", "Done") per user directions.
   - Standardized column track backgrounds with very soft grey tracks (`bg-slate-50/70`) and placed a white circular `+` button next to each column title matching the design mockups.
   - Removed decorative header dots and card count badges from the column track headers to match the mockup's minimalism.
   - Increased the font size of the "Projects" main heading by 8px, from `text-3xl` (30px) to `text-[38px]`.
   - Increased the font size of the column headings by 8px, from `text-base` (16px) to `text-[24px]`.
   - Increased card text sizes: category badge text from `text-[10px]` to `text-[11px]`, main title/description from `text-xs` (12px) to `text-sm` (14px), and footer metrics from `text-[10px]` to `text-xs` (12px).
   - Added `category`, `progress`, and `attachmentsCount` to the canonical `Card` model.
   - Added a dynamic category styling helper to render custom colored pills on card cards (e.g. "Web Design", "App Development", "Mobile App", "Dashboard").
   - Added a `SlidersHorizontal` filter icon and a violet "Create Project" button to the right of the "Projects" heading in the board's header.
   - Fixed the main layout view to `h-screen overflow-hidden` to prevent overall page scroll, keeping the sidebar and header fixed to the screen while only the inner board horizontal track and vertical column tracks are scrollable.
   - Made the column restructuring/mapping logic in `Layout.tsx` reactively run on changes to the columns store state so that async hydration from `localStorage` does not drop the `In Review` column.
   - Restored the card click handler by mapping the `onEditCard` callback from the board card clicks through to `Layout.tsx` to mount the sliding `EditPanel` drawer.
   - Widened the column tracks from `w-80` to `w-[360px]` and reduced margins (`space-x-4`) and side padding (`px-6`) to occupy space more effectively and fit all 4 columns cleanly on a single screen.
   - Restructured column flex container to use `items-stretch` so all columns stretch to equal heights matching the tallest column.
   - Configured custom webkit scrollbar selectors in `index.css` to render all application/browser scrollbars as comparatively slim (6px) and colored purple (`#7c3aed`).
   - Added a small green live card counter badge (`bg-emerald-500`) next to column titles displaying "Count: <value>".
   - Added interactive column renaming: double-clicking a column title now triggers an inline edit input to save title updates to the store.
