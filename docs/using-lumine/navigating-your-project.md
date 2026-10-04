# Navigating your project

Lumine ships several fast, keyboard-driven ways to move around a project without reaching for the mouse.

## The tree view

The bundled **`tree-view`** package shows your project's directories and files. From it you can open files, create files and folders (`tree-view:add-file`, `tree-view:add-folder`), and cut, copy, paste, duplicate, or move entries. `tree-view:open-selected-entry-right` (and the `-left`/`-up`/`-down` variants) open a file in a split pane; with `open-external` installed, Alt-click opens it in an external program. Tree view also owns the will/did boundary around these user-initiated filesystem operations, allowing language integrations to prepare reference updates without making it the executor for server-authored `WorkspaceEdit` changes.

Confirming a rename with Enter changes the file or folder's path without waiting for language servers to update references. Alt+Enter runs the rename dialog's separate `tree-view:confirm-and-update-references` action when you want that work; reference updates can take longer while a server analyzes the project. Moves initiated by the tree view update the paths of open documents in that workspace while preserving edits and view state. An external rename leaves a document at its original path; it is treated as a missing file and can observe a file recreated under that name. Unsaved contents are preserved.

## Fuzzy finders

Lumine splits fuzzy finding into focused packages:

- **`fuzzy-files`** — run `fuzzy-files:toggle` to find a project file, optionally using `file.js:42` to jump to a line. Its actions can copy, insert, or reveal a path; external opening requires `open-external`.
- **`fuzzy-workspace`** — run `fuzzy-workspace:toggle` to jump to any _already open_ item across the workspace center and the left, right, and bottom docks; confirming reveals its dock and focuses it.
- **`fuzzy-explorer`** — run `fuzzy-explorer:toggle` to fuzzy-search files across your own list of directories, defined in an `explorer.json` config file (open it with `fuzzy-explorer:edit`; a legacy `explorer.cson` is also read).

All three fuzzy finders are optional and available under **Settings → Install**.

## Symbols

Install `symbol` with at least one provider: `symbol-tree-sitter` reads the active grammar and `symbol-ctags` supplies ctags results. Use `symbol:toggle-file-symbols` for the active editor, `symbol:toggle-project-symbols` for the project, `symbol:go-to-declaration` to follow a symbol, and `symbol:return-from-declaration` to return.

Install `hyperclick` for pointer navigation supplied by `symbol` or another `hyperclick.provider`: hold Alt to underline the available target under the mouse and show a pointer cursor, then left-click to follow it. For keyboard navigation, run `hyperclick:confirm-cursor`. Disabling a provider removes its links immediately and discards any answers still being resolved.

Install `link` alongside `hyperclick` to follow recognized HTTP(S) and mailto links in the default browser or mail application. The provider underlines the complete link when the pointer is over a word within it and also resolves named Markdown references.

Alt is the fixed mouse-navigation modifier on every platform. Pressing or releasing it updates the underline and mouse cursor immediately, even while the mouse stays still; moving with Alt held updates them for the target under the pointer. Ordinary mouse movement and clicking keep the editor's normal behavior.

## Other navigators

The `recent-list` package switches between recently opened paths, and `project-list` does the same for projects you have saved. Install them from the Install pane in **Settings**, or with `lumine --install lumine-code/recent-list` and `lumine --install lumine-code/project-list`. Recently opened projects are also always available from **File > Reopen Project**, which is part of the editor itself. Combined with the [Command Palette](basics.md#the-command-palette), these give you fast, mouse-free navigation across everything you have open.

`recent-list` searches paths without accents and highlights complete Unicode characters and emoji. Its actions remove individual projects from history or clear the whole list. History edits apply to the latest stored list, so an unrelated update from another window cannot restore a deleted entry. Entries whose folders are unavailable stay visible for removal; opening one in this window requires every folder to be available.

## Switching projects in place

Both lists and the tree view offer **Open in This Window**. Lumine saves the outgoing project's editors, including unsaved changes, restores the incoming project's editors, and leaves dock items running. Each window keeps its own session for each project; a window with no history can adopt the most recently saved session only while no other window has that project open. Project switches run one at a time, and unavailable folders leave the outgoing session intact. If restoring a saved session fails, Lumine restores the outgoing editors and project settings.

In `project-list`, every configured folder must be available for **Open in This Window**. Directory links and filesystem roots are supported. Projects that request dev or safe mode switch in place when that mode is already active; otherwise they open a new window and leave the source window open.

Packages reach the same behavior through `lumine.project.setState(projectPaths)`, documented in the [Lumine API reference](https://lumine-code.github.io/api/).
