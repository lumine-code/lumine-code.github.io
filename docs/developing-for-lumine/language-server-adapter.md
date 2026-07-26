# Writing a language-server adapter

An adapter package teaches the bundled `ide-client` package how to launch and configure a language server. The adapter stays small: it resolves the server binary and describes its settings, while `ide-client` owns the protocol, document synchronization, and every editor integration.

## Registering

Consume the `lumine.languageServer` service (version `1.0.0`) and register an adapter:

```json
"consumedServices": {
  "lumine.languageServer": {
    "versions": { "1.0.0": "consumeLanguageServer" }
  }
}
```

```js
module.exports = {
  consumeLanguageServer(languageServer) {
    return languageServer.registerAdapter({
      id: "ide-example",
      displayName: "Example Language Server",
      grammarScopes: ["source.example"],
      async resolveServer({ rootPath }) {
        return { command: "/absolute/path/to/example-ls", args: ["--stdio"], cwd: rootPath };
      },
    });
  },
};
```

Returning the registration disposable from the consumer method unregisters the adapter (and stops its servers) when either package deactivates.

## The adapter object

- `id`, `displayName` — unique identifier and the name shown in the status bar and notifications.
- `grammarScopes` — grammar scope names the server handles, such as `source.python`.
- `sessionScope` — `"project-root"` (default) starts one server per project root; use `"workspace"` only for servers that correctly handle multi-root workspaces.
- `resolveServer(context)` — resolves the launch: `{ command, args, cwd, env, transport }`. Commands are spawned directly with `shell: false`, so `command` must be an executable and every argument belongs in `args`. `transport` is `"stdio"` (default), `"ipc"` for forked Node scripts, or `"socket"` with `host`/`port`. The context carries `rootPath`, `projectPaths`, `configDirPath`, and a per-adapter `managedStoragePath`. Return `null` to decline (for example when the binary is missing) after telling the user what to install.
- `languageIdForScope(scopeName)` — optional per-grammar override for the LSP `languageId`; a built-in table already maps common scopes, and a blanket `languageId` remains as a last-resort fallback.
- `getInitializationOptions(context)` — optional `initializationOptions` for the handshake.
- `getSettings()` and `settingsKeyPaths` — the settings object pushed via `workspace/didChangeConfiguration` after startup, and the config key paths that re-push it when the user changes them.
- `getWorkspaceConfiguration(section, scopeUri)` — optional answers for `workspace/configuration` requests; defaults to `atom.config.get(section)`.
- `transformServerCapabilities(capabilities)` — optional hook to correct a server's advertised capabilities.

The complete shapes are documented in `ide-client`'s `lib/main.d.ts`.

## Resolving the server binary

Follow the convention of the `ide-*` adapter packages, in priority order: a `serverPath` setting always wins when set; otherwise use a server distributed as an npm dependency of the adapter (launch Node-based servers with `process.execPath` and `env: { ELECTRON_RUN_AS_NODE: "1" }`); otherwise look the binary up on `PATH` and raise one actionable notification when it is missing.

## Specs

Unit-test the resolver (the configured path wins; the bundled module resolves). For an end-to-end smoke test, gate a real-server spec on the binary being present so continuous integration stays green without the toolchain.
