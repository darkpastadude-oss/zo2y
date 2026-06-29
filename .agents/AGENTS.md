# Project Rules

Always keep these rules in mind before making changes.

Priority:
1. Refactor Guardian
2. Existing Components
3. CSS Architecture
4. Premium UI
5. UI Review

This project values consistency over novelty.
Never redesign working systems.
Fix only the requested problem.
Always verify desktop and mobile before finishing.

---

## Refactor Guardian
Never refactor unless explicitly requested.
Do not:
- rename files
- rename functions
- move components
- redesign architecture
- replace working systems

Only modify the smallest amount of code necessary.
Preserve:
- APIs
- routing
- data flow
- event listeners
- IDs
- CSS variables

---

## Existing Components First
Before creating HTML:
1. Search for an existing component.
2. If one exists: Reuse it.
3. Do not create duplicate layouts.
4. Extend existing components rather than inventing new ones.
5. Keep naming consistent.

---

## CSS Architecture
Before writing CSS:
- Search for an existing class first.
- Reuse components whenever possible.
- Never duplicate styles.
- Never use !important unless unavoidable.
- Use existing CSS variables.
- Do not inline styles.
- Prefer utility classes.
- Keep selectors shallow.
- Mobile-first styling.

---

## Premium UI
Design philosophy:
- Letterboxd
- Spotify
- Apple
- Steam

Rules:
- Less chrome.
- More whitespace.
- Minimal controls.
- Consistent typography.
- Consistent border radius.
- Consistent spacing.
- Buttons should not dominate content.
- Content is always the hero.

---

## UI Review
For every UI change:
- Check desktop and mobile.
- Maintain consistent spacing.
- Use an 8px spacing system.
- Verify alignment.
- Ensure visual hierarchy.
- Primary action should always be obvious.
- Avoid unnecessary borders.
- Prefer whitespace over decoration.
- Check empty states.
- Check responsive layouts.
- Avoid visual clutter.
