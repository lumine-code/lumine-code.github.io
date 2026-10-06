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
      restartKeyPaths: ["ide-example.serverPath"],
      async resolveServer(context) {
        const selected = await context.resolver.select({
          configuredPath: lumine.config.get("ide-example.serverPath"),
          managedPath: context.managedServer?.binaryPath,
          managedVersion: context.managedServer?.version,
          kind: "executable",
          names: ["example-ls"],
          signal: context.signal,
        });
        if (!selected) {
          ideClient.reportMissingServer("ide-example", {
            description: "Install Example Language Server or choose its Server Path.",
          });
          return null;
        }
        return context.resolver.launch(selected, {
          args: ["--stdio"],
          cwd: context.rootPath,
          signal: context.signal,
        });
      },
    });
  },
};
```

Returning the registration disposable from the consumer unregisters the adapter and stops its sessions when either package deactivates.

The canonical contract, optional hooks and service methods live in [`ide-client`'s documentation](https://github.com/lumine-code/ide-client/blob/master/docs/ide-client.md); exact TypeScript shapes live in [`lib/main.d.ts`](https://github.com/lumine-code/ide-client/blob/master/lib/main.d.ts). Keep detailed API descriptions there rather than copying them into an adapter.

Language-server hover responses reach [`context-help.provider`](https://github.com/lumine-code/documentation-view/blob/master/docs/context-help.provider.md) through `ide-client`. `documentation-view` aggregates and renders them for its persistent dock and for `hover` tooltips; adapters do not need separate panel or hover providers. Signature help continues through the separate `hover.signature-provider` service.

## Architecture boundaries

An adapter describes one server; it does not apply `WorkspaceEdit` resource operations or depend on tree-view internals. When the optional, UI-less `file-operations` package is installed, `ide-client` delegates inspection plus create, rename and delete steps to `file-operations.executor@1.0.0`. Its `prepare()` method preflights the complete virtual sequence before returning an opaque plan for stepwise execution, while its neutral lifecycle distinguishes private staging roots from durable logical effects.

User-initiated filesystem operations have a different owner. `tree-view` supplies their UI and the versioned `tree-view.file-operations` will/did boundary; `ide-client` translates that boundary to supported LSP file-operation requests and notifications. Ordinary renames and moves emit completion notifications without server preparation; `workspace/willRenameFiles` is requested only when the user explicitly chooses reference updates. Create and delete operations still request supported preparation before mutation. The executor lifecycle is infrastructure rather than a user-operation event bus, `tree-view` does not execute server-authored `WorkspaceEdit` objects, and adapters need to consume neither service directly.

File-operation preparation requests carry a cancellation signal and share a configurable deadline, 30 seconds by default. Adapter request hooks should honor that signal. The client discards cancelled or expired responses and stages returned edits until the tree operation's guards accept; asynchronous preflight checks the live operation and document snapshots again before mutating text.

## What the adapter owns

- `id`, `displayName` and `grammarScopes` identify the adapter and the editors it serves.
- `resolveServer(context)` returns a validated launch or `null` after reporting how to install a missing server. Use `context.resolver` for path selection and launch construction, and put every command argument in `args`. Native selection rejects Windows `.cmd` and `.bat` wrappers by default; an adapter deliberately handling a wrapper opts into `allowShellWrapper`, while custom-server commands retain the client's explicit Windows wrapper route.
- `languageIdForScope(scopeName, {editor, filePath})`, initialization options, settings, protocol-extension hooks and document transforms are optional; use only the hooks the server needs. The editor context lets one grammar scope distinguish file variants such as `.js` and `.jsx`.
- `getInitializedNotifications({session, rootPath, rootUri})` may return `{method, params}` notifications that must follow the initial settings push, such as `css/customDataChanged`.
- Leave `sessionScope` at its default, `"project-root"`, unless the server has no root concept. Servers advertising multi-root support are shared across folders automatically.

## Settings and feature switches

Declare user options in the package's `configSchema`, in the shape the server expects. `getSettings(context)` supplies `workspace/didChangeConfiguration`, and `settingsKeyPaths` names changes to resend. Put settings read during server resolution or initialization in `restartKeyPaths`; the client prepares a replacement before stopping a healthy server. Omit empty values so an untouched editor setting does not override the project's own configuration.

Configuration hooks receive the current `{rootPath, rootUri, launch, resolver, session?}`. Keep launch-dependent settings against that exact `launch` object so concurrent projects and replacement sessions retain their own runtime and tool paths. The shared resolver is also available through `api.resolver` in installation and version hooks and `ideClient.getServerResolver()` outside startup.

Put feature switches under `configSchema.features`. Declare only capabilities present in the server's `initialize` response. Client routing always enforces the switch; only disable work inside the server when doing so cannot defeat a grammar-scoped true override elsewhere in the same session. The supported feature names and resolution rules are maintained in the canonical `ide-client` contract linked above.

## Resolving and managing the server

The shared resolver applies one priority order: the explicit `configuredPath`, `managedPath` from `context.managedServer`, a lazy `bundledPath`, then discovered candidates and command `names` on PATH. All selected paths are absolute and validated before launch. A configured, managed or bundled failure rejects with its cause; discovery skips unusable candidates and tries the next one. Call `reportMissingServer()` and return `null` when selection finds no server, and preserve errors from broken selected installations so the user can repair the intended copy.

Keep SDK and server-specific checks in `select`'s `validate(path, {source, signal})` callback. Return probe results as `selection.data` to reuse them when building arguments and environment overrides. The selection also records its `source`; a managed version belongs only to a managed selection. Java JARs and distributions can be selected as `"file"` or `"directory"` and launched through a separately validated runtime.

Select a JavaScript entry with `kind: "node"` and use `launch`, or call `nodeEntry` directly. Those helpers enforce `ELECTRON_RUN_AS_NODE=1` for the editor executable; IPC launches use the entry as the client's fork target. Use `configuredKind: "auto"` when an explicit server path may name either a native executable or a `.js`, `.cjs` or `.mjs` entry. Server payloads and SDK probes remain owned by the adapter; shared resolver code is supplied through the service rather than imported from another package's runtime.

The startup context carries a cancellation signal, and its resolver is guarded by that attempt's lifetime. Forward the callback's signal to subprocesses and asynchronous probes. Cancelling or superseding startup settles pending helper waits and prevents retained helpers from constructing a stale launch; adapter-owned work still needs to honor the signal itself.

A `managedServer` descriptor lets the editor install, update and remove a server. GitHub-release descriptors name an exact asset per platform and state their checksum policy; npm descriptors name the packages and entry module. A package entry may be a name or `{name, version}` when a companion must stay inside a compatible range — TypeScript 7, for example, cannot replace the TypeScript 6 runtime expected by the current language servers. `ide-basedpyright` and `ide-typescript` both use `source: "npm"` with `bundled: true`, so removing a managed upgrade falls back to the dependency shipped with the adapter.

Use `installServer` only when one descriptor cannot model the installation, such as several binaries or an unusual release layout. The hub still owns staging, atomic replacement, rollback and status reporting; the adapter owns checksum verification when it calls the low-level download primitive. `ide-bash` is the fleet example.

Custom install hooks receive `{storagePath, version, api, adapter, signal}`. The same cancellation signal is available as `api.signal`, and all API helpers use it. Forward it to the adapter's own subprocesses, downloads and probes, and check it before direct writes. Cancellation expires retained resolver, download and status capabilities; `setServerInstallationStatus` throws `AbortError` after its operation ends.

Install, update and uninstall operations for one adapter are serialized, with an installation lease coordinating editor windows. Other adapters remain independent. A hook that ignores cancellation keeps its private staging and lease until it settles; its late result cannot replace the selected installation. The hub validates the staged record and payload before stopping sessions, preserves the existing installation when stopping fails, and recovers only interrupted swaps with established ownership. Preserve corruption and missing-payload errors so users can repair or remove a damaged managed installation.

## Specs

Exercise the actual shared resolver in specs: verify resolution order, rejection of a broken explicit or managed selection, continued discovery after an unsupported candidate, and cancellation during a probe. Test every supported platform's exact asset name. Add a live protocol suite for the real server; a native server may be skipped locally, but CI downloads a pinned, checksum-verified binary so the suite cannot silently disappear there.
