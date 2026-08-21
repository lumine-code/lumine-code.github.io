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
- **cursor-history** — navigate backward and forward through recent cursor positions.
- **spell-check** — report misspelled words as linter diagnostics with contextual corrections. Needs **linter** to show them.
- **toolbar** — provide an extensible toolbar docked to the workspace edge.
- **build** — run project build targets and surface their output and diagnostics.
- **sort-lines** — sort, reverse, shuffle, and deduplicate selected text lines.
- **calc-inline** — evaluate selected JavaScript expressions, reuse earlier results, and number selections.
- **regex-aligner**, **sequence-creator**, **super-select**, **cursor-leader**, **quick-layout**, **invert-colors**, **word-map** — small editing and workspace utilities.

- **fuzzy-files** — quickly find and take an action over project files.
- **markdown-preview** — open a live, rendered preview of the Markdown in the current editor.
- **bracket-matcher** — highlight and jump between matching brackets, and autocomplete brackets and quotes.
- **bookmarks** — mark lines in the editor and jump back to them.
- **column-selection** — create rectangular selections across lines by dragging.
- **overtype-mode** — replace existing text as you type instead of inserting.
- **archive-view** — browse the files and folders inside archive files.
- **link** — open the http(s) link under the cursor in your default browser.
- **open-external** — open files and directories with their system applications.

## Git and GitHub

- **git-command** — run common Git workflows from a searchable select list in Lumine's modal pane zone.
- **git-panel** — stage, commit, and manage your repository.
- **github-panel** — pull requests, issues, and reviews.

- **git-center** — show the active Git repository, branch, and working-tree status in the status bar.
- **git-diff** — mark lines in the editor gutter that have been added, edited, or deleted since the last commit.

## Code intelligence

Language-server backends for the `ide-client` package, and the user interfaces for what they report (see [Code intelligence](../using-lumine/code-intelligence.md)):

- **ide-typescript**, **ide-eslint**, **ide-pyright**, **ide-ruff**, **ide-texlab**, **ide-tinymist**, **ide-marksman** — language-server adapters for TypeScript and JavaScript intelligence, ESLint diagnostics/fixes/formatting, Python types via Basedpyright, Python linting and formatting, LaTeX, Typst, and Markdown links and notes.
- **ide-bash**, **ide-css**, **ide-html**, **ide-json**, **ide-yaml** — bundled-server adapters for Bash, CSS/SCSS/Less, HTML, JSON/JSONC, and schema-aware YAML editing.
- **ide-dockerfile**, **ide-graphql**, **ide-vue** — adapters for Dockerfile, GraphQL, and Vue.
- **ide-client** — the Language Server Protocol client every adapter above plugs into.
- **symbol** — jump to a function, method, or symbol in the current editor or across the project, with **symbol-tree-sitter** answering from the active grammar and **symbol-ctags** from universal-ctags.
- **hyperclick** — follow the symbol under the pointer to its definition with a click.
- **hover** — documentation tooltips and signature help at the cursor.
- **outline-view** — a hierarchical symbol outline of the active editor.
- **intentions** — code actions and quick fixes at the cursor.
- **refactor** — rename symbols across the project.
- **code-format** — format on demand or on save through registered providers.
- **find-references** — highlight and list references to the symbol under the cursor.
- **hierarchy-view** — explore the callers, callees, supertypes and subtypes of a symbol.
- **code-lens** — actionable command links rendered above the code they describe.
- **inlay-hints** — inferred types and parameter names as inline labels.
- **semantic-tokens** — semantic highlighting layered over the grammar's own.

## Linting and formatting

- **linter** — the message hub consumed by all linter providers.
- **linter-panel** — its front end: a sortable list of every message, and a status-bar count.
- **busy-signal** — a status-bar dot that spins while packages report work in progress.
- **linter-eslint**, **linter-ruff**, **linter-todo**, **linter-sofistik** — language linters.
- **prettier** — format buffers with Prettier.

## Languages and completion

- **language-latex**, **language-typst**, **language-log**, **language-tasklist**, **language-ahkpp**, **language-sofistik** — grammars and language support.
- **language-vue**, **language-blade** — single-file components and Laravel views, each highlighting the languages embedded in it.
- **language-go**, **language-rust**, **language-java**, **language-php**, **language-ruby**, **language-perl**, **language-lua**, **language-r**, **language-csharp**, **language-coffee-script** — grammars for languages the default install does not ship.
- **language-less**, **language-sass** — Less, and Sass and SCSS.
- **language-cmake**, **language-make**, **language-dockerfile**, **language-ini**, **language-graphql** — build, container, and configuration formats.
- **autocomplete** — display possible completions while you type; the hub every provider below feeds.
- **autocomplete-css**, **autocomplete-html** — CSS property and value, and HTML element and attribute completions.
- **autocomplete-snippets** — add snippets to autocomplete suggestions.
- **autocomplete-lumine** — completions for the Lumine API.
- **autocomplete-jedi** — Python completions and go-to-definition via jedi.
- **autocomplete-paths** — complete file paths from cached project contents.
- **autocomplete-sofistik** — completions for SOFiSTiK input files.
- **latex-tools**, **typst-tools**, **sofistik-tools**, **tasklist-tools**, **bib-finder** — build, preview, and navigation tooling for those ecosystems.

## Jupyter

- **jupyter-repl** — run code against Jupyter kernels from any editor; the hub the other jupyter packages read their kernels and output rendering from.
- **jupyter-cells** — `# %%` marker cells in plain files: navigation, folding, reordering, cell runs, and `.ipynb` import/export.
- **jupyter-view** — open and edit Jupyter notebooks.
- **jupyter-inspector** — introspect the expression under the cursor.
- **jupyter-variables** — browse and edit the kernel namespace in a table.
- **jupyter-explorer** — explore dataframes, arrays, and nested objects in a searchable grid.
- **jupyter-watches** — watch expressions re-evaluated after every execution.
- **jupyter-monitor** — every running kernel in one table.
- **jupyter-prompt** — run code on the current kernel from a prompt with history.

## Scrollbar markers

- **marker** — the hub that computes each marker layer once per editor; **scrollmap** draws the layers on the vertical scrollbar and **minimap** draws the same layers over the code. The hub ships a built-in cursors layer, and every other layer comes with the package that owns the data: **git-diff**, **linter**, **bracket-matcher**, **search-panel**, **diff-view**, **highlight-selected**, **find-references**, **navigation-panel**, **jupyter-cells**. Each host exposes its layer's settings under its own `marker` group, starting with `enabled`.

## Themes

The default install ships **one-theme** alone. Each package below registers a day and a night pack, and the theme mode in **Settings** picks between them.

- **atom-theme** — the classic Atom day and night UI and syntax themes.
- **aura-theme** — a modern, brighter day and deeper night take on the One UI and syntax themes.
- **nova-theme** — the Nova day and night UI and syntax themes.
- **vscode-theme** — the VS Code day and night UI and syntax themes following the VS Code Modern look.
- **theme-selector** — preview and select registered light/dark theme packs.

## File icons

The tree view, tabs, search results, and fuzzy finders show a generic icon per file until an icon package supplies a better one. Icon packages form a chain rather than competing: each is asked in turn and any of them may decline, so more than one can be installed and each answers for the files it knows.

- **more-icons** — around 900 glyphs from the `file-icons` set, or the Seti set Visual Studio Code uses. On the Seti set it will also load an external Visual Studio Code file-icon-theme manifest, as long as that theme draws its icons with a font rather than SVG.
- **native-icons** — file icons from the operating system shell. It claims nothing until its greenlist names the files you want it for, so it layers cleanly on top of a glyph set: greenlist `*.exe, *.lnk` for the binaries a font cannot draw, or `*` to use system icons throughout.

## Desktop integration

- **native-clip** — file cut, copy and paste between the tree view and the system file manager.
- **open-in-totalcmd** — reveal paths in Total Commander.
- **terminal-spawn** — launch external terminals in project folders.
- **tree-view-favourite** — pin files and folders into sections above the project folders, where a pinned folder expands in place.
- **folder-sync**, **fast-publish** — file management helpers.

## Editor integration for AI

- **lumine-mcp** — expose editor tools over the Model Context Protocol.

## Package development

- **package-generator** — generate ready-to-edit packages, languages, and syntax themes.
