# Jupyter REPL

Lumine's **`jupyter-repl`** package runs code interactively with Jupyter kernels, showing results inline in the editor — plots, images, HTML, LaTeX, and interactive Plotly and Vega charts, with one kernel per language shared across files. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/jupyter-repl`. It needs Jupyter kernels installed on your system (`pip install ipykernel` registers Python; the package README covers R, JavaScript, and Julia). IPython scripts (`.ipy`) get a dedicated bundled grammar that parses IPython-only statements — magics (`%m`, `%%m`), shell escapes (`!cmd`), and help requests (`?obj`, `obj?`) — as valid syntax, and they run on regular python kernels.

## Running code

Without a selection, `jupyter-repl:run` detects what to execute from the cursor position — a Python compound statement, a multi-line bracket expression, a foldable block, or the current line — and `jupyter-repl:run-and-move-down` advances to the next block afterward. `jupyter-repl:run-cell` and `jupyter-repl:run-cell-and-move-down` run the current cell. `jupyter-repl:run-all` and `jupyter-repl:run-all-above` run a whole file (each with an `-inline` variant that runs one statement at a time), and `jupyter-repl:recalculate-all` clears results, restarts the kernel, and re-runs. `jupyter-repl:clear-results` removes inline output.

## Exec panel

`jupyter-prompt:toggle` (in the **jupyter-prompt** package) opens a prompt over the session's execution history. Type code and press Enter to run it on the active editor's kernel; every run is listed below the prompt, newest first, badged with how long ago it ran and how it ended. Nothing is deduplicated, so running the same code twice leaves two entries. Typing filters the history: press Enter on a selected entry to re-run that instead of the prompt, or Shift+Enter (`jupyter-prompt:recall-history-entry`) to put it back in the prompt and edit it first. The arrow keys walk the history and step off either end back to the prompt, so running what you typed is never more than one key away. Running anything closes the panel, so you can see the output — unless no kernel is running, in which case the panel and what you typed stay put. F12 lists the panel's actions with their keys.

## Kernels

`jupyter-repl:start-local-kernel` starts a kernel for the editor's language; `jupyter-repl:interrupt-kernel`, `jupyter-repl:restart-kernel`, and `jupyter-repl:shutdown-kernel` control it, and `jupyter-repl:shutdown-all-kernels` stops every running kernel. When more than one kernel matches a language, choose it with a magic comment on the first line — for example `#:: python3`. While a file has a live kernel, jupyter-repl adds the `jupyter-kernel` class to its `atom-text-editor`, so you can scope keymaps and styles to editors that are actually running.

## Remote kernels

`jupyter-repl:connect-to-remote-kernel` connects to a Jupyter server defined in `gateways.json` — open that file with `jupyter-repl:edit-gateways`, and jupyter-repl creates it on first use. `jupyter-repl:connect-to-existing-kernel` attaches to a local kernel by its connection file.

## Panels

The panels that used to live in this package are packages of their own, each reading the kernels — and the output rendering — from jupyter-repl through its services: **jupyter-inspector** (`jupyter-inspector:inspect` shows documentation for the symbol under the cursor without moving focus), **jupyter-explorer** (`jupyter-explorer:explore` loads a dataframe, array, or nested object into a searchable grid with charts, drill-down, and breadcrumbs), **jupyter-watches** (`jupyter-watches:add`, `jupyter-watches:toggle` — expressions re-run on every execution, with a scrubbable value history), **jupyter-variables** (`jupyter-variables:toggle` browses and edits the kernel namespace), **jupyter-monitor** (`jupyter-monitor:toggle` lists and controls every running kernel), and **jupyter-prompt** (`jupyter-prompt:toggle` runs one-off code on the current kernel over a history of what it ran). Their expression editors offer autocomplete — kernel completions plus words from your open buffers. Click an inline result to copy it, or Ctrl+Click (Cmd+Click on macOS) to open it in an editor.

## Notebooks and console

`jupyter-repl:import-notebook` and `jupyter-repl:export-notebook` convert between an editor file and `.ipynb`, and jupyter-repl is the execution engine behind the [jupyter-view](jupyter-view.md) notebook editor. `jupyter-repl:open-terminal` attaches a Jupyter console to the active kernel in an embedded [terminal](terminal.md) pane, sharing state with your inline code; `jupyter-repl:spawn-terminal` runs it in the system terminal, and `jupyter-repl:copy-console-command` copies the command.
