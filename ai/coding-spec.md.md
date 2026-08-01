# Hazzeon Coding Specification

## Purpose

This document defines how code must be written across all Hazzeon projects: architecture, project structure, naming, state management, performance, testing, and maintainability.

It does not redefine UI, component, or visual rules — those live in `ui-spec.md`, `component-spec.md`, and `design-system/tokens/`. Where this document references props, variants, or styling, it governs *implementation syntax only*; the underlying rule is inherited, not restated.

---

## Source of Truth (do not duplicate, only reference)

```
Visual values     → design-system/tokens/
UI rules          → ui-spec.md
Component rules    → component-spec.md   (props shape, variants, states, a11y)
Coding standards   → this document        (syntax, architecture, tooling)
```

If this document appears to conflict with `component-spec.md` on anything about *what* a component must expose (props, variants, states), `component-spec.md` wins. This document only governs *how* that's implemented in code.

---

## Core Principles

Code must be readable, predictable, reusable, maintainable, scalable, type-safe, and production-ready. Code is written for humans first, machines second.

---

## Stack

Two separate layers. Do not conflate them.

**Frontend stack (fixed default, applies to every project):**
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form + Zod
- Framer Motion (only when motion is functionally justified, not decorative-by-default)

**Reference backend/infra (project-dependent — confirm before assuming):**
- Supabase is the default recommendation, not a hard requirement.
- If a project specifies a different backend (Firebase, custom API, headless CMS, etc.), the frontend rules above still apply unchanged; only data-fetching/auth implementation details adapt.

Do not introduce a different frontend stack unless the project explicitly requires it. Do not assume Supabase specifically without confirming — ask if the backend isn't already established in the project.

---

## Folder Structure

Organize by feature before file type.

```
app/
components/
features/
hooks/
lib/
services/
types/
schemas/
constants/
utils/
```

Never create ad hoc folders outside this structure without justification.

---

## Naming Convention

| Kind | Convention | Example |
|---|---|---|
| Components | PascalCase | `Button.tsx`, `DashboardCard.tsx` |
| Functions/variables | camelCase | `getUserData`, `isLoading` |
| Types/Enums | PascalCase | `UserRole`, `OrderStatus` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

Never use unclear names (`data2`, `buttonNew`, `test`, `temp`).

---

## Components (implementation level)

One responsibility per component file. Split when a component becomes hard to follow in one read. Prop *shape* rules (variants, boolean-vs-string, minimal surface) are defined in `component-spec.md` — this document only requires that the implementation actually match that shape (e.g. don't implement `variant` as a prop then secretly branch on five booleans internally).

---

## State Management

Choose the simplest solution first:

```
Local State → Context → Server State → Global State
```

Do not introduce global state unless local/context/server state is demonstrably insufficient.

---

## Data Fetching

Prefer Server Components by default. Use Client Components only when interaction requires it. Avoid unnecessary client-side fetching. Keep API/service functions separate from presentation components — never fetch directly inside a component that also renders UI, unless explicitly justified in a comment.

---

## Forms

React Hook Form + Zod. Validate on both client and server — client validation is UX, server validation is the actual guard.

---

## Error Handling

Never fail silently. Every async flow must account for: loading, error, retry, empty, offline — implemented, not just acknowledged.

---

## Performance

Optimize images, fonts, bundle size, re-renders, and lazy loading. Memoize only when there's a measured or clearly predictable benefit — do not optimize prematurely.

---

## Accessibility (implementation level)

Every interactive element must be keyboard-navigable, use semantic HTML, carry accessible labels, support screen readers, and meet WCAG AA contrast. (What a11y states a component must expose is defined in `component-spec.md`; this section governs that it's actually wired up correctly in code.)

---

## Security

Never trust client input. Validate and sanitize server-side regardless of client-side checks. Never expose secrets or API keys client-side.

---

## TypeScript

Strict mode enabled. Avoid `any`; prefer `unknown`, generics, explicit interfaces, and discriminated unions for variant-like state.

---

## Comments

Code should be self-explanatory. Comment *why*, not *what*. Avoid redundant comments that restate the code.

---

## Testing

Concrete toolchain, not aspirational:

- **Unit / component tests:** Vitest + React Testing Library
- **E2E / critical flows:** Playwright
- **Accessibility checks:** axe-core (automated) as a baseline, manual keyboard/screen-reader pass for anything non-trivial

Every reusable component needs at least a render + interaction test. Critical user flows (auth, checkout, booking, etc.) must have E2E coverage before release. Skipping tests requires an explicit note on why, not silent omission.

---

## Logging

Structured logging in production. Remove all `console.log()` before release — treat a leftover debug log as a lint failure, not a style nitpick.

---

## Dependencies

Before adding one, confirm: can existing code solve this reasonably? Is the package actively maintained? Does it meaningfully reduce complexity rather than just avoiding a few lines of code? Avoid dependency bloat.

---

## Git

Conventional, meaningful commit messages: `feat: add booking calendar`, `fix: resolve navbar overflow`, `refactor: simplify auth flow`. Reject vague messages like `update`, `fix`, `wip`.

---

## AI Code Generation Behavior

This section applies specifically because code here is AI-generated, not just human-written.

- **Scope discipline.** Never modify, delete, or reformat code outside the requested scope. If a broader refactor seems warranted, say so and ask — don't do it silently inside an unrelated task.
- **Diff-friendly output.** When editing an existing file, change only what's needed. Do not reformat or restyle an entire file because one function changed.
- **Flag assumptions.** Any guessed value — an API field name, an endpoint shape, a business rule not specified in the request — must be marked inline, e.g. `// TODO: confirm field name with backend`. Never present a guess as a confirmed fact.
- **No invented business logic.** If the request is ambiguous about behavior (what happens on error, what a status transition means, etc.), ask before implementing a guess.
- **Explicit incompleteness.** If a generated component/page/flow doesn't fully satisfy the Definition of Done, say exactly what's missing rather than presenting it as finished.
- **No dependency additions without flagging.** If generated code requires a new package, call it out explicitly rather than silently assuming it's installed.

---

## Anti-Patterns

Avoid: copy-paste code, deep prop drilling, massive components, nested ternaries, magic strings, hardcoded values, duplicated business logic, silent scope creep in AI-generated diffs.

---

## Decision Framework (before writing code)

1. Can this be reused?
2. Is there a simpler implementation?
3. Is this maintainable?
4. Is this type-safe?
5. Does this follow `component-spec.md` / `ui-spec.md` for anything UI-facing?
6. Does this improve developer experience?

If any answer is no, redesign before implementing.

---

### Architecture

Separate Presentation, Business Logic, Data Access, and Infrastructure.

Never mix business logic inside UI components.

---

### Server vs Client Components

Use Server Components by default for data loading, static rendering, secure server-only work, and non-interactive UI.

Use Client Components only when client-side interactivity is required, such as state, effects, browser APIs, event handlers, animations, or form interactions.

Keep Client Components as small as practical.

---

### Import Order

Use a consistent import order:

1. React and framework imports
2. Third-party libraries
3. Internal aliases
4. Relative imports
5. Types
6. Styles

Keep each group separated by a blank line.

---

### Configuration

Centralize environment variables through a config layer.

Avoid scattered `process.env` usage across the application.

Validate required environment variables at startup where possible.

---

### Error Boundaries

Use React Error Boundaries for fallback UI around page-level, route-level, and high-risk interactive areas.

Fallback UI should be clear, recoverable when possible, and consistent with the product experience.

---

### Engineering Review Checklist

- No `any`
- No `console.log`
- No dead code
- No unused imports
- Build passes
- Lint passes

---

## Definition of Done

Code-specific completion criteria only (UI/component completeness is defined in `component-spec.md` — do not re-check those here, just don't contradict them):

✓ Type-safe, strict mode passes
✓ No hardcoded visual values (defers to tokens)
✓ Follows folder/naming conventions
✓ No duplicated logic
✓ Tested per the Testing section above
✓ No leftover debug logging
✓ Passes linting
✓ Any assumptions/guesses flagged inline
✓ Scope of change matches what was requested
