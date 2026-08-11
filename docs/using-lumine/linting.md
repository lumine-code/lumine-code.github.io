# Linting

Lumine's **`linter`** package surfaces diagnostics — errors, warnings, info, and hints — from linter providers directly in the editor. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/linter`. Provider packages such as `linter-eslint` or `linter-ruff` report the problems; the `linter` package collects them and shows them inline, in a panel, and in the status bar.

## The linter panel

`linter:toggle-panel` opens or closes the panel, a sortable table of every current message. `linter:toggle-focus` moves focus into the panel (opening it if needed) and back to the editor. Once focused, the arrow keys move between rows and Enter jumps to the message; Escape returns to the editor.

The panel has two view modes: **file** shows only the active editor's messages, **project** shows every known message across the project. Switch between them with `linter:file-mode` and `linter:project-mode`, or middle-click the status-bar item. Choose the default ordering — by position, severity, or provider — with the **Default Sort Method** setting, or click a column header to re-sort.

Each row shows the message text, and beside it whatever long form the provider attached — a language server puts its rule code there, so a row reads `os imported but unused` followed by `Ruff: F401`. A provider that computes its long form on demand shows a **details** link instead, which fills it in. When the provider supplies a documentation link, **more info** opens it in the browser. Right-click a row to copy the message with its long form, or the whole message object.

A row is one line: a message longer than the column ends in an ellipsis, and the **details** link and the hover tooltip carry the rest. Only the rows the panel is scrolled to are built, so a file with tens of thousands of messages — a spell check of a large document, say — opens and scrolls as quickly as one with a handful.

## Inline messages

Problem ranges are underlined in the editor and marked with a dot in the gutter. Hints are the quietest tier — low-priority findings such as an unused import, a piece of unreachable code, or a TODO comment. They get a dotted underline, no gutter dot, and no scrollbar marker, but they are listed in the panel like anything else. Code a language server reports as unnecessary is dimmed, and deprecated code is struck through. Resting the pointer on an underlined range shows its messages, and resting it on the gutter dot shows everything on that line. Both are drawn by the [`hover`](code-intelligence.md) package, which linter answers ahead of any documentation source — so a word that is both wrong and worth explaining shows the message above the explanation, in one tooltip. `linter:inspect` opens the same tooltip at the cursor, and `linter:next` / `linter:previous` (bound to `alt-'` and `alt-;`) step through the messages in the current file, opening it at each. Turn the hover off with **Show Hover Tooltip**; without the `hover` package installed the panel and the decorations work as before, and there is simply no tooltip.

Inline decorations are skipped for very large files to keep editing responsive — the **Large File Line Count** and **Long Line Length** settings control the thresholds. The panel still lists every message.

## The status bar

The status-bar item shows a count per severity. The hint count appears only once there is a hint to report, and hints on their own do not keep the item visible. Left-click toggles the panel, middle-click switches file/project mode, Ctrl+middle-click clears all messages, right-click jumps to the next message, and Ctrl+right-click to the previous. With **Status-bar item always visible** disabled, the item hides itself while there is nothing to report.

## Controlling what gets linted

`linter:toggle-current-file` stops (or resumes) linting for the active file. `linter:toggle-linter` opens a picker to enable or disable individual providers, remembered in the **Disabled providers** setting. Files matching the **Ignore files matching this Glob** setting (by default minified `*.min.js` / `*.min.css`) are never linted, and VCS-ignored files are skipped while the core **Exclude VCS Ignored Paths** setting is on. A buffer that has never been saved is linted: neither of those questions can be asked of something that is not a file yet, and nothing has decided to ignore it.

By default files are linted when opened (**Lint on Open**) and as you type (**Lint on Change**, throttled by **Lint on Change Interval**); disable either to lint only on save. `linter:lint` lints the current file on demand, and `linter:debug` reports which providers apply to it.

## Providers

The `linter` package does not analyze code itself — it consumes the `linter.provider` service. Install one or more provider packages for the languages you work in, and their diagnostics appear automatically. Packages can also push messages directly through the `linter.registry` service, and non-text items such as Jupyter notebooks integrate through the `linter.adapter` service.

Not every provider is about code. `spell-check` reports each misspelled word as a diagnostic, so prose gets the panel, the navigation commands and the scrollbar markers too — and its corrections arrive as code actions, beside a language server's own. It reports errors by default, which is what draws the red underline; set its **Severity** to `hint` if you would rather spelling stayed in the quiet tier. Its **Checked Grammars** setting decides which files are checked as you type, and `spell-check:check-selected` ignores that setting to check whatever is selected — a comment block or a docstring in a language it does not cover — reporting the result separately so an ordinary lint cannot wipe it.

A language server reports through the same panel, so the same tool can reach you by two routes — `linter-ruff` shells out to Ruff, and `ide-ruff` runs Ruff's own server. Install both: `linter-ruff` sees the adapter and reports nothing for the editors it covers, keeping what the server does not do, namely Jupyter notebook cells, project-wide scans of files nobody opened, and its own fix and format commands. Two providers that wrap genuinely different tools, such as `linter-eslint` beside `ide-typescript`, are both worth running and neither stands down.
