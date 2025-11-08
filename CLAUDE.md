# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 classroom seat chart editor application built with Vite. It allows teachers to manage students, configure classroom layouts, and assign students to seats with various editing modes.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173 or next available port)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### State Management Pattern

This application uses Vue 3 Composition API with a **shared state composables** pattern (NOT Pinia or Vuex). State is shared across components through singleton composable modules:

**Key Composables:**
- `useStudentData()` - Student list, selection state, CRUD operations
- `useSeatChart()` - Seat grid data structure, seat assignments
- `useEditMode()` - Edit mode state machine (normal/swap/clear/empty_edit)
- `useTagData()` - Student tag management
- `useSidebar()` - Sidebar tab state

**Critical Pattern**: Composables export reactive refs at module scope, making them singletons:
```javascript
// Module-level state (shared across all component instances)
const students = ref([])
const selectedStudentId = ref(null)

export function useStudentData() {
  // Functions and computed values
  return { students, selectedStudentId, ... }
}
```

### Data Flow Architecture

```
User Interaction → Component Event Handler → Composable Function → Reactive State Update → UI Re-render
```

**Example flow for assigning a student to a seat:**
1. Click student in StudentItem → `selectStudent(id)` → `selectedStudentId.value = id`
2. Click seat in SeatItem → `handleAssignStudent` → `assignStudent(seatId, studentId)`
3. Updates `seats.value` array → SeatChart re-renders with new assignment

### Seat Data Structure

Seats are organized as a **flat array** internally but rendered in a **3-level hierarchy**:

```javascript
// Internal storage (useSeatChart.js)
seats = [
  { id: 'seat-0-0-0', groupIndex: 0, columnIndex: 0, rowIndex: 0, studentId: 1, isEmpty: false },
  { id: 'seat-0-0-1', groupIndex: 0, columnIndex: 0, rowIndex: 1, studentId: null, isEmpty: false },
  // ...
]

// Rendered organization (computed: organizedSeats)
groups[groupIndex][columnIndex][seats by rowIndex]
```

This design enables efficient iteration and lookups while maintaining clean rendering logic.

### Edit Mode State Machine

The application has 4 edit modes managed by `useEditMode()`:

1. **NORMAL** - Click student → click seat to assign
2. **SWAP** - Click seat 1 → click seat 2 to swap students
3. **CLEAR** - Click seat to remove student
4. **EMPTY_EDIT** - Click seat to toggle empty/available (diagonal stripes)

Mode is global state affecting all SeatItem click handlers. Buttons in SidebarPanel toggle modes with visual feedback (`.active` class).

### Component Structure

```
App.vue (main layout)
├── AppHeader.vue (title bar)
├── EditorPanel.vue (80% width)
│   ├── SeatChart.vue (top 60%)
│   │   └── SeatItem.vue (individual seats)
│   └── StudentList.vue (bottom 40%)
│       ├── TagManager.vue
│       └── StudentItem.vue (individual students)
└── SidebarPanel.vue (20% width)
    └── Tab content (config, edit modes, etc.)
```

**Layout constraint in App.vue**:
```css
/* DO NOT MODIFY - intentional height constraint */
min-height: calc(100vh - 100px);
max-height: calc(100vh - 100px);
```

### Student Selection & Assignment Flow

1. User clicks StudentItem → `selectStudent(id)` sets `selectedStudentId.value`
2. StudentItem gets `.selected` class (blue gradient background)
3. User clicks SeatItem → checks if seat is not empty
4. If student already assigned elsewhere, previous seat is cleared
5. New seat gets `studentId`, `selectedStudentId` is cleared
6. UI updates reactively through computed properties

## Important Implementation Details

### Student Number Sorting

Students are sorted with a specific logic in `useStudentData.js`:
- Empty student numbers appear FIRST
- Then sorted by student number ascending
- This is implemented in the `sortedStudents` computed property

### Empty Student Deletion

When reducing student count via the count input:
- Only delete students with NO name, NO student number, AND NO tags
- If insufficient empty students exist, show error (red border on input)
- Input shows `isCountError` state

### Emoji Usage

Emojis are intentionally REMOVED from this codebase. Do not add emoji icons to buttons or labels.

### Tag Color Palette

Default tags (住宿, 午休, 晚修) are defined in `src/constants/tagColors.js`. The color palette has 12 preset colors for tag selection.

### Click Event Handling in StudentItem

The component has multiple clickable areas (name edit, number edit, tag buttons, delete button). The main click handler (`handleSelectStudent`) must check `event.target` to avoid conflicts:

```javascript
if (target.closest('button') || target.tagName === 'INPUT') {
  return // Don't trigger selection
}
```

###座位表配置应用行为

When applying new seat configuration in SidebarPanel:
- Shows confirmation dialog (will clear all seat assignments)
- Calls `updateConfig()` then `clearAllSeats()`
- Re-initializes seat grid with new dimensions

## File Naming & Organization

- Components: PascalCase with `.vue` extension
- Composables: camelCase with `use` prefix (e.g., `useStudentData.js`)
- Constants: camelCase files (e.g., `tagColors.js`)
- Layout components: `src/components/layout/`
- Feature components: `src/components/student/`, `src/components/seat/`

## Styling

Primary brand color: `#23587b` (defined in App.vue comment)

Common patterns:
- Gradients for primary actions: `linear-gradient(135deg, #23587b 0%, #2d6a94 100%)`
- Box shadows for depth: `0 2px 4px rgba(0, 0, 0, 0.08)`
- Border radius: 6-12px for consistency
- Transitions: `all 0.2s ease` for hover effects

## Node Version

Requires Node.js `^20.19.0 || >=22.12.0` (see package.json engines field)
