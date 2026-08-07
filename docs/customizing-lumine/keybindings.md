# Keybindings

Every command in Lumine can be bound to a keystroke. Bindings map a **keystroke**, in a **context** (a CSS selector describing where it applies), to a **command**.

## Seeing what is bound

Open **Settings → Keybindings** to browse every active binding and search by command or keystroke. This is also where you see which package a binding comes from, which helps when two bindings collide.

## Your keymap file

Personal bindings live in **`keymap.json`**, opened with `application:open-your-keymap`. It is grouped by selector:

```json
{
  "atom-text-editor": {
    "ctrl-alt-r": "editor:duplicate-lines"
  },
  "atom-workspace": {
    "ctrl-shift-p": "command-palette:toggle"
  }
}
```

- The **selector** (`atom-text-editor`, `atom-workspace`, a package's root class, and so on) decides where the binding is active.
- The **keystroke** is on the left; the **command** it runs is on the right.
- Later bindings win over earlier ones, and your `keymap.json` is loaded last — so it overrides package and core bindings.
- A legacy `keymap.cson` is still read if you already have one, but new keymaps are created as JSON.

## Cross-platform bindings

Use the special **`cmdorctrl`** modifier to bind the natural key for each platform in one line — it resolves to <kbd>Cmd</kbd> on macOS and <kbd>Ctrl</kbd> everywhere else:

```json
{
  "atom-workspace": {
    "cmdorctrl-shift-e": "fuzzy-explorer:toggle"
  }
}
```

Lumine's own bundled bindings use this convention: shared bindings live in a base keymap and only genuinely platform-specific keys are split out.

## What the bundled keys look like

Bundled packages follow one rule, so you can usually guess a key rather than look it up.

**<kbd>Alt</kbd> + a letter brings up a surface** — a panel or a picker — and pressing it again hands
focus back to the editor. The letter is the package's own initial:

|                                           |                                             |                                       |                                             |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| <kbd>Alt</kbd><kbd>T</kbd> tree view      | <kbd>Alt</kbd><kbd>L</kbd> linter           | <kbd>Alt</kbd><kbd>N</kbd> navigation | <kbd>Alt</kbd><kbd>O</kbd> outline          |
| <kbd>Alt</kbd><kbd>E</kbd> explorer       | <kbd>Alt</kbd><kbd>P</kbd> projects         | <kbd>Alt</kbd><kbd>R</kbd> recent     | <kbd>Alt</kbd><kbd>M</kbd> scrollmap layers |
| <kbd>Alt</kbd><kbd>K</kbd> call hierarchy | <kbd>Alt</kbd><kbd>`</kbd> spawn a terminal |                                       |                                             |

Where several packages share a domain the letter becomes a **prefix** instead: <kbd>Alt</kbd><kbd>G</kbd>
for git (<kbd>Alt</kbd><kbd>G</kbd> <kbd>G</kbd> the git panel, <kbd>Alt</kbd><kbd>G</kbd> <kbd>H</kbd>
the GitHub panel, and the rest for opening the current file on your host), and <kbd>Alt</kbd><kbd>J</kbd>
for Jupyter.

**Once a surface has focus, its own keys are unmodified** — single letters, function keys, arrows and
<kbd>Esc</kbd>. In the git panel <kbd>U</kbd> and <kbd>S</kbd> move between unstaged and staged and
<kbd>F5</kbd>–<kbd>F8</kbd> fetch, pull and push; in the tree view <kbd>A</kbd> adds a file and
<kbd>F2</kbd> renames one. None of those keys does anything while you are editing.

A handful of keystrokes ignore all of this because you already know them from somewhere else:
<kbd>Ctrl</kbd><kbd>`</kbd> for the terminal, <kbd>Ctrl</kbd><kbd>P</kbd> for files,
<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>P</kbd> for the command palette, <kbd>Ctrl</kbd><kbd>F</kbd> for
find, <kbd>F2</kbd> for rename.

## Debugging a keystroke

If a key isn't doing what you expect, open the resolver with `keybinding-resolver:toggle` (the bundled `keybinding-resolver` package) and press the key. It shows every binding that matched, which one won, and which were shadowed — the fastest way to find a conflict.
