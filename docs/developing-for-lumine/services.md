# Services

Packages extend one another through **services**: one package offers an object, another receives it. Nothing is imported across package boundaries and neither side needs the other installed — if the provider is missing, the consumer's method simply never runs.

## How it works

A provider declares what it offers in its `package.json`:

```json
"providedServices": {
  "icons.class": {
    "versions": { "1.0.0": "provideIconsClass" }
  }
}
```

A consumer declares what it wants, with a semver range:

```json
"consumedServices": {
  "icons.class": {
    "versions": { "^1.0.0": "consumeIconsClass" }
  }
}
```

Both then export the named method. The provider's returns the service object; the consumer's receives it, once per matching provider:

```js
module.exports = {
  provideIconsClass() {
    return { iconClassForPath, onDidChange };
  },
};
```

```js
module.exports = {
  consumeIconsClass(service) {
    this.icons = service;
    return new Disposable(() => (this.icons = null));
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
- The namespace is a **general domain rather than a package name** when more than one package could reasonably implement the contract. `icons.class` has two providers and belongs to neither; `symbol.provider` has three. Drop a `-view`/`-panel` suffix when a real domain word remains, keep it when none does — hence `outline.provider` but `tree-view.selection`.

The method is `provide`/`consume` plus the PascalCased name, dropping a trailing `provider` segment because the verb already says it: `linter.provider` → `provideLinter`, `icons.class` → `consumeIconsClass`.

## Catalog

Bundled packages ship with Lumine; the rest install from the Install pane. A service with no consumer yet is a deliberate extension point, not dead code.

### Editor chrome

**`status-bar`** (`1.0.0`) — provided to host indicator tiles at the bottom of the workspace, with a left and right side other packages can add to.
<br>From `status-bar`. Used by `column-selection`, `deprecation-cop`, `editor-status`, `encoding-selector`, `git-switcher`, `grammar-selector`, `incompatible-packages`, `line-ending-selector`, `overtype-mode`, `settings-view`, `busy-signal`, `cursor-leader`, `git-panel`, `github-panel`, `image-editor`, `invert-colors`, `jupyter-repl`, `latex-tools`, `linter`, `prettier`, `tasklist-tools`, `typst-tools`.

**`title-bar`** (`1.0.0`) — provided to let other packages add control tiles to the title bar near the window buttons.
<br>From `title-bar`. Used by `quick-layout`.

**`tree-view.selection`** (`1.0.0`) — provided to add reveal and navigation support on top of the base tree view API.
<br>From `tree-view`. Used by `fuzzy-files`, `image-paste`, `open-external`, `fast-publish`, `folder-sync`, `image-editor`, `jupyter-view`, `linter-eslint`, `linter-ruff`, `linter-todo`, `prettier`, `sofistik-tools`, `tree-view-favourites`, `windows-clip`.

**`tree-view.roots`** (`1.0.0`) — provided to let external packages register virtual root sections above the project folders.
<br>From `tree-view`. Used by `tree-view-favourites`.

**`project-list`** (`1.0.0`) — provided to expose the project list manager — used by tree-view's empty project view to show a "List projects" button, and by window-title to resolve the current project title via `getCurrentProject()` / `onDidChangeCurrentProject()`.
<br>From `project-list`. Used by `tree-view`, `window-title`.

**`recent-list`** (`1.0.0`) — provided to expose the recent projects list manager so other packages can open the list without depending on the toggle command.
<br>From `recent-list`. Used by `tree-view`.

**`open-external`** (`1.0.0`) — provided to open or reveal paths and register custom handlers for those operations.
<br>From `open-external`. Used by `fuzzy-explorer`, `fuzzy-files`, `project-list`, `recent-list`, `tree-view`, `folder-sync`, `latex-tools`, `open-in-totalcmd`, `sofistik-tools`.

### File icons

**`icons.class`** (`1.0.0`) — provided to icon consumers (tree view, tabs, search panel, fuzzy finders, archive view); exposes `iconClassForPath(filePath)` returning an array of CSS class names, and `onDidChange(callback)` which fires when the set or the interface theme changes.
<br>From `more-icons`, `native-icons`. Used by `archive-view`, `fuzzy-explorer`, `fuzzy-files`, `search-panel`, `tabs`, `tree-view`, `bib-finder`.

**`icons.element`** (`1.0.0`) — provided to packages that iconize their own DOM elements in service mode; exposes `addIconToElement(element, filePath, options)` which attaches a native icon and returns a `Disposable` that removes it.
<br>From `native-icons`. Used by `archive-view`, `search-panel`, `tabs`, `tree-view`.

### Completion and grammars

**`autocomplete.provider`** (`1.0.0`) — provided to supply CSS property and value suggestions to autocomplete.
<br>From `autocomplete-css`, `autocomplete-html`, `autocomplete-lumine`, `autocomplete-snippets`, `ide-client`, `autocomplete-jedi`, `autocomplete-sofistik`, `jupyter-repl`. Used by `autocomplete`.

**`autocomplete.watch-editor`** (`1.0.0`) — provided to let other packages register an editor to be watched for autocompletion along with the set of providers to use for it.
<br>From `autocomplete`. Used by `search-panel`, `jupyter-repl`, `jupyter-view`.

**`snippets`** (`1.0.0`) — provided to expose the loaded snippets so other packages can query and expand them.
<br>From `snippets`. Used by `autocomplete`, `autocomplete-snippets`, `settings-view`.

**`hyperlink.injection`** (`1.0.0`) — provided to let other language packages highlight URLs inside their strings and comments as clickable links.
<br>From `language-hyperlink`. Used by `language-c`, `language-css`, `language-gfm`, `language-go`, `language-html`, `language-java`, `language-javascript`, `language-json`, `language-php`, `language-python`, `language-ruby`, `language-rust`, `language-sass`, `language-shellscript`, `language-toml`, `language-typescript`, `language-yaml`, `language-latex`, `language-typst`.

**`todo.injection`** (`1.0.0`) — provided to highlight `TODO`-style markers inside other languages' comments.
<br>From `language-todo`. Used by `language-c`, `language-css`, `language-go`, `language-html`, `language-java`, `language-javascript`, `language-json`, `language-php`, `language-python`, `language-ruby`, `language-rust`, `language-sass`, `language-shellscript`, `language-toml`, `language-typescript`, `language-yaml`, `language-latex`, `language-typst`.

**`sofistik.keywords`** (`1.0.0`) — provided to expose SOFiSTiK keyword data — modules, commands, parameters and enum values — resolved per version and language. Consumers call `service.provider.withContext(editor)` to get a context-bound provider with methods such as `getKeywords()`, `getModuleNames()`, `getModuleCommands()`, `searchKeyword()` and `validateKeyword()`.
<br>From `language-sofistik`. Used by `autocomplete-sofistik`, `linter-sofistik`, `sofistik-tools`.

### Language servers and code intelligence

**`ide-client`** (`1.0.0`) — provided to adapter packages to register language servers and reach sessions.
<br>From `ide-client`. Used by `call-hierarchy`, `ide-pyright`, `ide-ruff`, `ide-texlab`, `ide-tinymist`, `ide-typescript`.

**`symbol.provider`** (`1.0.0`) — provided to symbols-view to serve document and project symbols.
<br>From `ide-client`, `symbol-provider-ctags`, `symbol-provider-tree-sitter`. Used by `symbols-view`, `outline-view`.

**`hover.provider`** (`1.0.0`) — provided to hover UIs to serve documentation at a buffer position.
<br>From `ide-client`. Used by `hover`.

**`hover.signature-provider`** (`1.0.0`) — provided to signature-help UIs to serve call signatures while typing.
<br>From `ide-client`. Used by `hover`.

**`outline.provider`** (`1.0.0`) — provided to outline UIs to serve the hierarchical document outline.
<br>From `ide-client`. Used by `outline-view`.

**`refactor.provider`** (`1.0.0`) — provided to rename UIs; resolves to a path-to-edits map, with prepare support.
<br>From `ide-client`. Used by `refactor`.

**`find-references.provider`** (`1.0.0`) — provided to reference UIs to list occurrences of the symbol at a position.
<br>From `ide-client`. Used by `find-references`.

**`find-references.markers`** (`1.0.0`) — provided to report the reference occurrence markers currently highlighted in each editor, e.g. to the scrollmap-references layer.
<br>From `find-references`. Used by `scrollmap-references`.

**`hyperclick.provider`** (`1.0.0`) — provided to let you follow a symbol to its declaration with a click.
<br>From `symbols-view`, `autocomplete-jedi`. No consumer yet.

**`code-format.range`** (`1.0.0`) — provided to formatting orchestrators; resolves a selected range to text edits from the server.
<br>From `ide-client`. Used by `code-format`.

**`code-format.file`** (`1.0.0`) — provided to formatting orchestrators; resolves a whole file to text edits from the server.
<br>From `ide-client`. Used by `code-format`.

**`code-format.on-type`** (`1.0.0`) — provided to formatting orchestrators; resolves text edits as the user types a trigger character.
<br>From `ide-client`. Used by `code-format`.

**`code-format.on-save`** (`1.0.0`) — provided to formatting orchestrators; resolves text edits on save.
<br>From `ide-client`. Used by `code-format`.

### Linting and progress

**`linter.provider`** (`1.0.0`) — provided to the linter package; exposes the ESLint file linter with its name, grammar scopes and `lint` function.
<br>From `linter-eslint`, `linter-ruff`, `linter-sofistik`, `linter-todo`. Used by `linter`.

**`linter.registry`** (`1.0.0`) — provided to let packages push messages directly without implementing a full linter provider.
<br>From `linter`. Used by `ide-client`, `latex-tools`, `linter-eslint`, `linter-ruff`, `linter-sofistik`, `linter-todo`, `prettier`, `typst-tools`.

**`linter.ui`** (`1.0.0`) — provided to receive linter message updates so notebook scrollmap markers stay in sync with diagnostics.
<br>From `jupyter-view`, `scrollmap-linter`. Used by `linter`.

**`linter.adapter`** (`1.0.0`) — provided to map linter diagnostics from the backing editor onto the visible notebook cells.
<br>From `jupyter-view`. Used by `linter`.

**`intentions.list`** (`1.0.0`) — provided to the intentions UI to serve code actions and quick fixes at the cursor.
<br>From `ide-client`, `linter`. Used by `intentions`.

**`busy-signal.registry`** (`1.0.0`) — provided to let other packages show busy messages through a low-level provider registry with `add`/`remove`/`clear` control.
<br>From `busy-signal`. Used by `ide-client`.

**`busy-signal.background-registry`** (`1.0.0`) — provided to let other packages register long-running background processes through a provider registry with `set`/`remove`/`clear` control.
<br>From `busy-signal`. Used by `ide-client`.

**`busy-signal.reporter`** (`1.0.0`) — provided to let other packages report busy states with an async-friendly `reportBusy`/`reportBusyWhile` API.
<br>From `busy-signal`. Used by `linter-eslint`, `linter-ruff`, `linter-todo`, `prettier`.

### Scrollbar overview

**`scrollmap.layer`** (`1.0.0`) — provided to render matching bracket markers as a layer on the editor scrollbar.
<br>From `scrollmap-brackets`, `scrollmap-cursors`, `scrollmap-diff-view`, `scrollmap-git-diff`, `scrollmap-highlight`, `scrollmap-jupyter-repl`, `scrollmap-linter`, `scrollmap-navigation`, `scrollmap-references`, `scrollmap-search-panel`. Used by `scrollmap`.

**`scrollmap.widget`** (`1.0.0`) — provided to expose a standalone scrollbar-marker widget class for non-editor panes.
<br>From `scrollmap`. Used by `jupyter-view`, `pdf-view`.

### Panels

**`search.control`** (`1.0.0`) — provided to expose find options, panel visibility controls, and programmatic search triggers.
<br>From `search-panel`. Used by `scrollmap-search-panel`.

**`search.adapter`** (`1.0.0`) — provided to let the search-panel package search the active Data Explorer grid.
<br>From `jupyter-repl`, `jupyter-view`. Used by `search-panel`.

**`navigation.headers`** (`1.0.0`) — provided to let other packages read the current outline — exposes `getEditor()`, `getFlattenHeaders()`, `onDidUpdateHeaders(callback)`, and `observeHeaders(callback)`.
<br>From `navigation-panel`. Used by `scrollmap-navigation`.

**`navigation.adapter`** (`1.0.0`) — provided to [navigation-panel](https://github.com/lumine-code/navigation-panel) to list all images of the current folder; clicking an entry loads that image in the same editor.
<br>From `image-editor`, `jupyter-view`, `pdf-view`. Used by `navigation-panel`.

### Editors and viewers

**`pdf-view`** (`1.0.0`) — provided to let other packages manage PDF viewers programmatically — observe viewer instances, open PDFs in a split, look them up by path or tag, scroll to named destinations, and swap a viewer's file.
<br>From `pdf-view`. Used by `invert-colors`, `sofistik-tools`.

**`image-editor`** (`1.0.0`) — provided to let other packages open images from data URLs without saving to disk — exposes `openFromDataUrl(dataUrl, title)`.
<br>From `image-editor`. Used by `jupyter-repl`.

**`diff-view`** (`1.0.0`) — provided to scrollbar-marker consumers — exposes `getDiffView()` with the current diff chunks and editors, plus an `onDidUpdate(callback)` subscription.
<br>From `diff-view`. Used by `scrollmap-diff-view`.

**`minimap`** (`1.0.0`) — provided to expose the minimap API — other packages can observe minimaps, decorate markers, and register minimap plugins.
<br>From `minimap`. No consumer yet.

**`bookmarks`** (`1.0.0`) — provided to expose the list of bookmarks to any package that wants to know about them.
<br>From `bookmarks`. No consumer yet.

**`bracket-matcher`** (`1.0.0`) — provided to expose the current match — `getMatchRanges(editor)` returns the highlighted bracket pair's buffer ranges, and `observe(callback)` reports every match change, enabling consumers such as scrollbar maps to display bracket positions.
<br>From `bracket-matcher`. Used by `scrollmap-brackets`.

**`highlight-selected`** (`1.0.0`) — provided to expose the selection manager — other packages can observe marker events via `onDidFinishAddingMarkers` / `onDidRemoveAllMarkers` and read the per-editor marker layers.
<br>From `highlight-selected`. Used by `scrollmap-highlight`.

### Jupyter

**`jupyter.kernel`** (`1.0.0`) — provided to let other packages execute code, request completions and introspection, and follow kernel state.
<br>From `jupyter-repl`. No consumer yet.

**`jupyter.breakpoints`** (`1.0.0`) — provided to expose breakpoint state to integrations that inspect or render breakpoints.
<br>From `jupyter-repl`. Used by `scrollmap-jupyter-repl`.

**`jupyter.adapter`** (`1.0.0`) — provided to let [jupyter-repl](https://github.com/lumine-code/jupyter-repl) execute notebook cells with its normal run commands, routing kernel output, execution counts, focus, and navigation back into the notebook.
<br>From `jupyter-view`. Used by `jupyter-repl`.

**`jupyter.notebook`** (`1.0.0`) — provided to expose notebook documents and the active notebook item to packages that need notebook-aware behavior.
<br>From `jupyter-view`. No consumer yet.

### Tools and integrations

**`terminal`** (`1.0.0`) — provided to let other packages open terminals and run commands in them.
<br>From `terminal`. Used by `jupyter-repl`.

**`terminal-spawn`** (`1.0.0`) — provided to packages that need an external terminal; exposes `open(dirpath, command)` which spawns the user-configured terminal at `dirpath`. If `command` is given, the terminal opens with that command pre-executed (using the `Terminal command with arguments` template). If `dirpath` is falsy, falls back to the active project root; if it points to a file, its parent directory is used.
<br>From `terminal-spawn`. Used by `jupyter-repl`.

**`latex-tools`** (`1.0.0`) — provided to let other packages drive LaTeX compilation — subscribe to build events (`onDidStartBuild`, `onDidFinishBuild`, `onDidFailBuild`, `onDidChangeBuildStatus`), query status (`getStatus`, `isBuilding`), control builds (`compile`, `interrupt`, `interruptAll`), and resolve SyncTeX positions (`syncToPdf`, `syncToSource`).
<br>From `latex-tools`. Used by `pdf-view`.

**`typst-tools`** (`1.0.0`) — provided to let other packages drive Typst compilation — subscribe to build events (`onDidStartBuild`, `onDidFinishBuild`, `onDidFailBuild`, `onDidChangeBuildStatus`), query status (`getStatus`, `isBuilding`), and control builds (`compile`, `interrupt`, `interruptAll`, `toggleCompileOnSave`).
<br>From `typst-tools`. Used by `pdf-view`.

**`windows-clip`** (`1.0.0`) — provided to expose native Windows clipboard access — `readFilePaths()`, `readDropEffect()`, `writeFilePaths(paths, dropEffect)`, `clear()`, and the `DROP_EFFECT_*` constants.
<br>From `windows-clip`. Used by `fuzzy-files`.

**`autosave`** (`1.0.0`) — provided to expose a `dontSaveIf` callback so other packages can exclude specific pane items from being autosaved.
<br>From `autosave`. No consumer yet.

**`git-panel`** (`1.0.0`) — provided to give forge packages access to the repository model, its diffs, and its remotes.
<br>From `git-panel`. Used by `github-panel`.

**`mcp.bridge`** (`1.0.0`) — provided to other packages to read the MCP bridge state: port, running status, and server script path.
<br>From `lumine-mcp`. No consumer yet.

**`mcp.tools`** (`1.0.0`) — provided to expose `GetLinterMessages`, a read-only diagnostics tool, to a connected MCP host.
<br>From `linter`. Used by `lumine-mcp`.

**`fuzzy-files.score-modifier`** (`1.0.0`) — provided to let other packages register functions that boost or penalize the score of search results.
<br>From `fuzzy-files`. No consumer yet.

**`claude-chat`** (`^1.0.0`) — provided to attach a file, image, or code selection to a chat conversation.
<br>From a package outside this catalog. Used by `fuzzy-explorer`, `fuzzy-files`, `image-editor`, `jupyter-repl`.
