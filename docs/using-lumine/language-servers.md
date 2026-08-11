# Language servers

Lumine's bundled **`ide-client`** package runs Language Server Protocol servers and connects them to the editor. A language server analyzes your project as you work and powers completions in the autocomplete popup, diagnostics in the linter, and document and project symbols in the symbols view — the same servers used by other editors, speaking LSP 3.17. Everything else a server offers — hover documentation, code actions, rename, formatting — is covered in [Code intelligence](code-intelligence.md).

Servers start lazily: the first time you open a file whose grammar matches a registered server, that server is launched for the file's project root and kept alive in the background — closing the file does not stop it, so reopening one costs nothing. A file outside every project folder gets a server for its own directory, and that one is released once the last such file is closed.

Each project root gets its own session by default, so diagnostics and navigation stay scoped to the project you are working in: two unrelated folders in one window mean two servers, each reading the `tsconfig.json` or `pyproject.toml` that actually applies to it. A server that tells us it handles multi-root workspaces is the exception — it is given the second folder to look after instead of being started again, so one process covers both. Adding or removing a project folder moves the open editors onto the right server without anything to click.

More than one server can serve the same file, which is how these tools are normally combined: a type checker and a linter each cover Python, and both run. Answers that add up are merged — completions, code actions, references, and hover documentation from every server. Where they repeat each other, the repetition is dropped: two servers opening a tooltip with the same signature line produce one signature line, followed by whatever each of them alone had to say. For the features where several answers make no sense, such as formatting or rename, the request goes to the server that supports it — and when both do, the **Features** setting below decides which.

## Adapter packages

An adapter package tells `ide-client` how to launch a server for a language. Install one for each language you work in, for example `lumine --install lumine-code/ide-typescript` for TypeScript and JavaScript, `lumine-code/ide-html` for HTML and template documents, `lumine-code/ide-yaml` for schema-aware YAML, or `lumine-code/ide-pyright` and `lumine-code/ide-ruff` for Python types and linting side by side — or search for *ide* in the Install pane in **Settings**.

Each adapter's settings page is where its server is configured. **Server Path** points at a specific binary, and the rest of the page is that server's own options in the editor's settings UI rather than in a configuration file: where Pyright looks for imports and stubs, which schemas YAML files use, how HTML attributes wrap, which fonts Tinymist loads, the formatter Texlab runs and the width it wraps at, the quote style the TypeScript server writes an import with. A setting left empty means "no opinion" and the server keeps its own default, so a project that configures itself through `pyrightconfig.json`, `ruff.toml`, or `tsconfig.json` is not overruled by a setting you never touched.

## Installing a server

Some servers ship with their adapter and work the moment it is installed — Pyright and the TypeScript server are npm packages the adapter depends on. Others are standalone binaries you would otherwise fetch yourself: ruff, texlab and tinymist are Rust programs, and without one on your PATH the adapter has nothing to run.

`ide-client:manage-servers` lists every server the editor can fetch, what is installed, and what the newest release is. Choosing one installs it, or updates it when a copy is already there; **Check for Updates** looks up every server at once. The same offer appears the moment it matters — an adapter that cannot find its server says so with an **Install** button on the notification.

Installed servers live in `language-servers/` in your configuration directory, one folder per adapter. Each download is checked against the checksum its source publishes before anything is unpacked, and a mismatch is discarded rather than installed. Texlab publishes no checksums, so its download cannot be verified; every other source can.

Which copy runs is settled in a fixed order: the **Server Path** setting if you set one, then the copy the editor installed, then whatever is on your PATH. Removing a managed copy therefore falls back rather than breaking — to the PATH binary for the Rust servers, and to the version that ships with the package for Pyright. Only what the editor installed is removed; a ruff you installed with `uv` or `brew` is never touched.

Keeping your own copy is a reasonable choice, and sometimes the right one: a project that pins `ruff` in its dev dependencies expects that exact version, and a managed copy at a different version reports different violations. Set **Server Path**, or simply do not install one.

## Features

Every adapter's settings page has a **Features** group listing what its server does — diagnostics, autocomplete, hover, signature help, go-to-definition, references, symbols, outline, formatting, rename, code actions, inlay hints, code lens, semantic tokens. Each is a switch, and only the ones that server actually implements are shown: Pyright has no formatter, and Ruff has neither completions nor navigation, so neither offers a switch for them.

Turning one off is how you choose between two servers covering one language. With Pyright and Ruff both serving Python, turning **Format** off for Pyright hands formatting to Ruff; turning **Hover** off for Ruff leaves the tooltip to the type checker alone. A switched-off feature is never requested, so it costs nothing rather than being computed and discarded — and where a server can be told to stop the work itself, it is: turning Ruff's **Diagnostics** off stops it linting, and turning Tinymist's **Semantic Tokens** off stops it classifying.

Each switch can also be set per language, the same way editor settings can. Inlay hints on for TypeScript and off for JavaScript is a scoped setting, not two packages.

## Custom servers

Any other language server can be wired up without a package. `ide-client:open-custom-servers-file` opens `language-servers.json` in your configuration directory; each entry names a command and the grammar scopes it serves:

```json
{
  "gopls": {
    "command": "gopls",
    "args": ["serve"],
    "scopes": ["source.go"],
    "settings": { "gopls": { "usePlaceholders": true } },
    "features": { "inlayHints": false }
  }
}
```

`command` and `scopes` are required. `args`, `env`, `languageId`, `sessionScope`, `transport`, `initializationOptions`, `settings`, and `features` are optional; `settings` is handed to the server as its configuration, and `features` switches individual capabilities off, as an adapter package's settings page does. Saving the file restarts exactly the servers whose entries changed.

## Seeing what is running

`ide-client:servers` lists every language server the window has started — the servers for the active editor first. Each entry names what that server covers, so a shared process is not mistaken for one of many:

- **Root** — one project folder, with its path. **Roots (2)** when one server took on several.
- **Workspace** — the whole window, listing the project folders it answers for.
- **File** — a file opened outside every project folder, named by the file rather than by the directory the server happens to be rooted at.

Choosing one offers to restart it, stop it, open its log, or jump to the problems panel.

The same list sits in the status bar: an item counting the running servers, with an alert badge when one has failed, that opens the list on click. It stays in place while nothing is running and reports zero, so its neighbours do not shift as servers come and go. Turn it off with the **Status Bar** setting. With the `busy-signal` package installed, work a server reports while it runs — indexing, analysis — spins the busy indicator instead, so long-lived servers do not churn alongside short tasks.

## Commands

`ide-client:servers` lists the running servers. `ide-client:manage-servers` lists the servers the editor can install. `ide-client:restart` restarts every server serving the active editor. `ide-client:format` formats the active document through the server. `ide-client:toggle-problems` opens the linter panel with the server's diagnostics. `ide-client:show-log` opens the active server's log in an editor.

## Troubleshooting

Each server's output and protocol traffic is kept in a log buffer — open it with `ide-client:show-log`. The **Protocol Trace** setting raises the detail from `off` to `messages` (methods only) or `verbose` (full payloads). A crashed server is restarted automatically with increasing delays up to **Maximum Automatic Restarts**. When those run out it says so, with a button that opens its log — a server that keeps dying has written the reason there and nowhere else, whether that is a crash, a missing dependency, or an option it refused. Restart it again from the session menu once the cause is dealt with. A server that requests an unsupported position encoding is refused at startup with an explanatory error.
