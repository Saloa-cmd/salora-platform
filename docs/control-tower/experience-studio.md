# Experience Studio

Experience Studio uses the actual `ExperienceRenderer`, `ExperiencePageV2` schema and five approved registry components. Its three-pane workspace contains a keyboard-accessible page tree and component library, a responsive canvas, and a contextual inspector.

Supported preview dimensions: 390 mobile, 768 tablet, 1180 desktop and 1440 wide. Preview controls use PR2 Dark/Light/System and AR RTL/EN LTR. Safe layout options are finite width, spacing, alignment and semantic surface values; there is no CSS, HTML, JSX or script input.

Operators can add approved components, select, show/hide, reorder with buttons, edit bilingual text, remove, undo/redo and save a draft. Drag/drop is not required and button reordering is the accessible alternative. Unsaved changes trigger a browser navigation warning.

The API accepts exactly `{action:"save", page: ExperiencePageV2, expectedVersion}` and rejects every non-DRAFT status. An atomic version compare-and-swap returns `409` for stale sessions instead of silently overwriting another operator. It uses `content:read`/`content:write`; the previous publish/rollback actions and `system:write` requirement are not present. AI may later propose a diff, but has no apply or publish authority in this PR.
