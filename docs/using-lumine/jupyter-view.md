# Jupyter notebooks

Lumine's **`jupyter-view`** package opens and edits Jupyter notebooks (`.ipynb`) in a cell-based editor. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/jupyter-view`. Open a notebook from the tree view with `jupyter-view:open-notebook`, start a new one with `jupyter-view:new-notebook`, or switch the active file between its notebook and text views with `jupyter-view:toggle`.

## Cells

Like classic Jupyter, the editor has a command mode and an edit mode (`jupyter-view:enter-command-mode` / `jupyter-view:enter-edit-mode`). Cell editors offer autocomplete while you type — [language-server completions](#language-servers-in-notebooks), kernel completions when a kernel is live, word completions from open buffers otherwise. Python cells use the bundled IPython grammar, so magics (`%m`, `%%m`), shell escapes (`!cmd`), and help requests (`?obj`, `obj?`) highlight as valid syntax rather than as errors. Move between cells with `jupyter-view:focus-next-cell` / `jupyter-view:focus-previous-cell`, and extend a multi-cell selection with `jupyter-view:select-next-cell` / `jupyter-view:select-previous-cell`. Insert, delete, move, duplicate, cut, copy, paste, and merge cells with the matching `jupyter-view:*-cell` commands, or reorder them by drag and drop. Change a cell's type with `jupyter-view:change-cell-to-code` / `-markdown` / `-raw`, and hide input or output with `jupyter-view:toggle-cell-input` / `jupyter-view:toggle-cell-output`. Edits are undoable with `jupyter-view:undo-cell-operation` / `jupyter-view:redo-cell-operation`.

## Running cells

When the [jupyter-repl](jupyter-repl.md) package is installed, cells run on its Jupyter kernels through the `jupyter.adapter` service — each cell has a run button and live execution status — and stored outputs render inline through its `jupyter.output` renderers: text, images, SVG, HTML, LaTeX, markdown, ANSI-colored streams, and interactive Plotly and Vega charts. Without it, a notebook stays readable with plain text and images. Clear outputs with `jupyter-view:clear-output` or `jupyter-view:clear-all-outputs`.

## Language servers in notebooks

Notebook language-server support is built in: with the bundled `ide-client` package present, every open notebook is fed to the [language servers](language-servers.md) that understand notebooks — each code cell becomes its own document with full cross-cell context. For Python that is `ide-pyright` (Basedpyright: completions, hover, signature help, go-to-definition, rename) and `ide-ruff` (diagnostics, quick fixes, formatting). Server diagnostics draw inline squiggles in the cells, list in the diagnostics panel, and mark the notebook scrollbar; a definition or reference that points into a notebook opens it and reveals the cell. Kernel completions and server completions merge in one list, each server's feature switches apply in notebooks exactly as they do in files, and jupyter-view's `lsp.enabled` setting is the off switch.

## Source, search, and export

`jupyter-view:open-source` opens the notebook as plain `.ipynb` JSON. With the search-panel package, the buffer find panel searches and replaces across cell source, entering edit mode on the matching cell. `jupyter-view:export-to-python` and `jupyter-view:export-to-html` save the notebook as a script or a web page. When the linter, navigation-panel, and scrollmap packages are present, cell diagnostics, markdown-heading outlines, and scrollbar markers stay in sync with the notebook.
