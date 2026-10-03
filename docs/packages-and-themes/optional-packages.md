# Optional packages

Most optional features maintained by `lumine-code` are available from **Settings → Install** or with `lumine --install lumine-code/<name>`. This page is a short map, not a complete registry; the Install panel is authoritative, and each package card links to its README.

## Files and everyday tools

- **terminal** embeds a system shell; **pdf-view** displays PDFs; **image-editor** and **table-editor** edit images and delimited data; **archive-view** and **sqlite-view** browse archives and databases.
- **fuzzy-files** searches project files, while **fuzzy-explorer**, **project-list**, and **recent-list** search user-selected locations, saved projects, and recent projects.
- **navigation-panel**, **minimap**, **scrollmap**, **highlight-selected**, **cursor-history**, and **bookmarks** add navigation and visual context.
- **build**, **toolbar**, **log-filter**, **diff-view**, **sort-lines**, **calc-inline**, and **spell-check** add focused workflows. `spell-check` needs **linter** to display its diagnostics.

**pdf-view** uses PDF.js to render documents with text selection, search, an outline, and optional scrollmap markers. Refreshing a rebuilt PDF preserves its page, zoom, rotation, and scroll position. **latex-tools** adds SyncTeX navigation, and **latex-tools** or **typst-tools** coordinates refresh with compilation.

## Git and hosting

- **git-panel** manages the working tree, **github-panel** handles GitHub issues and reviews, and **git-command** offers common workflows in a searchable list.
- **git-center**, **git-blame**, and **open-repository** provide branch/worktree switching, annotations, and links to the current repository host.

## Code intelligence

- **ide-client** is the Language Server Protocol client. Adapters include **ide-typescript**, **ide-eslint**, **ide-pyright**, **ide-ruff**, **ide-bash**, **ide-css**, **ide-sass**, **ide-html**, **ide-json**, **ide-yaml**, **ide-texlab**, **ide-tinymist**, **ide-marksman**, **ide-dockerfile**, **ide-graphql**, **ide-vue**, **ide-sofistik**, **ide-clangd**, **ide-rust**, **ide-go**, **ide-toml**, and **ide-r**.
- **file-operations** is optional, UI-less infrastructure that inspects and preflights ordered create, rename and delete plans before executing them for protocol orchestrators such as **ide-client**.
- **symbol**, **hyperclick**, **hover**, **outline-view**, **intentions**, **refactor**, **find-references**, **hierarchy-view**, **code-lens**, **inlay-hints**, and **semantic-tokens** present navigation, actions, and language-server results.
- **jedi-tools** uses Jedi for Python definition lookup, usage searches, renaming, method overrides, and hyperclick navigation.
- **linter** and **linter-panel** collect diagnostics; **code-format** and **prettier** format code through registered providers or Prettier.

See [Language servers](../using-lumine/language-servers.md) for how clients, providers, and user-interface packages fit together.

## Languages and completion

Search Install for `language-` packages to add grammars that are not bundled. **autocomplete** is the completion hub; providers include **autocomplete-snippets**, **autocomplete-lumine**, **autocomplete-paths**, and language-server adapters through **ide-client**.

For Tree-sitter query files such as `highlights.scm`, `folds.scm`, and `indents.scm`, install [`language-tree-sitter-query`](https://github.com/lumine-code/language-tree-sitter-query). It provides syntax highlighting, folding, indentation, and query symbols. `.scm` selects this query grammar; Scheme source needs a Scheme grammar.

**autocomplete-paths** completes language-specific imports and explicit relative paths beginning with `./` or `../` (including their backslash forms). Quoted paths preserve filename punctuation, spaces, brackets and Unicode; inserted suggestions escape the enclosing quote and `${` inside backtick templates. On POSIX, `./` and `../` paths preserve literal filename backslashes, doubled in quoted insertions. Optional HTML attribute support matches decoded character references and inserts entities such as `&amp;`, `&quot;` and `&#39;`. C0 control characters, including tabs and physical line breaks in filenames, are unsupported.

Bare paths with whitespace in the filename query use literal prefix matching. An unescaped enclosing quote or a closing bracket around a bare path ends completion, and a line with several paths uses the last active one. Suggestions stay inside the current file's project root and replace the full typed path prefix.

For CSS, SCSS and Less completions, install **autocomplete**, **ide-client** and **ide-css**. HTML uses **ide-html** with the same completion hub and client; indented `.sass` files use **ide-sass**.

For SOFiSTiK CADINP, use **language-sofistik**, **ide-client** and **ide-sofistik**. **autocomplete-sofistik**, **linter-sofistik** and **sofistik-environment** are archived and removed from the install catalogue. Uninstall the older providers to avoid duplicate results; shared SOFiSTiK detection now lives in the lightweight `sofistik-env` library. See [SOFiSTiK](../using-lumine/sofistik.md) for installation, project declarations and manual calculation-diagnostics import.

**latex-tools**, **typst-tools**, **sofistik-tools**, **tasklist-tools**, and **bib-finder** add build and navigation workflows for their respective formats.

## Jupyter

**jupyter-repl** owns kernels and output rendering. **jupyter-cells**, **jupyter-view**, **jupyter-inspector**, **jupyter-variables**, **jupyter-explorer**, **jupyter-watches**, **jupyter-monitor**, and **jupyter-prompt** add plain-file cells, notebook editing, inspection, data views, monitoring, and a command prompt.

## Themes and file icons

Lumine bundles **one-theme**. Optional day/night packs include **aura-theme** and **vscode-theme**; **theme-selector** previews registered packs.

**more-icons** supplies glyph-based file icons, while **native-icons** can supply operating-system icons for configured filename patterns. Both participate in the same provider chain and can be installed together.

## Desktop, AI, and package development

- **native-clip**, **open-in-totalcmd**, **terminal-spawn**, **tree-view-favourite**, and **folder-sync** integrate files and folders with the desktop.
- **lumine-mcp** exposes editor tools over the Model Context Protocol.
- **package-generator** scaffolds packages, grammars, and syntax themes; **fast-publish** publishes packages through Git tags.
