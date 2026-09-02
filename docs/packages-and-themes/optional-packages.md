# Optional packages

Most optional features maintained by `lumine-code` are available from **Settings → Install** or with `lumine --install lumine-code/<name>`. This page is a short map, not a complete registry; the Install panel is authoritative, and each package card links to its README.

## Files and everyday tools

- **terminal** embeds a system shell; **pdf-view** displays PDFs; **image-editor** and **table-editor** edit images and delimited data; **archive-view** and **sqlite-view** browse archives and databases.
- **fuzzy-files** searches project files, while **fuzzy-explorer**, **project-list**, and **recent-list** search user-selected locations, saved projects, and recent projects.
- **navigation-panel**, **minimap**, **scrollmap**, **highlight-selected**, **cursor-history**, and **bookmarks** add navigation and visual context.
- **build**, **toolbar**, **log-filter**, **diff-view**, **sort-lines**, **calc-inline**, and **spell-check** add focused workflows. `spell-check` needs **linter** to display its diagnostics.

## Git and hosting

- **git-panel** manages the working tree, **github-panel** handles GitHub issues and reviews, and **git-command** offers common workflows in a searchable list.
- **git-center**, **git-blame**, and **open-repository** provide branch/worktree switching, annotations, and links to the current repository host.

## Code intelligence

- **ide-client** is the Language Server Protocol client. Adapters include **ide-typescript**, **ide-eslint**, **ide-pyright**, **ide-ruff**, **ide-bash**, **ide-css**, **ide-html**, **ide-json**, **ide-yaml**, **ide-texlab**, **ide-tinymist**, **ide-marksman**, **ide-dockerfile**, **ide-graphql**, and **ide-vue**.
- **symbol**, **hyperclick**, **hover**, **outline-view**, **intentions**, **refactor**, **find-references**, **hierarchy-view**, **code-lens**, **inlay-hints**, and **semantic-tokens** present navigation, actions, and language-server results.
- **linter** and **linter-panel** collect diagnostics; **code-format** and **prettier** format code through registered providers or Prettier.

See [Language servers](../using-lumine/language-servers.md) for how clients, providers, and user-interface packages fit together.

## Languages and completion

Search Install for `language-` packages to add grammars that are not bundled. **autocomplete** is the completion hub; providers include **autocomplete-css**, **autocomplete-html**, **autocomplete-snippets**, **autocomplete-lumine**, **autocomplete-jedi**, **autocomplete-paths**, and **autocomplete-sofistik**.

**latex-tools**, **typst-tools**, **sofistik-tools**, **tasklist-tools**, and **bib-finder** add build and navigation workflows for their respective formats.

## Jupyter

**jupyter-repl** owns kernels and output rendering. **jupyter-cells**, **jupyter-view**, **jupyter-inspector**, **jupyter-variables**, **jupyter-explorer**, **jupyter-watches**, **jupyter-monitor**, and **jupyter-prompt** add plain-file cells, notebook editing, inspection, data views, monitoring, and a command prompt.

## Themes and file icons

Lumine bundles **one-theme**. Optional day/night packs include **atom-theme**, **aura-theme**, **nova-theme**, and **vscode-theme**; **theme-selector** previews registered packs.

**more-icons** supplies glyph-based file icons, while **native-icons** can supply operating-system icons for configured filename patterns. Both participate in the same provider chain and can be installed together.

## Desktop, AI, and package development

- **native-clip**, **open-in-totalcmd**, **terminal-spawn**, **tree-view-favourite**, and **folder-sync** integrate files and folders with the desktop.
- **lumine-mcp** exposes editor tools over the Model Context Protocol.
- **package-generator** scaffolds packages, grammars, and syntax themes; **fast-publish** publishes packages through Git tags.
