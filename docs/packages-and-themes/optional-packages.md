# Optional packages

Lumine ships lean: many features live in optional packages maintained in the `lumine-code` organization and listed in the default catalog. Install any of them from **Settings → Install** (see [The package system](package-system.md)) or with `lumine --install lumine-code/<name>`. Each package's README documents its commands and services.

## Everyday tools

- **terminal** — a terminal emulator built into the workspace.
- **pdf-view** — view PDF files, with LaTeX/Typst SyncTeX integration.
- **image-editor** — open and inspect images, with zoom and background modes.
- **diff-view** — a split-pane diff of two editors.
- **navigation-panel** — a document outline with click-to-navigate headers.
- **minimap** — a canvas overview of the whole buffer beside the scrollbar.
- **highlight-selected** — highlight other occurrences of the selected word.
- **regex-aligner**, **sequence-creator**, **super-select**, **cursor-leader**, **quick-layout**, **invert-colors**, **word-map** — small editing and workspace utilities.

## Git and GitHub

- **git-panel** — stage, commit, and manage your repository.
- **github-panel** — pull requests, issues, and reviews.

## Linting and formatting

- **linter** — the message hub consumed by all linter providers.
- **busy-signal** — progress indicator for long-running providers.
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

- **scrollmap** — the scrollbar-marker hub; satellites feed it markers:
  **scrollmap-cursors**, **scrollmap-brackets**, **scrollmap-highlight**, **scrollmap-git-diff**, **scrollmap-diff-view**, **scrollmap-linter**, **scrollmap-navigation**, **scrollmap-search-panel**, **scrollmap-jupyter-repl**.

## Desktop integration

- **native-icons** — file icons from the operating system shell.
- **windows-clip** — Explorer-compatible file cut/copy/paste in the tree view.
- **open-in-totalcmd** — reveal paths in Total Commander.
- **terminal-spawn** — launch external terminals in project folders.
- **folder-sync**, **fast-publish**, **tree-view-favourites** — file management helpers.

## Editor integration for AI

- **lumine-mcp** — expose editor tools over the Model Context Protocol.
