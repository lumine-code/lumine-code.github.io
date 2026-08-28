# Navigating your project

Lumine ships several fast, keyboard-driven ways to move around a project without reaching for the mouse.

## The tree view

The bundled **`tree-view`** package shows your project's directories and files. From it you can open files (single or double click, configurable), create files and folders (`tree-view:add-file`, `tree-view:add-folder`), and cut, copy, paste, duplicate, or move entries. `tree-view:open-selected-entry-right` (and the `-left`/`-up`/`-down` variants) open a file directly into a split pane. Alt-click opens a file in an external program.

## Fuzzy finders

Lumine splits fuzzy finding into focused packages:

- **`fuzzy-files`** — run `fuzzy-files:toggle` to find and open a file anywhere in the open projects, ranked by match quality and proximity to the active file. It supports `file.js:42` line syntax to jump straight to a line, and can copy, insert, or reveal a path, open files externally, or reveal them in the tree view.
- **`fuzzy-workspace`** — run `fuzzy-workspace:toggle` to jump to any _already open_ item across the workspace center and the left, right, and bottom docks; confirming reveals its dock and focuses it.
- **`fuzzy-explorer`** — run `fuzzy-explorer:toggle` to fuzzy-search files across your own list of directories, defined in an `explorer.json` config file (open it with `fuzzy-explorer:edit`; a legacy `explorer.cson` is also read).

Install any of the three from the Install pane in **Settings**, or with `lumine --install lumine-code/fuzzy-files`, `lumine --install lumine-code/fuzzy-workspace` and `lumine --install lumine-code/fuzzy-explorer`.

## Symbols

The **`symbol`** package jumps to functions, methods, and other symbols. Use `symbol:toggle-file-symbols` for the active editor and `symbol:toggle-project-symbols` across the project. Follow a symbol with `symbol:go-to-declaration` and return with `symbol:return-from-declaration`. Symbols are provided by `symbol-tree-sitter` (from the active grammar) and `symbol-ctags`.

The **`hyperclick`** package makes the same jump with the pointer: hold Alt and symbols that something can resolve are underlined, and clicking one follows it. The modifier is configurable, and `hyperclick:confirm-cursor` does the same for whatever the cursor is on. Any package can answer for the words it understands by providing `hyperclick.provider`.

## Other navigators

The `recent-list` package switches between recently opened paths, and `project-list` does the same for projects you have saved. Install them from the Install pane in **Settings**, or with `lumine --install lumine-code/recent-list` and `lumine --install lumine-code/project-list`. Recently opened projects are also always available from **File > Reopen Project**, which is part of the editor itself. Combined with the [Command Palette](basics.md#the-command-palette), these give you fast, mouse-free navigation across everything you have open.

## Switching projects in place

Both lists offer **Open in This Window** alongside **Open in a New Window**, and the tree view offers it on any entry's context menu. It changes which project the window has open without starting a second one, so packages, themes, and grammars stay loaded and the change is close to instant.

The editors you have open are saved with the project you are leaving — unsaved changes included — and the ones the incoming project was last left with are restored, so returning to a project finds it as you left it. Only the editor area changes: a tree view, a terminal, or any other panel in a dock keeps running, because docks belong to the window rather than to the project it happens to have open.

Two things it cannot do. A project configured for dev or safe mode still opens a window of its own, since neither can change while a window is running. And a project already open in another window shares one saved session with that window, so the last one to save wins — keep a project to one window if you care which editors come back.

Packages reach the same behavior through `lumine.project.setState(projectPaths)`, documented in the [Lumine API reference](https://lumine-code.github.io/api/).
