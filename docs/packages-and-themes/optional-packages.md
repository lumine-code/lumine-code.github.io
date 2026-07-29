# Optional packages

Lumine ships lean: many features live in optional packages maintained in the `lumine-code` organization and listed in the default catalog. Install any of them from **Settings → Install** (see [The package system](package-system.md)) or with `lumine --install lumine-code/<name>`. Each package's README documents its commands and services.

## Everyday tools

- **terminal** — a terminal emulator built into the workspace.
- **pdf-view** — view PDF files, with LaTeX/Typst SyncTeX integration.
- **image-editor** — open and inspect images, with zoom and background modes.
- **diff-view** — a split-pane diff of two editors.
- **log-filter** — hide the lines of a log that do not match a query or a severity.
- **navigation-panel** — a document outline with click-to-navigate headers.
- **minimap** — a canvas overview of the whole buffer beside the scrollbar.
- **highlight-selected** — highlight other occurrences of the selected word.
- **sort-lines** — sort, reverse, shuffle, and deduplicate selected text lines.
- **calc-inline** — evaluate selected JavaScript expressions, reuse earlier results, and number selections.
- **regex-aligner**, **sequence-creator**, **super-select**, **cursor-leader**, **quick-layout**, **invert-colors**, **word-map** — small editing and workspace utilities.

## Git and GitHub

- **git-panel** — stage, commit, and manage your repository.
- **github-panel** — pull requests, issues, and reviews.

## Code intelligence

Language-server backends for the bundled `ide-client` package, and the user interfaces for what they report (see [Code intelligence](../using-lumine/code-intelligence.md)):

- **ide-typescript**, **ide-pyright**, **ide-ruff**, **ide-texlab**, **ide-tinymist** — language-server adapters for TypeScript and JavaScript, Python types, Python linting and formatting, LaTeX, and Typst.
- **hover** — documentation tooltips and signature help at the cursor.
- **outline-view** — a hierarchical symbol outline of the active editor.
- **intentions** — code actions and quick fixes at the cursor.
- **refactor** — rename symbols across the project.
- **code-format** — format on demand or on save through registered providers.
- **find-references** — highlight and list references to the symbol under the cursor.
- **call-hierarchy** — explore incoming and outgoing calls for a symbol.

## Linting and formatting

- **linter** — the message hub consumed by all linter providers.
- **busy-signal** — a status-bar dot that spins while packages report work in progress.
- **linter-eslint**, **linter-ruff**, **linter-todo**, **linter-sofistik** — language linters.
- **prettier** — format buffers with Prettier.

## Languages and completion

- **language-latex**, **language-typst**, **language-log**, **language-tasklist**, **language-ahkpp**, **language-sofistik** — grammars and language support.
- **autocomplete-jedi** — Python completions and go-to-definition via jedi.
- **autocomplete-sofistik** — completions for SOFiSTiK input files.
- **latex-tools**, **typst-tools**, **sofistik-tools**, **tasklist-tools**, **bib-finder** — build, preview, and navigation tooling for those ecosystems.

## Jupyter

- **jupyter-repl** — run code against Jupyter kernels from any editor.
- **jupyter-view** — open and edit Jupyter notebooks.

## Scrollbar markers

- **marker** — the hub that computes each marker layer once per editor; **scrollmap** draws the layers on
  the vertical scrollbar and **minimap** draws the same layers over the code. The layers themselves come
  from: **marker-cursors**, **marker-brackets**, **marker-highlight**, **marker-git-diff**,
  **marker-diff-view**, **marker-linter**, **marker-navigation**, **marker-search-panel**,
  **marker-jupyter-repl**, **marker-references**.

## File icons

The tree view, tabs, search results, and fuzzy finders show a generic icon per file until an icon package supplies a better one. Icon packages form a chain rather than competing: each is asked in turn and any of them may decline, so more than one can be installed and each answers for the files it knows.

- **more-icons** — around 900 glyphs from the `file-icons` set, or the Seti set Visual Studio Code uses. On the Seti set it will also load an external Visual Studio Code file-icon-theme manifest, as long as that theme draws its icons with a font rather than SVG.
- **native-icons** — file icons from the operating system shell. It claims nothing until its greenlist names the files you want it for, so it layers cleanly on top of a glyph set: greenlist `*.exe, *.lnk` for the binaries a font cannot draw, or `*` to use system icons throughout.

## Desktop integration

- **windows-clip** — Explorer-compatible file cut/copy/paste in the tree view.
- **open-in-totalcmd** — reveal paths in Total Commander.
- **terminal-spawn** — launch external terminals in project folders.
- **folder-sync**, **fast-publish**, **tree-view-favourites** — file management helpers.

## Editor integration for AI

- **lumine-mcp** — expose editor tools over the Model Context Protocol.
