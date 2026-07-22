# Basics

This section covers the everyday mechanics of editing in Lumine. Most actions are available three ways: from the **menus**, from the **Command Palette**, and from a **keybinding**.

## The Command Palette

The Command Palette is the fastest way to find and run anything. Toggle it with the bundled `command-palette` package (`command-palette:toggle`) and start typing the name of a command. The palette fuzzy-matches command names and shows the keybinding bound to each one, so it doubles as a way to learn shortcuts.

To see commands that are normally hidden, run `command-palette:show-hidden-commands`.

## Finding keybindings

Every command can be bound to a key. To see what is bound — and to what — open **Settings → Keybindings**, which lists every active binding and lets you search by command or keystroke. Because bindings differ per platform and can be customized, this manual refers to commands by name (for example `editor:delete-line`) rather than hardcoding keystrokes. See [Keybindings](../customizing-lumine/keybindings.md) to change them.

## Opening and saving

- **Open** a file or folder from the menus, or from the terminal with the `lumine` command (see [Launching Lumine](../getting-started/launching-lumine.md)).
- **Save** with `core:save`; save under a new name with `core:save-as`; save every open editor with `window:save-all`.
- The bundled `autosave` package can save automatically when an editor loses focus — enable it in its settings.

## Undo, cut, copy, paste

The standard `core:undo` / `core:redo`, `core:cut` / `core:copy` / `core:paste`, and `core:select-all` commands work as you would expect. `editor:paste-without-reformatting` pastes without auto-adjusting indentation.

## Where to go next

- [Moving around](moving-around.md) — cursor movement and jumping.
- [Selections](selections.md) — single and multiple selections.
- [Editing and deleting text](editing-and-deleting.md) — line and word operations.
- [Navigating your project](navigating-your-project.md) — fuzzy finders and the tree view.
