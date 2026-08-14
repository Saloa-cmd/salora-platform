# ADR 0023: Portable semantic UI tokens

## Context

SALORA serves Next.js, Expo and operator interfaces. Brand values were duplicated across config, Tailwind, CSS and local screens.

## Options

1. Keep platform-local values.
2. Add a runtime CSS-in-JS/theme dependency.
3. Maintain framework-neutral TypeScript tokens and platform adapters.

## Decision

Choose option 3. `@salora/ui` owns semantic, serialisable tokens. Web maps them to CSS custom properties and Mobile consumes the object. Concrete components remain platform-specific.

## Consequences

No runtime dependency or forced cross-platform renderer is added. CSS mapping is still explicit and must be contract-tested. Existing aliases remain during incremental adoption and can be removed in a later breaking cleanup.
