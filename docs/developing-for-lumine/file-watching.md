# Watching files and directories

Use the editor's file observation API when a package needs to keep disk-backed state current. Import `watchFile` or `watchDirectory` from `lumine`; both return a `FileWatchHandle` immediately. A directory watch observes immediate children by default, or descendants with `{recursive: true}`. For existing project roots, prefer `lumine.project.onDidChangeFiles` and `lumine.project.onDidInvalidateFiles` so the package shares project observation.

## Readiness and ownership

Attach listeners before awaiting `ready`, then read the current file. This establishes the initial state after observation is armed. Keep the handle with the package's disposables and release it when the package deactivates or the owning document closes.

```js
const { watchFile } = require("lumine");
const handle = watchFile(configPath);
handle.onDidChange(() => reloadConfiguration());
handle.onDidInvalidate(() => reloadConfiguration());
handle.onDidError((error) => reportWatchFailure(error));
await handle.ready;
await reloadConfiguration();

// When the owner is destroyed:
handle.dispose();
await handle.closed;
```

`dispose()` is synchronous and idempotent: callbacks stop immediately, including during startup. `closed` resolves after the owned resources are released. Disposing before readiness rejects `ready` with `ABORT_ERR`. Each event-listener registration is also individually disposable. The [FileWatchHandle reference](https://lumine-code.github.io/api/#class-filewatchhandle) documents the complete contract.

## Fixed paths and recovery

The service observes the requested name even when its file or parent directories do not yet exist. Deletion followed by recreation resumes observation at that location. Symlink entries are revalidated when they change, including when a previously missing link target appears. Atomic replacement remains activity at the same filename. External renames do not make the handle follow the moved file.

Change batches contain `{action, path}` entries with `created`, `updated`, or `deleted` actions and absolute paths. Treat them as hints to read current state. Ignore rules belong to the consumer, and recursive observation does not follow nested symlinks or junctions; explicitly observe such a path when its target is needed.

On macOS, FSEvents observes existing content roots and reports ancestor moves. Symlink entries and missing-path anchors use shared vnode guards that observe directory membership and relocation without subscribing to descendant content events. Even an alias guard at `/` therefore avoids a filesystem-wide FSEvents stream. Packages use the same public API on Windows, macOS and Linux.

`onDidInvalidate` reports `{path, reason, generation}` after observation recovers from lost delivery. Reread the affected state before applying more deltas; changes during the interruption cannot be replayed. Project invalidation names `rootPaths` instead of a single path. Use both project callbacks whenever maintaining a project cache, and await `project.getWatcherPromise(rootPath)` before changing files in a test.

## Disk-backed documents and moves

Register a custom disk-backed document with `workspace.registerFileDocument`. Its descriptor supplies the owner, current path, path setter, and hooks that defer filesystem reactions during an editor-owned operation. Register a shared document model once, even when it has several views. Retargeting must preserve unsaved edits and view state.

The component executing an editor-owned move calls `workspace.beginFileMove(plannedRenames)` before touching disk and completes the transaction with the actual successful `{oldPath, newPath, isDirectory}` effects. This includes partial effects after a failure; a full rollback completes with an empty list. Copies, Save As and temporary staging renames are not global document moves. The [Workspace reference](https://lumine-code.github.io/api/#workspace-instance-beginfilemove) describes the transaction API.

An external rename leaves the document at its original path. The document's normal missing-file policy determines whether it stays open, and unsaved contents must be preserved. Only the workspace that initiated a move explicitly retargets its registered documents.
