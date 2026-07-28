# Developing a theme

A theme is a package that changes how Lumine looks. There are two kinds, and a package may provide either:

- **UI themes** style the interface — panels, tabs, the tree view, the status bar.
- **Syntax themes** style the code — the colors applied to your grammar's scopes.

## Anatomy of a theme

A theme is a package whose `package.json` declares its kind:

```json
{
  "name": "my-syntax",
  "version": "0.1.0",
  "theme": "syntax",
  "styles": ["index.css"],
  "engines": { "atom": "*" }
}
```

Set `"theme"` to `"ui"` or `"syntax"`. The stylesheets listed in `"styles"` (CSS, or Less if you prefer) provide the look; the bundled themes are plain CSS built on custom properties.

## Use custom properties

Lumine's theming is built on **CSS custom properties**. Define your palette as properties and consume them throughout, so the theme is consistent and easy to adjust:

```css
:root {
  --text-color: #e6e6e6;
  --background-color: #1b1f23;
}
```

The bundled **`one-theme`** package is the reference implementation: a single package that ships light and dark variants for both UI and syntax (**one-day-ui** / **one-night-ui** and **one-day-syntax** / **one-night-syntax**). Reading it is the best way to see how a complete theme is structured.

## Provide a family of themes

A package can expose several independently selectable themes through a `themes` array. This is useful when light and dark UI and syntax themes belong to one family:

```json
{
  "name": "my-theme-family",
  "version": "0.1.0",
  "themes": [
    {
      "name": "my-day-ui",
      "theme": "ui",
      "styles": ["styles/ui", "styles/day-ui"]
    },
    {
      "name": "my-day-syntax",
      "theme": "syntax",
      "styles": "styles/day-syntax"
    },
    {
      "name": "my-night-ui",
      "theme": "ui",
      "styles": ["styles/ui", "styles/night-ui"]
    },
    {
      "name": "my-night-syntax",
      "theme": "syntax",
      "styles": "styles/night-syntax"
    }
  ],
  "engines": { "atom": "*" }
}
```

Each entry becomes its own virtual theme package. Its `name` is what users select, `theme` is either `ui` or `syntax`, and `styles` is a package-relative directory or an ordered list of directories. The containing package still owns shared JavaScript and configuration, but those are not copied into its virtual themes.

## Extend another theme's styles

A theme in a `themes` array can build on styles from another package with `extends`. The value is either one package-qualified glob:

```json
{
  "name": "my-day-ui",
  "theme": "ui",
  "extends": "one-theme::styles/ui/*",
  "styles": ["styles/ui-overrides", "styles/day-ui"]
}
```

or an ordered list:

```json
{
  "name": "my-day-ui",
  "theme": "ui",
  "extends": [
    "one-theme::styles/ui/*",
    "my-theme-foundation::styles/accessibility/**/*.css"
  ],
  "styles": ["styles/ui-overrides", "styles/day-ui"]
}
```

The part before `::` is a package name. The part after it is a glob relative to that package. Scoped package names are valid because `::`, rather than `/`, separates the two parts.

Lumine builds the cascade in this order:

1. Process `extends` entries in their declared order.
2. Sort the `.css` and `.less` files matched by each glob and load them.
3. Load the theme's own `styles` directories in their declared order.

Overlapping globs do not load the same file twice. There is no filename replacement: extended and local stylesheets both load, so ordinary CSS specificity and source order determine the result. Keep only real differences in the local override sheets. When the parent sets a declaration that the child does not want, reset it explicitly in the child.

Referencing a package through `extends` does not activate that package's JavaScript or add its theme class. Only include reusable styles in the matched path; package-specific settings should live outside it.

If the chain contains more than one `variables.css`, Lumine applies them in the same order and uses that order when generating the Less compatibility shim. Put the derived theme's palette in its final `styles` directory so its custom properties win. Development live reload also watches the extended glob roots.

## Icon geometry belongs to the editor

Every icon in the interface — tree-view rows, tabs, lists, the status bar — renders in one frame, defined once by the editor's base stylesheet: a square of `--component-icon-size` whose `line-height` equals its height, aligned `vertical-align: text-bottom`. The box centers itself in any line, and each font's ink centers inside the box, so the same glyph sits at the same height in every surface without per-surface tuning.

A theme styles icons by **color and margin only**. Row metrics stay yours — set `line-height` on the row, the tab, the list item — and the icons follow. What a theme must never do is re-declare box geometry (`line-height`, `vertical-align`, `width`, `height`, `font-size`, `top`, `translate`) on an `.icon` `::before`: that pulls one surface out of the shared frame and re-splits icon alignment per surface. The bundled themes are checked mechanically (`npm run check:icons` in the editor repository fails on any such declaration).

To scale icons on one surface, scope the variable instead of restyling the pseudo-element — the box, the editor's octicons, and icon-package glyphs all follow it:

```css
.tab-bar {
  --component-icon-size: 14px;
}
```

A theme may repaint the window without the active themes changing — offering a variant as a setting, for example, and keying its stylesheets off an attribute on the document root. Switching themes cross-fades the window and tells packages that cache resolved colors to re-read them; a bare `setAttribute` does neither, so the new palette snaps in and anything painting to a canvas (the terminal, the minimap) keeps the old colors until something unrelated makes it redraw.

Apply those changes through `atom.themes.updateAppearance` instead, and they behave like a theme switch:

```js
atom.config.onDidChange("my-theme.variant", ({ newValue }) => {
  atom.themes.updateAppearance(() => {
    document.documentElement.setAttribute("ui-variant", newValue.toLowerCase());
  });
});
```

Only for changes that alter the palette. Settings that rearrange the window rather than recolor it are plain attribute writes.

## Developing live

Themes reload as you edit, especially with the bundled `dev-live-reload` package active in a development window. Link and run your theme the same way as any package:

```sh
lumine --link . --dev
lumine --dev .
```

For small visual changes you do not need a whole theme — a few rules in your `styles.css` may be enough. See [Style tweaks](../customizing-lumine/style-tweaks.md).
