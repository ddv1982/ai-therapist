# UI and Design System

- **Consistency**
  - Use the same font across all chat interface surfaces.
  - Hide scrollbars by default, ensuring content remains scrollable and accessible.

- **DatePicker Rules**
  - Selected days use the primary (blue) color.
  - “Today” shows a subtle ring when not selected.
  - Desktop popover allows `overflow: visible` to avoid scrollbars; mobile uses `overflow: auto`.

- **shadcn + Tailwind**
  - Follow shadcn-style tokens and accessible patterns.
  - Keep responsive popover sizing; avoid width hacks. Mobile: full width; desktop: popover controls width.

- **Stability & Motion**
  - Prevent button height “bounce”; lock measured heights during state transitions.
  - Remove unwanted shimmer effects on chat interactions; keep transitions subtle and consistent.

- **A11y**
  - Preserve visible focus rings; ensure ARIA roles/labels on interactive elements.
