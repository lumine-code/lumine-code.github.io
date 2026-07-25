# Jupyter REPL

Lumine's **`jupyter-repl`** package runs code interactively with Jupyter kernels, showing results inline in the editor — plots, images, HTML, LaTeX, and interactive Plotly and Vega charts, with one kernel per language shared across files. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/jupyter-repl`. It needs Jupyter kernels installed on your system (`pip install ipykernel` registers Python; the package README covers R, JavaScript, and Julia). IPython scripts (`.ipy`) get a dedicated bundled grammar that parses IPython-only statements — magics (`%m`, `%%m`), shell escapes (`!cmd`), and help requests (`?obj`, `obj?`) — as valid syntax, and they run on regular python kernels.

## Running code

Without a selection, `jupyter-repl:run` detects what to execute from the cursor position — a Python compound statement, a multi-line bracket expression, a foldable block, or the current line — and `jupyter-repl:run-and-move-down` advances to the next block afterward. `jupyter-repl:run-cell` and `jupyter-repl:run-cell-and-move-down` run the current cell. `jupyter-repl:run-all` and `jupyter-repl:run-all-above` run a whole file (each with an `-inline` variant that runs one statement at a time), and `jupyter-repl:recalculate-all` clears results, restarts the kernel, and re-runs. `jupyter-repl:clear-results` removes inline output.

## Kernels

`jupyter-repl:start-local-kernel` starts a kernel for the editor's language; `jupyter-repl:interrupt-kernel`, `jupyter-repl:restart-kernel`, and `jupyter-repl:shutdown-kernel` control it, and `jupyter-repl:shutdown-all-kernels` stops every running kernel. When more than one kernel matches a language, choose it with a magic comment on the first line — for example `#:: python3`. While a file has a live kernel, jupyter-repl adds the `jupyter-kernel` class to its `atom-text-editor`, so you can scope keymaps and styles to editors that are actually running.

## Remote kernels

`jupyter-repl:connect-to-remote-kernel` connects to a Jupyter server defined in `gateways.json` — open that file with `jupyter-repl:open-gateways`, and jupyter-repl creates it on first use. `jupyter-repl:connect-to-existing-kernel` attaches to a local kernel by its connection file.

## Inspecting results

`jupyter-repl:inspect-under-cursor` shows documentation for the symbol under the cursor without moving focus, and `jupyter-repl:open-data-explorer` loads a dataframe, array, or nested object into a searchable grid with charts, drill-down, and breadcrumbs. Watch expressions (`jupyter-repl:add-watch`, `jupyter-repl:toggle-watches`) re-run on every execution; `jupyter-repl:toggle-variable-explorer` browses the kernel namespace; and `jupyter-repl:toggle-kernel-monitor-focus` lists and controls running kernels. The watch, inspector, and data-explorer expression editors offer autocomplete — kernel completions plus words from your open buffers. Click an inline result to copy it, or Ctrl+Click (Cmd+Click on macOS) to open it in an editor.

## Notebooks and console

`jupyter-repl:import-notebook` and `jupyter-repl:export-notebook` convert between an editor file and `.ipynb`, and jupyter-repl is the execution engine behind the [jupyter-view](jupyter-view.md) notebook editor. `jupyter-repl:open-jupyter-console` attaches a Jupyter console to the active kernel in an embedded [terminal](terminal.md) pane, sharing state with your inline code; `jupyter-repl:spawn-jupyter-console` runs it in the system terminal, and `jupyter-repl:copy-jupyter-console-command` copies the command.
