# Keybindings

Every command in Lumine can be bound to a keystroke. Bindings map a **keystroke**, in a **context** (a CSS selector describing where it applies), to a **command**.

## Seeing what is bound

Open **Settings → Keybindings** to browse every active binding and search by command or keystroke. This is also where you see which package a binding comes from, which helps when two bindings collide.

## Your keymap file

Personal bindings live in **`keymap.cson`**, opened with `application:open-your-keymap`. It is grouped by selector:

```cson
"atom-text-editor":
  "ctrl-alt-r": "editor:duplicate-lines"

"atom-workspace":
  "ctrl-shift-p": "command-palette:toggle"
```

- The **selector** (`atom-text-editor`, `atom-workspace`, a package's root class, and so on) decides where the binding is active.
- The **keystroke** is on the left; the **command** it runs is on the right.
- Later bindings win over earlier ones, and your `keymap.cson` is loaded last — so it overrides package and core bindings.

## Cross-platform bindings

Use the special **`cmdorctrl`** modifier to bind the natural key for each platform in one line — it resolves to <kbd>Cmd</kbd> on macOS and <kbd>Ctrl</kbd> everywhere else:

```cson
"atom-workspace":
  "cmdorctrl-p": "fuzzy-files:toggle"
```

Lumine's own bundled bindings use this convention: shared bindings live in a base keymap and only genuinely platform-specific keys are split out.

## Debugging a keystroke

If a key isn't doing what you expect, open the resolver with `key-binding-resolver:toggle` (the bundled `keybinding-resolver` package) and press the key. It shows every binding that matched, which one won, and which were shadowed — the fastest way to find a conflict.
