# Style tweaks

Because Lumine's interface is HTML and CSS, you can restyle any part of it yourself — no theme required.

## Your stylesheet

Personal styles live in **`styles.less`**, opened with `application:open-your-stylesheet`. It is written in [Less](https://lesscss.org/) (plain CSS also works, since CSS is valid Less), and its rules are applied on top of your active theme.

```less
// Make the tree view text a little larger.
.tree-view {
  font-size: 15px;
}

// Add breathing room around the active editor.
atom-text-editor {
  padding-top: 4px;
}
```

Changes are applied live as you save the file — no reload needed.

## Finding the right selector

To find what to target, open the developer tools (`window:toggle-dev-tools`) and use the element inspector to hover over the interface. The editor is built from custom elements such as `atom-workspace`, `atom-panel`, and `atom-text-editor`, plus ordinary class names on package UIs (for example `.tree-view`, `.status-bar`, `.tab-bar`).

## Using theme colors

Rather than hardcoding colors, reference the active theme's **CSS custom properties** so your tweaks adapt to light and dark themes automatically:

```less
.my-highlight {
  color: var(--text-color);
  background: var(--background-color);
}
```

Many packages document a root selector and the properties they expose; targeting those keeps your tweaks working across theme changes. For deeper visual changes, consider [developing a theme](../developing-for-lumine/developing-a-theme.md) instead.
