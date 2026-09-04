# Language servers

The optional **`ide-client`** package runs Language Server Protocol 3.17 servers and exposes their results to editor packages. It is not bundled.

## Installation

A working setup has three layers:

1. Install `ide-client`.
2. Install an adapter for each language, such as `ide-typescript`, `ide-eslint`, `ide-bash`, `ide-html`, `ide-yaml`, `ide-marksman`, `ide-pyright`, or `ide-ruff`.
3. Install the frontends you want: `autocomplete` for completions, `linter` for diagnostics, `symbol` plus a symbol provider for symbol lists, and packages from [Code intelligence](code-intelligence.md) for other features.

For example, a minimal TypeScript setup with completions and diagnostics is:

```sh
lumine --install lumine-code/ide-client
lumine --install lumine-code/ide-typescript
lumine --install lumine-code/autocomplete
lumine --install lumine-code/linter
```

Installing an adapter alone does not install or replace `ide-client`; adapters connect to it through an editor service. Each adapter's settings page contains its server path, feature switches, and server-specific options. Project configuration files such as `tsconfig.json`, `pyrightconfig.json`, and `ruff.toml` continue to apply when the corresponding editor setting is left empty.

Through `jupyter-view`, servers with notebook support — including Basedpyright and Ruff — can analyze notebook cells. The same document transforms apply to ordinary editors and cells, so IPython magics and adapter-specific source masking stay out of diagnostics without changing notebook text.

## Installing a server

Some adapters include an npm-based server; standalone servers such as Ruff, Texlab, Tinymist, and Marksman must be on `PATH`, selected with **Server Path**, or installed by Lumine. ESLint still uses the ESLint library and plugins from each project.

Run `ide-client:manage-servers` to install, update, or remove managed copies under `language-servers/` in your configuration directory. A configured **Server Path** wins, followed by the managed copy; standalone adapters then search `PATH`, while npm-based adapters fall back to the version shipped with the adapter. Removing a managed copy never removes a server installed by another tool.

The Bash adapter always runs its audited bundled server fork. Its managed install is a separately versioned, checksum-verified toolchain containing ShellCheck and shfmt, which provide diagnostics, fixes and formatting.

## Sessions

Servers start when a matching file first opens. By default each project root gets a session; a server advertising multi-root support can share one process across roots, and a file outside the project gets a temporary file session. Several servers may serve one file: mergeable results are combined, while operations such as formatting or rename use an enabled server that supports them.

## Features

Each adapter's **Features** group exposes the capabilities that can be switched off, including diagnostics, completions, navigation, formatting, rename, code actions, hints, lenses, and semantic tokens. Use these switches to choose between overlapping servers; for example, disable Ruff hover to leave it to Basedpyright. Feature settings can be scoped per language, and adapters keep the corresponding server capability available whenever any served grammar enables it.

Document diagnostics and workspace diagnostics use the same route into `linter`: open buffers update as you type, while a server that implements `workspace/diagnostic` can also report files that are not open. Install `linter-panel` to browse the combined project result.

When `tree-view` creates, moves, renames or deletes an entry, `ide-client` runs the matching LSP `will*Files` request before the filesystem operation and sends `did*Files` after it. A server such as TypeScript can update imports first; if a server refuses or cannot prepare the change, the tree operation is cancelled before the filesystem is touched.

Document links from a server open through `hyperclick`. Four built-in commands expose protocol features that do not need another frontend package: `ide-client:fold-server-ranges` folds every server range, `ide-client:expand-selection-range` grows each selection to its next structural parent, `ide-client:select-linked-ranges` selects linked occurrences, and `ide-client:color-presentation` lets you choose and apply a server-provided spelling for the color under the cursor.

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

## Inspecting and controlling servers

`ide-client:servers` lists running servers, with those serving the active editor first. A session is labeled **Root**, **Roots**, **Workspace**, or **File** according to what it covers; choose it to restart or stop it, open its log, or show its diagnostics.

The status-bar item opens the same list and reports failures; disable it with the **Status Bar** setting. With `busy-signal` installed, server progress appears in the shared busy indicator.

- `ide-client:restart` restarts every server for the active editor.
- `ide-client:format` formats the active document through a server.
- `ide-client:toggle-problems` opens `linter-panel` when it is installed.

## Troubleshooting

Open the server log with `ide-client:show-log`; set **Protocol Trace** to `messages` or `verbose` for protocol traffic. Crashed servers restart up to **Maximum Automatic Restarts**, after which the failure notification links to the log. Fix the reported cause and restart the session from `ide-client:servers`.
