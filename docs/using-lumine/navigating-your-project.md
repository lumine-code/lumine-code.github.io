# Navigating your project

Lumine ships several fast, keyboard-driven ways to move around a project without reaching for the mouse.

## The tree view

The bundled **`tree-view`** package shows your project's directories and files. From it you can open files, create files and folders (`tree-view:add-file`, `tree-view:add-folder`), and cut, copy, paste, duplicate, or move entries. `tree-view:open-selected-entry-right` (and the `-left`/`-up`/`-down` variants) open a file in a split pane; with `open-external` installed, Alt-click opens it in an external program.

## Fuzzy finders

Lumine splits fuzzy finding into focused packages:

- **`fuzzy-files`** — run `fuzzy-files:toggle` to find a project file, optionally using `file.js:42` to jump to a line. Its actions can copy, insert, or reveal a path; external opening requires `open-external`.
- **`fuzzy-workspace`** — run `fuzzy-workspace:toggle` to jump to any _already open_ item across the workspace center and the left, right, and bottom docks; confirming reveals its dock and focuses it.
- **`fuzzy-explorer`** — run `fuzzy-explorer:toggle` to fuzzy-search files across your own list of directories, defined in an `explorer.json` config file (open it with `fuzzy-explorer:edit`; a legacy `explorer.cson` is also read).

All three fuzzy finders are optional and available under **Settings → Install**.

## Symbols

Install `symbol` with at least one provider: `symbol-tree-sitter` reads the active grammar and `symbol-ctags` supplies ctags results. Use `symbol:toggle-file-symbols` for the active editor, `symbol:toggle-project-symbols` for the project, `symbol:go-to-declaration` to follow a symbol, and `symbol:return-from-declaration` to return.

Install `hyperclick` for pointer navigation supplied by `symbol` or another `hyperclick.provider`: hold Alt and click an underlined symbol, or run `hyperclick:confirm-cursor`. The modifier is configurable.

## Other navigators

The `recent-list` package switches between recently opened paths, and `project-list` does the same for projects you have saved. Install them from the Install pane in **Settings**, or with `lumine --install lumine-code/recent-list` and `lumine --install lumine-code/project-list`. Recently opened projects are also always available from **File > Reopen Project**, which is part of the editor itself. Combined with the [Command Palette](basics.md#the-command-palette), these give you fast, mouse-free navigation across everything you have open.

## Switching projects in place

Both lists and the tree view offer **Open in This Window**. Lumine saves the outgoing project's editors, including unsaved changes, restores the incoming project's editors, and leaves dock items running. Projects that require a different dev or safe mode still open a new window; avoid opening one project in several windows if you depend on its restored editor session, because the last window to save wins.

Packages reach the same behavior through `lumine.project.setState(projectPaths)`, documented in the [Lumine API reference](https://lumine-code.github.io/api/).
