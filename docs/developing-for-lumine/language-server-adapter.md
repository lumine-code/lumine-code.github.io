# Writing a language-server adapter

An adapter package teaches the bundled `ide-client` package how to launch and configure a language server. The adapter stays small: it resolves the server binary and describes its settings, while `ide-client` owns the protocol, document synchronization, and every editor integration.

## Registering

Consume the `ide-client` service (version `1.0.0`) and register an adapter:

```json
"consumedServices": {
  "ide-client": {
    "versions": { "^1.0.0": "consumeIdeClient" }
  }
}
```

```js
module.exports = {
  consumeIdeClient(ideClient) {
    return ideClient.registerAdapter({
      id: "ide-example",
      displayName: "Example Language Server",
      grammarScopes: ["source.example"],
      async resolveServer({ rootPath }) {
        return {
          command: "/absolute/path/to/example-ls",
          args: ["--stdio"],
          cwd: rootPath,
        };
      },
    });
  },
};
```

Returning the registration disposable from the consumer method unregisters the adapter (and stops its servers) when either package deactivates.

## The adapter object

- `id`, `displayName` — unique identifier and the name shown in the status bar and notifications.
- `grammarScopes` — grammar scope names the server handles, such as `source.python`.
- `sessionScope` — `"project-root"` (default) gives each project root its own server; `"workspace"` gives the window a single one. Leave it at the default unless the server has no notion of a root at all: a server that genuinely handles multi-root workspaces says so in its capabilities, and the hub then shares one process across folders without being told to (see [Language servers](../using-lumine/language-servers.md)).
- `resolveServer(context)` — resolves the launch: `{ command, args, cwd, env, transport }`. Commands are spawned directly with `shell: false`, so `command` must be an executable and every argument belongs in `args`. `transport` is `"stdio"` (default), `"ipc"` for forked Node scripts, or `"socket"` with `host`/`port`. The context carries `rootPath`, `projectPaths`, `configDirPath`, and a per-adapter `managedStoragePath`. Return `null` to decline (for example when the binary is missing) after telling the user what to install.
- `languageIdForScope(scopeName)` — optional per-grammar override for the LSP `languageId`; a built-in table already maps common scopes, and a blanket `languageId` remains as a last-resort fallback.
- `getInitializationOptions(context)` — optional `initializationOptions` for the handshake.
- `getSettings()` and `settingsKeyPaths` — the settings object pushed via `workspace/didChangeConfiguration` after startup, and the config key paths that re-push it when the user changes them.
- `getWorkspaceConfiguration(section, scopeUri)` — optional answers for `workspace/configuration` requests; defaults to `lumine.config.get(section)`. Answer the sections your server asks for by name: the default is a Lumine config namespace, and for a section named after the server it does not exist, so every option would come back undefined.
- `features` — fallback feature switches, only for an adapter with no config namespace to hold them. A package declares them in its manifest instead; see below.
- `transformServerCapabilities(capabilities)` — optional hook to correct a server's advertised capabilities.

The complete shapes are documented in `ide-client`'s `lib/main.d.ts`.

## Settings

Declare the server's options in your manifest's `configSchema`, in the same shape the server receives them, so the mapping in `getSettings` stays a transcription rather than a translation. Two conventions make that mapping behave:

- An empty setting means "no opinion". Leave it out of the object you send rather than sending `""` or `[]`, so a project that configures itself through its own file is not overruled by a setting the user never touched.
- Where an option is only read at startup, subscribe to its config key and restart the running sessions. `settingsKeyPaths` re-pushes what a server re-reads; it cannot help with an initialization option.

## Feature switches

Declare a `features` object in `configSchema` naming the capabilities your server implements. `ide-client` reads `<your adapter id>.features.<name>` and refuses a switched-off feature before it asks the server, so the request goes to the next server covering that file instead. This is what lets a user choose between two servers on one language.

The vocabulary is `diagnostics`, `autocomplete`, `hover`, `signature`, `definition`, `references`, `callHierarchy`, `typeHierarchy`, `symbols`, `outline`, `format`, `rename`, `codeActions`, `inlayHints`, `codeLens`, and `semanticTokens`.

List **only what your server advertises** — read its `initialize` response rather than its documentation, since the two disagree more often than you would expect. A switch for a capability the server never had is a control that does nothing.

Where the server can be told to stop the work itself, map the switch onto its own option as well, so what the editor would discard is not computed. `ide-ruff` maps `features.diagnostics` onto Ruff's `lint.enable`, and `ide-tinymist` maps `features.semanticTokens` onto Tinymist's `semanticTokens`.

## Resolving the server binary

Follow the convention of the `ide-*` adapter packages, in priority order: a `serverPath` setting always wins when set; then a copy the editor installed, handed to you on `context.managedServer`; then a server distributed as an npm dependency of the adapter (launch Node-based servers with `process.execPath` and `env: { ELECTRON_RUN_AS_NODE: "1" }`); then the binary on `PATH`. Raise one actionable notification when nothing resolves, and return `null` rather than throwing.

## Letting the editor install the server

Declare a `managedServer` descriptor and the editor can fetch, update and remove the server, and your adapter appears in `ide-client:manage-servers`. The descriptor is data — `resolveServer` stays the only thing that decides what runs:

```js
managedServer: {
  source: "github-release",
  displayName: "Ruff",
  repository: "astral-sh/ruff",
  assetFor: ({ platform, arch }) => "ruff-x86_64-pc-windows-msvc.zip",
  checksum: "sha256-sidecar",
  binary: "ruff.exe",
}
```

`assetFor` returns an **exact file name**, never a pattern — releases often carry other archives sharing a prefix, and `null` says this platform has no build. `checksum` is stated rather than inferred, so `"none"` records a source that publishes nothing to verify against instead of a step being skipped silently. `binary` is a base name, located wherever it sits in the archive.

For a server that already ships as an npm dependency, use `source: "npm"` with `bundled: true` and keep the dependency. The pinned copy stays the floor, so the managed one is an upgrade and removing it can never leave the user with nothing. `ide-pyright` works this way; `ide-typescript` deliberately has no descriptor at all, since `typescript-language-server` already prefers the project's own TypeScript.

The full contract is in `ide-client`'s own documentation, under **Managed servers**.

### When a descriptor cannot say it

A descriptor is one server per adapter. If yours needs something else — several binaries, a release layout nobody anticipated — implement `installServer` instead and use the primitives the hub hands you. This is the model Zed's extension API uses, and the names mirror it: `latestGithubRelease`, `githubReleaseByTag`, `npmPackageLatestVersion`, `npmPackageInstalledVersion`, `npmInstallPackage`, `downloadFile`, `makeFileExecutable` and `setServerInstallationStatus`.

```js
async installServer({ storagePath, api }) {
  api.setServerInstallationStatus("downloading");
  const release = await api.latestGithubRelease("owner/tool");
  const asset = release.assets.find((a) => a.name === assetForThisPlatform());
  await api.downloadFile(asset.url, storagePath, { type: "gzip-tar" });
  await api.makeFileExecutable(`${storagePath}/tool`);
  return { version: release.version, binary: "tool" };
}
```

Fill `storagePath`, return `{ version, binary }` or `{ version, module }`, and the hub does the rest — the same staging, atomic swap, rollback, install record and session ordering as the declarative path. `ide-bash` is the fleet example: it fetches its server through npm and `shellcheck` and `shfmt` beside it.

Two caveats. `managedServer` and `installServer` are mutually exclusive, and declaring both is rejected at registration. And `downloadFile` does not verify checksums — the descriptor path does that for you, so an adapter reaching for the primitive owns its own verification.

Whichever path you take, report through `setServerInstallationStatus`. That is the only place uniformity is enforced, and it is what lets one list show every language the same way.

## Specs

Unit-test the resolver: the configured path wins, a managed install beats `PATH`, and the bundled module resolves. Assert `assetFor` returns the exact asset name for each platform you support and `null` for the rest — that is the part a release rename breaks. For an end-to-end smoke test, gate a real-server spec on the binary being present so continuous integration stays green without the toolchain.
