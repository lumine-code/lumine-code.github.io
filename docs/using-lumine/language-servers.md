# Language servers

Lumine's bundled **`ide-client`** package runs Language Server Protocol servers and connects them to the editor. A language server analyzes your project as you work and powers completions in the autocomplete popup, diagnostics in the linter, and document and project symbols in the symbols view — the same servers used by other editors, speaking LSP 3.17. Everything else a server offers — hover documentation, code actions, rename, formatting — is covered in [Code intelligence](code-intelligence.md).

Servers start lazily: the first time you open a file whose grammar matches a registered server, that server is launched for the file's project root and kept alive in the background. Each project root gets its own session, so diagnostics and navigation stay scoped to the project you are working in.

## Adapter packages

An adapter package tells `ide-client` how to launch a server for a language. Install one for each language you work in, for example `lumine --install lumine-code/ide-typescript` for TypeScript and JavaScript or `lumine-code/ide-pyright` for Python — or search for *ide* in the Install pane in **Settings**. Adapters resolve the server binary, pass its settings, and pick sensible defaults; their own settings pages let you point at a specific binary with **Server Path** or tune server behavior.

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

## The status bar

The status-bar item shows the server for the active editor and its state; a tooltip counts servers running in the background. Click it for the session menu: reconnect or stop the server, open its log, or jump to the problems panel. Long-running server work — indexing, analysis — is reported through the `busy-signal` package when it is installed.

## Commands

`ide-client:restart` restarts the server for the active editor. `ide-client:format` formats the active document through the server. `ide-client:toggle-problems` opens the linter panel with the server's diagnostics. `ide-client:show-log` opens the active server's log in an editor.

## Troubleshooting

Each server's output and protocol traffic is kept in a log buffer — open it with `ide-client:show-log`. The **Protocol Trace** setting raises the detail from `off` to `messages` (methods only) or `verbose` (full payloads). A crashed server is restarted automatically with increasing delays up to **Maximum Automatic Restarts**; after that, restart it from the session menu. A server that requests an unsupported position encoding is refused at startup with an explanatory error.
