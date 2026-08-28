# Style tweaks

Because Lumine's interface is HTML and CSS, you can restyle any part of it yourself — no theme required.

## Your stylesheet

Personal styles live in **`styles.css`**, opened with `application:open-your-stylesheet`. It is plain CSS, and its rules are applied on top of your active theme.

```css
/* Make the tree view text a little larger. */
.tree-view {
  font-size: 15px;
}

/* Add breathing room around the active editor. */
lumine-text-editor {
  padding-top: 4px;
}
```

Changes are applied live as you save the file — no reload needed.

## Finding the right selector

To find what to target, run `window:toggle-dev-tools` to open the developer tools, then use the element inspector to hover over the interface. The editor is built from custom elements such as `lumine-workspace`, `lumine-panel`, and `lumine-text-editor`, plus ordinary class names on package UIs (for example `.tree-view`, `.status-bar`, `.tab-bar`).

Editors carry attributes describing what they are, which is usually a better handle than where they sit. `lumine-text-editor[input]` is every editor used as a form control — the command palette's query, the search fields, a package's expression box — so one rule restyles all of them at once, and `[mini]` narrows that to the single-line ones:

```css
/* Give every input editor a little more room. */
lumine-text-editor[input] {
  border-radius: 6px;
}
```

The status bar and title bar mark what they hold the same way. Every item in the status bar carries `.status-bar-item`, and every control tile beside the window buttons carries `.title-bar-item`, whichever package put it there:

```css
/* Round every status-bar item a little harder. */
.status-bar .status-bar-item {
  border-radius: 8px;
}
```

Reach for those rather than `.inline-block`, which is a general layout class packages also use inside an item — targeting it restyles the parts of an item as well as the item itself.

## Using theme colors

Rather than hardcoding colors, reference the active theme's **CSS custom properties** so your tweaks adapt to light and dark themes automatically:

```css
.my-highlight {
  color: var(--text-color);
  background: var(--background-color);
}
```

Many packages document a root selector and the properties they expose; targeting those keeps your tweaks working across theme changes. For deeper visual changes, consider [developing a theme](../developing-for-lumine/developing-a-theme.md) instead.

## The accent color

`--accent-color` and its companions — the color behind focus rings, checkboxes, progress bars and tooltips — come from the active theme by default. Set **Accent Source** to `system` in Settings and they follow the operating system's accent color instead, falling back to the theme's own on a platform that reports none.

Your `styles.css` wins over both, so you can pin the accent to whatever you like regardless of that setting:

```css
:root {
  --accent-color: #b4637a;
  --accent-bg-color: #b4637a;
}
```
