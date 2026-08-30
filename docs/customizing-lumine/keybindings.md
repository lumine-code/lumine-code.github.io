# Keybindings

Every command in Lumine can be bound to a keystroke. Bindings map a **keystroke**, in a **context** (a CSS selector describing where it applies), to a **command**.

## Seeing what is bound

Open **Settings → Keybindings** to browse every active binding and search by command or keystroke. This is also where you see which package a binding comes from, which helps when two bindings collide.

## Your keymap file

Personal bindings live in **`keymap.json`** (or a manually created `keymap.jsonc`), opened with `application:open-your-keymap`. It is grouped by selector:

```json
{
  "lumine-text-editor:not([mini])": {
    "ctrl-alt-r": "editor:duplicate-lines"
  },
  "lumine-workspace": {
    "cmdorctrl-shift-p": "command-palette:toggle"
  }
}
```

- The **selector** (`lumine-text-editor:not([mini])`, `lumine-workspace`, a package's root class, and so on) decides where the binding is active.
- The **keystroke** is on the left; the **command** it runs is on the right.
- Lumine starts at the focused element and stops at the nearest element with a matching binding. On that element, priority wins first, then selector specificity, then recency; the user keymap has higher priority than package and core keymaps.
- A legacy `keymap.cson` is not loaded; convert it to JSON or JSONC first.

## Keystroke spelling

Write keystrokes in lowercase and spell Shift explicitly: `ctrl-N` and `ctrl-n` both normalize to `ctrl-n`, while <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>N</kbd> is `ctrl-shift-n`. Caps Lock does not change which binding matches.

`backquote` names the physical key above <kbd>Tab</kbd> on the common US layout, independently of the character produced by the active keyboard layout. A literal `` ` `` or `~` names the character instead.

```json
{
  "lumine-text-editor:not([mini])": {
    "ctrl-n": "core:move-down",
    "ctrl-shift-n": "core:select-down"
  },
  "lumine-workspace": {
    "ctrl-backquote": "terminal:focus"
  }
}
```

## Cross-platform bindings

Use the special **`cmdorctrl`** modifier to bind the natural key for each platform in one line — it resolves to <kbd>Cmd</kbd> on macOS and <kbd>Ctrl</kbd> everywhere else:

```json
{
  "lumine-workspace": {
    "cmdorctrl-shift-e": "fuzzy-explorer:toggle"
  }
}
```

Core keeps shared bindings in a base keymap and splits out only genuine platform differences.

## Key conventions

<kbd>Alt</kbd> plus a letter normally focuses a panel or picker, and pressing it again returns focus to the editor. A shared domain uses the letter as a chord prefix instead: <kbd>Alt</kbd><kbd>G</kbd> groups Git commands and surfaces, while <kbd>Alt</kbd><kbd>J</kbd> groups Jupyter commands and surfaces. Once a surface has focus, its local actions use unmodified letters, function keys, arrows, and <kbd>Esc</kbd> without affecting text editing elsewhere.

Cross-editor conventions keep their familiar keys: <kbd>Ctrl</kbd><kbd>Backquote</kbd> for the terminal, <kbd>Cmd/Ctrl</kbd><kbd>P</kbd> for files, <kbd>Cmd/Ctrl</kbd><kbd>Shift</kbd><kbd>P</kbd> for the command palette, <kbd>Cmd/Ctrl</kbd><kbd>F</kbd> for find, and <kbd>F2</kbd> for rename.

## Debugging a keystroke

If a key isn't doing what you expect, open the resolver with `keybinding-resolver:toggle` (the bundled `keybinding-resolver` package) and press the key. It shows every binding that matched, which one won, and which were shadowed — the fastest way to find a conflict.
