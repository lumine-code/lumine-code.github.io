# Linting

Lumine's **`linter`** package surfaces diagnostics — errors, warnings, info, and hints — from linter providers directly in the editor. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/linter`. Provider packages such as `linter-eslint` or `linter-ruff` report the problems; the `linter` package collects them and shows them inline, in a panel, and in the status bar.

## The linter panel

`linter:toggle-panel` opens or closes the panel, a sortable table of every current message. `linter:toggle-focus` moves focus into the panel (opening it if needed) and back to the editor. Once focused, the arrow keys move between rows and Enter jumps to the message; Escape returns to the editor.

The panel has two view modes: **file** shows only the active editor's messages, **project** shows every known message across the project. Switch between them with `linter:file-mode` and `linter:project-mode`, or middle-click the status-bar item. Choose the default ordering — by position, severity, or provider — with the **Default Sort Method** setting, or click a column header to re-sort.

Each row shows the message text, and beside it whatever long form the provider attached — a language server puts its rule code there, so a row reads `os imported but unused` followed by `Ruff: F401`. A provider that computes its long form on demand shows a **details** link instead, which fills it in. When the provider supplies a documentation link, **more info** opens it in the browser. Right-click a row to copy the message with its long form, or the whole message object.

## Inline messages

Problem ranges are underlined in the editor and marked with a dot in the gutter. Hints are the quietest tier — low-priority findings such as an unused import, a piece of unreachable code, or a TODO comment. They get a dotted underline, no gutter dot, and no scrollbar marker, but they are listed in the panel like anything else. Code a language server reports as unnecessary is dimmed, and deprecated code is struck through. `linter:inspect` shows a bubble with the message at the cursor — its text, with the provider's long form beneath it — and `linter:next` / `linter:previous` (bound to `alt-'` and `alt-;`) step through the messages in the current file. Hovering over an underlined range also shows its message; turn this off with **Show Hover Tooltip**.

Inline decorations are skipped for very large files to keep editing responsive — the **Large File Line Count** and **Long Line Length** settings control the thresholds. The panel still lists every message.

## The status bar

The status-bar item shows a count per severity. The hint count appears only once there is a hint to report, and hints on their own do not keep the item visible. Left-click toggles the panel, middle-click switches file/project mode, Ctrl+middle-click clears all messages, right-click jumps to the next message, and Ctrl+right-click to the previous. With **Status-bar item always visible** disabled, the item hides itself while there is nothing to report.

## Controlling what gets linted

`linter:toggle-current-file` stops (or resumes) linting for the active file. `linter:toggle-linter` opens a picker to enable or disable individual providers, remembered in the **Disabled providers** setting. Files matching the **Ignore files matching this Glob** setting (by default minified `*.min.js` / `*.min.css`) are never linted, and VCS-ignored files are skipped while the core **Exclude VCS Ignored Paths** setting is on.

By default files are linted when opened (**Lint on Open**) and as you type (**Lint on Change**, throttled by **Lint on Change Interval**); disable either to lint only on save. `linter:lint` lints the current file on demand, and `linter:debug` reports which providers apply to it.

## Providers

The `linter` package does not analyze code itself — it consumes the `linter.provider` service. Install one or more provider packages for the languages you work in, and their diagnostics appear automatically. Packages can also push messages directly through the `linter.registry` service, and non-text items such as Jupyter notebooks integrate through the `linter.adapter` service.
