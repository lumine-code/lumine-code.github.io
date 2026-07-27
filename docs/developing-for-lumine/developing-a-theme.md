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
