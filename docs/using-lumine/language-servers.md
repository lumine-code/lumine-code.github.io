# Language servers

Lumine's bundled **`ide-client`** package runs Language Server Protocol servers and connects them to the editor. A language server analyzes your project as you work and powers completions in the autocomplete popup, diagnostics in the linter, and document and project symbols in the symbols view — the same servers used by other editors, speaking LSP 3.17. Everything else a server offers — hover documentation, code actions, rename, formatting — is covered in [Code intelligence](code-intelligence.md).

Servers start lazily: the first time you open a file whose grammar matches a registered server, that server is launched for the file's project root and kept alive in the background — closing the file does not stop it, so reopening one costs nothing. A file outside every project folder gets a server for its own directory, and that one is released once the last such file is closed.

Each project root gets its own session by default, so diagnostics and navigation stay scoped to the project you are working in: two unrelated folders in one window mean two servers, each reading the `tsconfig.json` or `pyproject.toml` that actually applies to it. A server that tells us it handles multi-root workspaces is the exception — it is given the second folder to look after instead of being started again, so one process covers both. Adding or removing a project folder moves the open editors onto the right server without anything to click.

More than one server can serve the same file, which is how these tools are normally combined: a type checker and a linter each cover Python, and both run. Answers that add up are merged — completions, code actions, references, and hover documentation from every server. Where they repeat each other, the repetition is dropped: two servers opening a tooltip with the same signature line produce one signature line, followed by whatever each of them alone had to say. For the features where several answers make no sense, such as formatting or rename, the request goes to the server that supports it.

## Adapter packages

An adapter package tells `ide-client` how to launch a server for a language. Install one for each language you work in, for example `lumine --install lumine-code/ide-typescript` for TypeScript and JavaScript, or `lumine-code/ide-pyright` and `lumine-code/ide-ruff` for Python types and linting side by side — or search for *ide* in the Install pane in **Settings**. Adapters resolve the server binary, pass its settings, and pick sensible defaults; their own settings pages let you point at a specific binary with **Server Path** or tune server behavior.

## Custom servers

Any other language server can be wired up without a package. `ide-client:open-custom-servers-file` opens `language-servers.json` in your configuration directory; each entry names a command and the grammar scopes it serves:

```json
{
  "gopls": {
    "command": "gopls",
    "args": ["serve"],
    "scopes": ["source.go"],
    "settings": { "gopls": { "usePlaceholders": true } }
  }
}
```

`command` and `scopes` are required. `args`, `env`, `languageId`, `sessionScope`, `transport`, `initializationOptions`, and `settings` are optional; `settings` is handed to the server as its configuration. Saving the file restarts exactly the servers whose entries changed.

## Seeing what is running

`ide-client:servers` lists every language server the window has started, with its project root and state — the servers for the active editor first. Choosing one offers to restart it, stop it, open its log, or jump to the problems panel.

The same list sits in the status bar: an item counting the running servers, with an alert badge when one has failed, that opens the list on click and hides itself while nothing is running. Turn it off with the **Status Bar** setting. With the `busy-signal` package installed, work a server reports while it runs — indexing, analysis — spins the busy indicator instead, so long-lived servers do not churn alongside short tasks.

## Commands

`ide-client:servers` lists the running servers. `ide-client:restart` restarts every server serving the active editor. `ide-client:format` formats the active document through the server. `ide-client:toggle-problems` opens the linter panel with the server's diagnostics. `ide-client:show-log` opens the active server's log in an editor.

## Troubleshooting

Each server's output and protocol traffic is kept in a log buffer — open it with `ide-client:show-log`. The **Protocol Trace** setting raises the detail from `off` to `messages` (methods only) or `verbose` (full payloads). A crashed server is restarted automatically with increasing delays up to **Maximum Automatic Restarts**; after that, restart it from the session menu. A server that requests an unsupported position encoding is refused at startup with an explanatory error.
