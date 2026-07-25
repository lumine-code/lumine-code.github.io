# Jupyter REPL

Lumine's **`jove-repl`** package runs code interactively with Jupyter kernels, showing results inline in the editor — plots, images, HTML, LaTeX, and interactive Plotly and Vega charts, with one kernel per language shared across files. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/jove-repl`. It needs Jupyter kernels installed on your system (`pip install ipykernel` registers Python; the package README covers R, JavaScript, and Julia). IPython scripts (`.ipy`) get a dedicated bundled grammar that parses IPython-only statements — magics (`%m`, `%%m`), shell escapes (`!cmd`), and help requests (`?obj`, `obj?`) — as valid syntax, and they run on regular python kernels.

## Running code

Without a selection, `jove-repl:run` detects what to execute from the cursor position — a Python compound statement, a multi-line bracket expression, a foldable block, or the current line — and `jove-repl:run-and-move-down` advances to the next block afterward. `jove-repl:run-cell` and `jove-repl:run-cell-and-move-down` run the current cell. `jove-repl:run-all` and `jove-repl:run-all-above` run a whole file (each with an `-inline` variant that runs one statement at a time), and `jove-repl:recalculate-all` clears results, restarts the kernel, and re-runs. `jove-repl:clear-results` removes inline output.

## Kernels

`jove-repl:start-local-kernel` starts a kernel for the editor's language; `jove-repl:interrupt-kernel`, `jove-repl:restart-kernel`, and `jove-repl:shutdown-kernel` control it, and `jove-repl:shutdown-all-kernels` stops every running kernel. When more than one kernel matches a language, choose it with a magic comment on the first line — for example `#:: python3`. While a file has a live kernel, jove-repl adds the `jove-kernel` class to its `atom-text-editor`, so you can scope keymaps and styles to editors that are actually running.

## Remote kernels

`jove-repl:connect-to-remote-kernel` connects to a Jupyter server defined in `gateways.json` — open that file with `jove-repl:open-gateways`, and jove-repl creates it on first use. `jove-repl:connect-to-existing-kernel` attaches to a local kernel by its connection file.

## Inspecting results

`jove-repl:inspect-under-cursor` shows documentation for the symbol under the cursor without moving focus, and `jove-repl:open-data-explorer` loads a dataframe, array, or nested object into a searchable grid with charts, drill-down, and breadcrumbs. Watch expressions (`jove-repl:add-watch`, `jove-repl:toggle-watches`) re-run on every execution; `jove-repl:toggle-variable-explorer` browses the kernel namespace; and `jove-repl:toggle-kernel-monitor-focus` lists and controls running kernels. Click an inline result to copy it, or Ctrl+Click (Cmd+Click on macOS) to open it in an editor.

## Notebooks and console

`jove-repl:import-notebook` and `jove-repl:export-notebook` convert between an editor file and `.ipynb`, and jove-repl is the execution engine behind the [jove-view](jove-view.md) notebook editor. `jove-repl:open-jupyter-console` attaches a Jupyter console to the active kernel in an embedded [terminal](terminal.md) pane, sharing state with your inline code; `jove-repl:spawn-jupyter-console` runs it in the system terminal, and `jove-repl:copy-jupyter-console-command` copies the command.
