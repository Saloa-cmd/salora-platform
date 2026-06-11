# Dashboard UI System

## Components

- `DashboardShell`
- `DashboardSidebar`
- `DashboardTopBar`
- `DashboardSection`
- `DashboardGrid`
- `DashboardCard`
- `KpiCard`
- `TrendCard`
- `AlertCard`
- `RuntimeStatusCard`

## Visual Direction

The UI follows the blueprint's dark luxury direction with SALORA-owned tokens:

- Obsidian page background.
- Glass cards with subtle borders and backdrop blur.
- Gold executive accents.
- Compact telemetry labels.
- Responsive metric grids.
- Accessible focus states inherited from global CSS.

## Layout Rules

- Desktop uses a persistent sidebar.
- Tablet and mobile use horizontal route navigation in the top bar.
- Cards are single-level surfaces; no nested card stacks.
- Charts use stable CSS bar layouts to avoid adding new dependencies in this wave.
- Loading, unauthorized, empty, and error states are visible and labeled.
