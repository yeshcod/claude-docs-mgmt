# UI Design System — {{PROJECT_NAME}}

## Core tokens

<!-- Fill in the authoritative values. These override any framework defaults. Examples:

### Border-radius
- Theme: `borderRadius: 0` (or whatever the spec is).
- Exception: `borderRadius: '50%'` for circles (avatars, status dots).

### Shadows
- Theme: `boxShadow: 'none'`.

### Spacing
- Base unit: 8px. Layout padding: 24px. Content area: 0 16px 24px.

### Colors
- Use CSS custom properties with fallbacks: `var(--color-success, #52c41a)`.
- Never hardcode hex for semantic meanings (success, error, warning).
-->

## Semantic colors

Use CSS custom properties / design tokens with fallbacks. Never hardcode hex for semantic meanings.

```css
color: var(--color-success, #52c41a);
color: var(--color-error, #ff4d4f);
color: var(--color-warning, #faad14);
```

## Iconography

<!-- Where icons ARE allowed (buttons, actionable elements) and where they're NOT (dividers, page headers, panel titles). -->

## No unsolicited form hints (RECOMMENDED RULE)

Do NOT add explanatory hint lines, `help={}` props, `<Alert>` banners, or tooltip explainers to forms unless explicitly requested in the PRD. Field labels + placeholders are the only textual guidance. Operational warnings ARE allowed; justification copy explaining design decisions is NOT.

## Enforcement

<!-- Hooks or agents that enforce the rules. Examples:
  - PostToolUse hook on frontend edits prints a design-system reminder.
  - Weekly audit runs a design-system-guard agent against the whole frontend.
-->
