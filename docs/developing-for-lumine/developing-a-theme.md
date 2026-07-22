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

## Developing live

Themes reload as you edit, especially with the bundled `dev-live-reload` package active in a development window. Link and run your theme the same way as any package:

```sh
lumine --link . --dev
lumine --dev .
```

For small visual changes you do not need a whole theme — a few rules in your `styles.css` may be enough. See [Style tweaks](../customizing-lumine/style-tweaks.md).
