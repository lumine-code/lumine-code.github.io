# Services

Packages extend one another through **services**: one package offers an object, another receives it. Nothing is imported across package boundaries and neither side needs the other installed — if the provider is missing, the consumer's method simply never runs.

## How it works

A provider declares what it offers in its `package.json`:

```json
"providedServices": {
  "status-bar": {
    "versions": { "1.0.0": "provideStatusBar" }
  }
}
```

A consumer declares what it wants, with a semver range:

```json
"consumedServices": {
  "status-bar": {
    "versions": { "^1.0.0": "consumeStatusBar" }
  }
}
```

Both then export the named method. The provider's returns the service object; the consumer's receives it, once per matching provider:

```js
module.exports = {
  provideStatusBar() {
    return { addLeftTile, addRightTile };
  },
};
```

```js
module.exports = {
  consumeStatusBar(service) {
    this.statusBar = service;
    return new Disposable(() => (this.statusBar = null));
  },
};
```

Return a `Disposable` from a consumer method and Lumine calls it when the provider goes away, so a package can cleanly drop a service it is no longer being offered.

Order does not matter. Lumine connects providers and consumers whichever activates first, and connects late arrivals as they load.

### Names are matched exactly

A service name is an opaque string. The `.` in `linter.provider` groups related services for a reader — it is **not** a path, so consuming `linter` does not reach a provider of `linter.provider`. Get the name exactly right or nothing happens: there is no error, no warning in the console, and no failing spec. Missing wiring is silent.

### Versions

Every service in this catalog is at `1.0.0`, and consumers should ask for `^1.0.0`. A service that changes shape incompatibly gets a new _name_, not a new major version — a renamed service is a different contract, so both sides move in the same release rather than one supporting two names.

## Naming

If you are designing a service rather than consuming one, the workspace follows a single rule.

A name is either bare or `namespace.capability`, both kebab-case:

- **Bare, your package's name**, when your package offers exactly one contract and that contract is it handing out its own thing — `status-bar`, `terminal`, `pdf-view`.
- **`namespace.capability`** when your package offers two or more contracts, or when a bare name would not say what crosses the boundary. The usual case is a hub collecting plugins: the namespace belongs to the hub even though the hub is the _consumer_, so `linter-eslint` provides `linter.provider`. The tell is who declares `providedServices` — if that is you and you are handing out your own API, go bare.
- The namespace is a **general domain rather than a package name** when more than one package could reasonably implement the contract. `icons.provider` has two providers and belongs to neither; `symbol.provider` has three. Drop a `-view`/`-panel` suffix when a real domain word remains, keep it when none does — hence `outline.provider` but `tree-view.selection`.

The method is `provide`/`consume` plus the PascalCased name, dropping a trailing `provider` segment because the verb already says it: `linter.provider` → `provideLinter`, `icons.provider` → `provideIcons`.

## Catalog

Bundled packages ship with Lumine; the rest install from the Install pane. A service with no consumer yet is a deliberate extension point, not dead code.

Each name links to its contract: what the object looks like, which fields are required, and a working example. Those documents live in the repository of the package that owns the service, so they are reviewed alongside the code they describe.

<!-- generated: catalog -->

### Editor chrome

**[`status-bar`](../services/status-bar.md)** (`1.0.0`) — The status bar's tile collection: a package adds an element to the left or right panel and receives a handle that removes it again.
<br>From `status-bar`. Used by `column-selection`, `deprecation-cop`, `editor-status`, `encoding-selector`, `git-center`, `grammar-selector`, `ide-client`, `incompatible-packages`, `line-ending-selector`, `overtype-mode`, `settings-view`, `busy-signal`, `cursor-leader`, `git-panel`, `github-panel`, `image-editor`, `invert-colors`, `jupyter-repl`, `latex-tools`, `linter`, `prettier`, `tasklist-tools`, `typst-tools`.

**[`title-bar`](../services/title-bar.md)** (`1.0.0`) — The title bar's control tile collection: a package inserts an element beside the window buttons and receives a handle that removes it.
<br>From `title-bar`. Used by `quick-layout`.

**[`tree-view.selection`](../services/tree-view.selection.md)** (`1.0.0`) — Read what is selected in the tree, find the element for a path, and scroll a path into view.
<br>From `tree-view`. Used by `fuzzy-files`, `image-paste`, `open-external`, `fast-publish`, `folder-sync`, `image-editor`, `jupyter-view`, `linter-eslint`, `linter-ruff`, `linter-todo`, `prettier`, `sofistik-tools`, `tree-view-favourites`, `windows-clip`.

**[`tree-view.roots`](../services/tree-view.roots.md)** (`1.0.0`) — Registers a virtual root section above the project folders — a list of paths the tree shows and navigates like a project, but that no project folder backs.
<br>From `tree-view`. Used by `tree-view-favourites`.

**[`project-list`](../services/project-list.md)** (`1.0.0`) — Exposes the project list manager: which project the window currently has open, and when that changes.
<br>From `project-list`. Used by `tree-view`, `window-title`.

**[`recent-list`](../services/recent-list.md)** (`1.0.0`) — Opens the recent-projects list, so a package can offer it as an action without depending on the command.
<br>From `recent-list`. Used by `tree-view`.

**[`open-external`](../services/open-external.md)** (`1.0.0`) — Opens a path in the system's default application or reveals it in the file manager, and lets a package take over either operation.
<br>From `open-external`. Used by `fuzzy-explorer`, `fuzzy-files`, `project-list`, `recent-list`, `tree-view`, `folder-sync`, `latex-tools`, `open-in-totalcmd`, `sofistik-tools`.

### Completion and grammars

**[`autocomplete.provider`](../services/autocomplete.provider.md)** (`1.0.0`) — A source of completion suggestions for the autocomplete popup: which scopes it applies to, and a `getSuggestions` function returning the candidates at a buffer position.
<br>From `autocomplete-css`, `autocomplete-html`, `autocomplete-lumine`, `autocomplete-snippets`, `ide-client`, `autocomplete-jedi`, `autocomplete-sofistik`, `jupyter-repl`. Used by `autocomplete`.

**[`autocomplete.watch-editor`](../services/autocomplete.watch-editor.md)** (`1.0.0`) — A function that turns autocompletion on for an editor autocomplete would otherwise ignore — one inside a panel, a dock, or any pane item that is not a workspace-center tab.
<br>From `autocomplete`. Used by `search-panel`, `jupyter-repl`, `jupyter-view`.

**[`snippets`](../services/snippets.md)** (`1.0.0`) — Query the loaded snippets and expand one into an editor.
<br>From `snippets`. Used by `autocomplete`, `autocomplete-snippets`, `settings-view`.

**[`hyperlink.injection`](../services/hyperlink.injection.md)** (`1.0.0`) — Lets a language grammar highlight URLs inside its own strings and comments, by injecting the hyperlink grammar at nodes it nominates.
<br>From `language-hyperlink`. Used by `language-c`, `language-css`, `language-gfm`, `language-go`, `language-html`, `language-java`, `language-javascript`, `language-json`, `language-php`, `language-python`, `language-ruby`, `language-rust`, `language-sass`, `language-shellscript`, `language-toml`, `language-typescript`, `language-yaml`, `language-latex`, `language-typst`.

**[`todo.injection`](../services/todo.injection.md)** (`1.0.0`) — Lets a language grammar highlight `TODO`-style markers inside its own comments, by injecting the todo grammar at nodes it nominates.
<br>From `language-todo`. Used by `language-c`, `language-css`, `language-go`, `language-html`, `language-java`, `language-javascript`, `language-json`, `language-php`, `language-python`, `language-ruby`, `language-rust`, `language-sass`, `language-shellscript`, `language-toml`, `language-typescript`, `language-yaml`, `language-latex`, `language-typst`.

**[`sofistik.keywords`](../services/sofistik.keywords.md)** (`1.0.0`) — Exposes the SOFiSTiK keyword database — modules, commands, parameters, and enum values — resolved for the version and language of a given file.
<br>From `language-sofistik`. Used by `autocomplete-sofistik`, `linter-sofistik`, `sofistik-tools`.

### Language servers and code intelligence

**[`ide-client`](../services/ide-client.md)** (`1.0.0`) — Registers a language server with the editor. The adapter says how to launch it and which grammars it serves; `ide-client` does the rest of LSP.
<br>From `ide-client`. Used by `call-hierarchy`, `ide-pyright`, `ide-ruff`, `ide-texlab`, `ide-tinymist`, `ide-typescript`.

**[`symbol.provider`](../services/symbol.provider.md)** (`1.0.0`) — A source of symbols — classes, functions, definitions — for one file, for the project, or for a go-to-definition lookup.
<br>From `ide-client`, `symbol-provider-ctags`, `symbol-provider-tree-sitter`. Used by `symbols-view`, `outline-view`.

**[`hover.provider`](../services/hover.provider.md)** (`1.0.0`) — Supplies the documentation shown when the pointer rests on a symbol.
<br>From `ide-client`. Used by `hover`.

**[`hover.signature-provider`](../services/hover.signature-provider.md)** (`1.0.0`) — Supplies the call signature shown while the user types arguments.
<br>From `ide-client`. Used by `hover`.

**[`outline.provider`](../services/outline.provider.md)** (`1.0.0`) — Supplies the hierarchical outline of a document — the tree of classes, functions, and sections shown in the outline panel.
<br>From `ide-client`. Used by `outline-view`.

**[`refactor.provider`](../services/refactor.provider.md)** (`1.0.0`) — Renames a symbol across the project, and optionally validates the rename before the user types the new name.
<br>From `ide-client`. Used by `refactor`.

**[`find-references.provider`](../services/find-references.provider.md)** (`1.0.0`) — Lists every occurrence of the symbol at a position.
<br>From `ide-client`. Used by `find-references`.

**[`find-references.markers`](../services/find-references.markers.md)** (`1.0.0`) — Reports which reference occurrences are currently highlighted in each editor.
<br>From `find-references`. Used by `scrollmap-references`.

**[`hyperclick.provider`](../services/hyperclick.provider.md)** (`1.0.0`) — Turns a word in the editor into something clickable: the provider is asked about a range, and answers with a callback to run if the user follows it.
<br>From `symbols-view`, `autocomplete-jedi`. No consumer yet.

**[`code-format.range`](../services/code-format.range.md)** (`1.0.0`) — Formats a selected range and returns the edits.
<br>From `ide-client`. Used by `code-format`.

**[`code-format.file`](../services/code-format.file.md)** (`1.0.0`) — Formats a whole buffer and returns the edits.
<br>From `ide-client`. Used by `code-format`.

**[`code-format.on-type`](../services/code-format.on-type.md)** (`1.0.0`) — Reformats as the user types, when a trigger character lands.
<br>From `ide-client`. Used by `code-format`.

**[`code-format.on-save`](../services/code-format.on-save.md)** (`1.0.0`) — Reformats a buffer as it is saved.
<br>From `ide-client`. Used by `code-format`.

### Linting and progress

**[`linter.provider`](../services/linter.provider.md)** (`1.0.0`) — A linter definition: which grammars it applies to, when it runs, and a `lint` function returning diagnostics for one file.
<br>From `linter-eslint`, `linter-ruff`, `linter-sofistik`, `linter-todo`. Used by `linter`.

**[`linter.registry`](../services/linter.registry.md)** (`1.0.0`) — A function that registers an "indie" linter: a package pushes messages into the linter panel whenever it likes, instead of waiting to be asked.
<br>From `linter`. Used by `ide-client`, `latex-tools`, `linter-eslint`, `linter-ruff`, `linter-sofistik`, `linter-todo`, `prettier`, `typst-tools`.

**[`linter.ui`](../services/linter.ui.md)** (`1.0.0`) — A second place to display diagnostics. The linter hands every message change to each registered UI, alongside its own panel.
<br>From `jupyter-view`, `scrollmap-linter`. Used by `linter`.

**[`linter.adapter`](../services/linter.adapter.md)** (`1.0.0`) — Teaches the linter about a pane item that is not a `TextEditor`, so a notebook or a custom editor can be linted and navigated like a file.
<br>From `jupyter-view`. Used by `linter`.

**[`intentions.list`](../services/intentions.list.md)** (`1.0.0`) — Supplies the code actions and quick fixes offered at the cursor.
<br>From `ide-client`, `linter`. Used by `intentions`.

**[`busy-signal`](../services/busy-signal.md)** (`1.0.0`) — Report work in progress on the status bar's busy indicator.
<br>From `busy-signal`. Used by `ide-client`, `linter-eslint`, `linter-ruff`, `linter-todo`, `prettier`.

### Scrollbar overview

**[`scrollmap.layer`](../services/scrollmap.layer.md)** (`1.0.0`) — A package registers a named layer of markers that scrollmap draws on the vertical scrollbar of every text editor.
<br>From `scrollmap-brackets`, `scrollmap-cursors`, `scrollmap-diff-view`, `scrollmap-git-diff`, `scrollmap-highlight`, `scrollmap-jupyter-repl`, `scrollmap-linter`, `scrollmap-navigation`, `scrollmap-references`, `scrollmap-search-panel`. Used by `scrollmap`.

**[`scrollmap.widget`](../services/scrollmap.widget.md)** (`1.0.0`) — The `Simplemap` class, so a package can draw scrollbar markers beside a pane that is not a text editor.
<br>From `scrollmap`. Used by `jupyter-view`, `pdf-view`.

### Panels

**[`search.control`](../services/search.control.md)** (`1.0.0`) — Drives the find and replace panels from another package: read the options, show or hide the panels, trigger a search, and follow the results.
<br>From `search-panel`. Used by `scrollmap-search-panel`.

**[`search.adapter`](../services/search.adapter.md)** (`1.0.0`) — Makes a pane item that is not a `TextEditor` searchable with the ordinary find panel — a notebook, a data grid, a rendered preview.
<br>From `jupyter-repl`, `jupyter-view`. Used by `search-panel`.

**[`navigation.headers`](../services/navigation.headers.md)** (`1.0.0`) — Reads the outline the navigation panel currently shows: which editor it belongs to, the flattened header list, and when it changes.
<br>From `navigation-panel`. Used by `scrollmap-navigation`.

**[`navigation.adapter`](../services/navigation.adapter.md)** (`1.0.0`) — Supplies the navigation panel's outline for a pane item that is not a text document — a PDF's bookmarks, a notebook's cells, the images in a folder.
<br>From `image-editor`, `jupyter-view`, `pdf-view`. Used by `navigation-panel`.

### Editors and viewers

**[`pdf-view`](../services/pdf-view.md)** (`1.0.0`) — Drives PDF viewers from another package: observe them, open one, look one up, scroll it to a named destination, or swap its file.
<br>From `pdf-view`. Used by `invert-colors`, `sofistik-tools`.

**[`image-editor`](../services/image-editor.md)** (`1.0.0`) — Opens an image from a data URL, without writing it to disk first.
<br>From `image-editor`. Used by `jupyter-repl`.

**[`diff-view`](../services/diff-view.md)** (`1.0.0`) — Reports the current diff: its chunks, the two editors being compared, and which side is coloured as added.
<br>From `diff-view`. Used by `scrollmap-diff-view`.

**[`bookmarks`](../services/bookmarks.md)** (`1.0.0`) — Reads the bookmarks set in an editor, as live markers.
<br>From `bookmarks`. No consumer yet.

**[`bracket-matcher`](../services/bracket-matcher.md)** (`1.0.0`) — Reports which bracket pair is currently highlighted, and when that changes.
<br>From `bracket-matcher`. Used by `scrollmap-brackets`.

**[`highlight-selected`](../services/highlight-selected.md)** (`1.0.0`) — Reports which occurrences of the current selection are highlighted, and when that set changes.
<br>From `highlight-selected`. Used by `scrollmap-highlight`.

### Jupyter

**[`jupyter.kernel`](../services/jupyter.kernel.md)** (`1.0.0`) — Reads the running Jupyter kernel: which one is active, when that changes, and the range of the cell at the cursor.
<br>From `jupyter-repl`. No consumer yet.

**[`jupyter.breakpoints`](../services/jupyter.breakpoints.md)** (`1.0.0`) — Reports where the cell boundaries are in an editor, so another package can draw or reason about them.
<br>From `jupyter-repl`. Used by `scrollmap-jupyter-repl`.

**[`jupyter.adapter`](../services/jupyter.adapter.md)** (`1.0.0`) — Lets the REPL run cells in something that is not a text editor, by describing that item's cells as run targets.
<br>From `jupyter-view`. Used by `jupyter-repl`.

**[`jupyter.notebook`](../services/jupyter.notebook.md)** (`1.0.0`) — Exposes the open notebook documents and the active one, for packages that need notebook-aware behavior.
<br>From `jupyter-view`. No consumer yet.

### Tools and integrations

**[`terminal`](../services/terminal.md)** (`1.0.0`) — Opens a terminal, or runs commands in one.
<br>From `terminal`. Used by `jupyter-repl`.

**[`terminal-spawn`](../services/terminal-spawn.md)** (`1.0.0`) — Opens the user's external terminal application at a directory, optionally with a command already run.
<br>From `terminal-spawn`. Used by `jupyter-repl`.

**[`latex-tools`](../services/latex-tools.md)** (`1.0.0`) — Drives LaTeX compilation from another package: start and interrupt builds, read their status, follow build events, and resolve SyncTeX positions.
<br>From `latex-tools`. Used by `pdf-view`.

**[`typst-tools`](../services/typst-tools.md)** (`1.0.0`) — Drives Typst compilation from another package: start and interrupt builds, read their status, and follow build events.
<br>From `typst-tools`. Used by `pdf-view`.

**[`windows-clip`](../services/windows-clip.md)** (`1.0.0`) — Native Windows clipboard access for file paths, including the copy/cut distinction that Explorer uses.
<br>From `windows-clip`. Used by `fuzzy-files`.

**[`autosave`](../services/autosave.md)** (`1.0.0`) — Registers a veto: a predicate that stops autosave from writing a particular pane item.
<br>From `autosave`. No consumer yet.

**[`git-panel`](../services/git-panel.md)** (`1.0.0`) — Gives a forge package access to the repository model, the diff pipeline, and the Git panel's active-repository context.
<br>From `git-panel`. Used by `github-panel`.

**[`mcp.bridge`](../services/mcp.bridge.md)** (`1.0.0`) — Reports the MCP bridge's state: whether it is running, on which port, and where its server script lives.
<br>From `lumine-mcp`. No consumer yet.

**[`mcp.tools`](../services/mcp.tools.md)** (`1.0.0`) — Publishes tools to a connected MCP host, so an assistant can query or act on what a package knows.
<br>From `linter`. Used by `lumine-mcp`.

**[`fuzzy-files.score-modifier`](../services/fuzzy-files.score-modifier.md)** (`1.0.0`) — Adjusts how the file finder ranks its results, so a package can push the files it knows are relevant to the top.
<br>From `fuzzy-files`. No consumer yet.

**[`claude-chat`](../services/claude-chat.md)** (`1.0.0`) — _Not documented yet._
<br>Provided by a package outside this workspace. Used by `fuzzy-explorer`, `fuzzy-files`, `image-editor`, `jupyter-repl`.

### Core extension points

**[`icons.provider`](../services/icons.provider.md)** (`1.0.0`) — Answers what icon a thing should have. The thing may be a file path, a semantic name, a symbol kind, or a pane item, and the answer may be glyph classes, an image, inline SVG, or a letter.
<br>From `more-icons`, `native-icons`. Used by `src/icon-registry.js:287`.

**[`project.directory-provider`](../services/project.directory-provider.md)** (`1.0.0`) — Supplies a custom `Directory` for a project path, so a project folder can be backed by something other than the local filesystem.
<br>Provided by a package outside this workspace. Used by `src/project.js:712`.

**[`project.repository-provider`](../services/project.repository-provider.md)** (`1.0.0`) — Supplies a `Repository` for a project directory, so a version-control system other than Git can drive the editor's VCS features.
<br>Provided by a package outside this workspace. Used by `src/project.js:719`.

**[`repositories.operations-provider`](../services/repositories.operations-provider.md)** (`1.0.0`) — Supplies the _write_ half of version control: commit, stage, branch, clone, and raw Git transport, on top of the read-only repository model.
<br>Provided by a package outside this workspace. Used by `src/repository-registry.js:92`.

**[`workspace.search-provider`](../services/workspace.search-provider.md)** (`1.0.0`) — Replaces the built-in project search for directories a package understands better than ripgrep can.
<br>Provided by a package outside this workspace. Used by `src/workspace.js:530`.

<!-- /generated: catalog -->
