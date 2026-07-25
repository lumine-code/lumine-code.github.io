# Jupyter notebooks

Lumine's **`jove-view`** package opens and edits Jupyter notebooks (`.ipynb`) in a cell-based editor. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/jove-view`. Open a notebook from the tree view with `jove-view:open-notebook`, start a new one with `jove-view:new-notebook`, or switch the active file between its notebook and text views with `jove-view:toggle`.

## Cells

Like classic Jupyter, the editor has a command mode and an edit mode (`jove-view:enter-command-mode` / `jove-view:enter-edit-mode`). Cell editors offer autocomplete while you type — kernel completions when a kernel is live, word completions from open buffers otherwise. Python cells use the bundled IPython grammar, so magics (`%m`, `%%m`), shell escapes (`!cmd`), and help requests (`?obj`, `obj?`) highlight as valid syntax rather than as errors. Move between cells with `jove-view:focus-next-cell` / `jove-view:focus-previous-cell`, and extend a multi-cell selection with `jove-view:select-next-cell` / `jove-view:select-previous-cell`. Insert, delete, move, duplicate, cut, copy, paste, and merge cells with the matching `jove-view:*-cell` commands, or reorder them by drag and drop. Change a cell's type with `jove-view:change-cell-to-code` / `-markdown` / `-raw`, and hide input or output with `jove-view:toggle-cell-input` / `jove-view:toggle-cell-output`. Edits are undoable with `jove-view:undo-cell-operation` / `jove-view:redo-cell-operation`.

## Running cells

When the [jove-repl](jove-repl.md) package is installed, cells run on its Jupyter kernels through the `jove.adapter` service — each cell has a run button and live execution status, and stored outputs (text, images, SVG, HTML, LaTeX, markdown, and ANSI-colored streams) render inline. Clear outputs with `jove-view:clear-output` or `jove-view:clear-all-outputs`.

## Source, search, and export

`jove-view:open-source` opens the notebook as plain `.ipynb` JSON. With the search-panel package, the buffer find panel searches and replaces across cell source, entering edit mode on the matching cell. `jove-view:export-to-python` and `jove-view:export-to-html` save the notebook as a script or a web page. When the linter, navigation-panel, and scrollmap packages are present, cell diagnostics, markdown-heading outlines, and scrollbar markers stay in sync with the notebook.
