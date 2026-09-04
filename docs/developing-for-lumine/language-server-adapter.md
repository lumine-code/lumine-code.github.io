# Writing a language-server adapter

An adapter package teaches the minimal `ide-client` protocol hub how to launch and configure a language server. The adapter owns server discovery and server-specific settings; `ide-client` owns sessions, LSP synchronization and routing into editor services, while frontend packages own presentation.

## Registering

Consume the `ide-client` service and register one adapter:

```json
{
  "consumedServices": {
    "ide-client": {
      "versions": { "^1.0.0": "consumeIdeClient" }
    }
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

Returning the registration disposable from the consumer unregisters the adapter and stops its sessions when either package deactivates.

The canonical contract, optional hooks and service methods live in [`ide-client`'s documentation](https://github.com/lumine-code/ide-client/blob/master/docs/ide-client.md); exact TypeScript shapes live in [`lib/main.d.ts`](https://github.com/lumine-code/ide-client/blob/master/lib/main.d.ts). Keep detailed API descriptions there rather than copying them into an adapter.

## Architecture boundaries

An adapter describes one server; it does not apply `WorkspaceEdit` resource operations or depend on tree-view internals. `ide-client` validates and orders the protocol's document and resource changes, then delegates inspection plus create, rename and delete steps to the bundled, UI-less `file-operations.executor@1.0.0`. Its `prepare()` method preflights the complete virtual sequence before returning an opaque plan for stepwise execution, while its neutral lifecycle distinguishes private staging roots from durable logical effects.

User-initiated filesystem operations have a different owner. `tree-view` supplies their UI and the versioned `tree-view.file-operations` will/did boundary; `ide-client` translates that boundary to LSP file-operation requests and notifications. The executor lifecycle is infrastructure rather than a user-operation event bus, `tree-view` does not execute server-authored `WorkspaceEdit` objects, and adapters need to consume neither service directly.

## What the adapter owns

- `id`, `displayName` and `grammarScopes` identify the adapter and the editors it serves.
- `resolveServer(context)` returns `{ command, args, cwd, env, transport }` or `null` after reporting how to install a missing server. Commands run directly without a general-purpose shell, so every argument belongs in `args`; on Windows the client safely routes an explicit `.cmd` or `.bat` shim through `cmd.exe` for adapters and custom servers.
- `languageIdForScope(scopeName, {editor, filePath})`, initialization options, settings, protocol-extension hooks and document transforms are optional; use only the hooks the server needs. The editor context lets one grammar scope distinguish file variants such as `.js` and `.jsx`.
- `getInitializedNotifications({session, rootPath, rootUri})` may return `{method, params}` notifications that must follow the initial settings push, such as `css/customDataChanged`.
- Leave `sessionScope` at its default, `"project-root"`, unless the server has no root concept. Servers advertising multi-root support are shared across folders automatically.

## Settings and feature switches

Declare user options in the package's `configSchema`, in the shape the server expects. `getSettings()` supplies `workspace/didChangeConfiguration`, and `settingsKeyPaths` names changes to resend; restart sessions for options read only during initialization. Omit empty values so an untouched editor setting does not override the project's own configuration.

Put feature switches under `configSchema.features`. Declare only capabilities present in the server's `initialize` response. Client routing always enforces the switch; only disable work inside the server when doing so cannot defeat a grammar-scoped true override elsewhere in the same session. The supported feature names and resolution rules are maintained in the canonical `ide-client` contract linked above.

## Resolving and managing the server

Follow the adapter convention in priority order: an explicit `serverPath`, a copy in `context.managedServer`, a server bundled as an npm dependency, then an executable on `PATH`. Raise one actionable missing-server notification and return `null` instead of throwing.

A `managedServer` descriptor lets the editor install, update and remove a server. GitHub-release descriptors name an exact asset per platform and state their checksum policy; npm descriptors name the packages and entry module. A package entry may be a name or `{name, version}` when a companion must stay inside a compatible range — TypeScript 7, for example, cannot replace the TypeScript 6 runtime expected by the current language servers. `ide-pyright` and `ide-typescript` both use `source: "npm"` with `bundled: true`, so removing a managed upgrade falls back to the dependency shipped with the adapter.

Use `installServer` only when one descriptor cannot model the installation, such as several binaries or an unusual release layout. The hub still owns staging, atomic replacement, rollback and status reporting; the adapter owns checksum verification when it calls the low-level download primitive. `ide-bash` is the fleet example.

## Specs

Unit-test resolution order and every supported platform's exact asset name. Add a live protocol suite for the real server; a native server may be skipped locally, but CI downloads a pinned, checksum-verified binary so the suite cannot silently disappear there.
