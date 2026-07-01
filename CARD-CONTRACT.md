# Card Component Contract

## Canonical Sources

| Source | Role |
|---|---|
| `css/pages/index.css` | Homepage card styles (desktop + mobile) |
| `css/pages/category-shared.css` | Category page card styles (desktop + mobile) |
| `index.html` card markup | Canonical DOM structure |

## Rules

1. **Never redefine `.card` on another page.** No page-specific `.card {}` rule, inline `<style>`, or scoped override (`.grid .card`, `.brand-grid .card`, etc.).

2. **Never create page-specific hover behavior.** Hover is defined once in `index.css` and `category-shared.css`. No `.card:hover` outside these files.

3. **Never override card spacing unless required for layout.** No `!important` overrides on `.card-meta`, `.card-name`, `.card-sub`, `.card-extra`, `.card-media`, `.card-actions`.

4. **All media pages consume the same component.** Movies, animes, tvshows, games, books, music, sports, food, fashion, cars, travel, brands — all use the identical card DOM and styles.

5. **Functional changes affect every page.** If you change `.card` in `index.css` or `category-shared.css`, it applies globally. Test all card-bearing pages.

## Allowed Variants

These are the only permitted card-related extensions:

| Class | Purpose | Defined in |
|---|---|---|
| `.card-media.brand-cover` | White background for brand logos | `category-shared.css` |
| `.card-media.card-media--light` | Light background variant | `category-shared.css` |
| `.card.menu-open` | Disables hover transform when menu is open | `category-shared.css`, `index.css` |
| `.card-extra.placeholder` | Invisible placeholder for empty-state height | `category-shared.css` |

## Renamed Classes (No Collision)

These classes were renamed to avoid collision with `.card`:

| Old | New | Used by |
|---|---|---|
| `.card` (list/dashboard) | `.action-card` | `components.css`, detail pages |
| `.card-title` (list/dashboard) | `.action-card-title` | `components.css`, detail pages |
| `.card` (support form) | `.form-card` | `support.html`, `support-admin.html` |
| `.card` (onboarding wizard) | `.wizard-card` | `onboarding.html` |
| `.card-title` (profile) | `.profile-card-title` | `profile.css` |
| `.card-header` (profile) | `.profile-card-header` | `profile.css` |
| `.card-footer` (profile) | `.profile-card-footer` | `profile.css` |
| `.card-description` (profile) | `.profile-card-description` | `profile.css` |
| `.card-image` (profile) | `.profile-card-image` | `profile.css` |
| `.card-content` (profile) | `.profile-card-content` | `profile.css` |

## Card DOM Structure

```html
<article class="card" data-id="...">
  <div class="card-media">
    <img src="..." alt="..." loading="lazy">
  </div>
  <div class="card-meta">
    <span class="card-type"><i class="fa-solid fa-..."></i> Type</span>
    <div class="card-meta-top">
      <p class="card-name">Title</p>
      <div class="card-menu-wrap">
        <button class="card-menu-btn" type="button">...</button>
      </div>
    </div>
    <p class="card-sub">Subtitle</p>
    <p class="card-extra">Description</p>
  </div>
  <div class="card-actions">
    <button class="menu-btn">...</button>
  </div>
</article>
```

## Enforcement Checklist

Before merging any card-related change:

- [ ] No `.card {}` rule outside `index.css` or `category-shared.css`
- [ ] No `.card:hover` outside `index.css` or `category-shared.css`
- [ ] No `!important` on card sub-element selectors in page-specific CSS
- [ ] No inline `<style>` defining `.card` in any HTML file
- [ ] `category-shared.css` and `index.css` card rules are identical for shared properties
- [ ] Brand-cover variant uses `.card-media.brand-cover` (defined in `category-shared.css`)
- [ ] All card-bearing pages tested visually after changes
