# Linting

Lumine's **`linter`** package surfaces diagnostics — errors, warnings, info, and hints — from linter providers directly in the editor. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/linter`. Provider packages such as `linter-eslint` or `linter-ruff` report the problems; the `linter` package collects them and marks them in the editor. To read them all in one list, add `linter-panel`.

## Inline messages

Problems are underlined and marked in the gutter. Hints use a dotted underline without a gutter or overview marker; unnecessary code is dimmed and deprecated code struck through. Install [`hover`](code-intelligence.md) for pointer tooltips, or use `linter:inspect` at the cursor; `linter:next` and `linter:previous` step through the current file's messages. **Show Hover Tooltip** controls the integration.

Inline decorations are skipped for very large files to keep editing responsive — the **Large File Line Count** and **Long Line Length** settings control the thresholds. Every message is still reported.

## Controlling what gets linted

`linter:toggle-current-file` pauses the active file; `linter:toggle-linter` enables or disables providers. **Ignore files matching this Glob** excludes matching paths, and the core **Exclude VCS Ignored Paths** setting skips ignored files. Unsaved buffers can still be linted.

By default files are linted when opened (**Lint on Open**) and as you type (**Lint on Change**, throttled by **Lint on Change Interval**); disable either to lint only on save. `linter:lint` lints the current file on demand, and `linter:debug` reports which providers apply to it.

## Providers

The `linter` package does not analyze code itself — it consumes the `linter.provider` service. Install one or more provider packages for the languages you work in, and their diagnostics appear automatically. Packages can also push messages directly through the `linter.registry` service, and non-text items such as Jupyter notebooks integrate through the `linter.adapter` service.

Providers receive open document editors, including unsaved buffers. Packages can register document editors embedded in another surface, such as a commit message or notebook source, through `linter.editors`.

Install `spell-check` to report misspellings through the linter and offer corrections through [autocomplete](autocomplete.md) and code actions. Use **Checked Grammars**, **Excluded Scopes**, and **Severity** to control automatic checking; `spell-check:check-selected` checks a selection regardless of those scope settings.

`linter-ruff` and `ide-ruff` can coexist: the CLI linter stands down for editors and notebooks whose Ruff server has diagnostics enabled, while retaining project/tree scans, unsupported notebooks, and its fix and format commands. Providers wrapping different tools, such as `linter-eslint` beside `ide-typescript`, remain independent.
