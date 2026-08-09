# Migrating away from `@electron/remote`

Lumine no longer initializes or bundles `@electron/remote`. Packages must use
the documented `atom.window` and `atom.app` services for main-process work. The
services return plain serializable values and promises; they never expose an
Electron `BrowserWindow`, `WebContents`, `NativeImage`, function, or process
stream to renderer code.

There is no compatibility alias for the removed APIs.

## API mapping

| Removed API or import | Replacement |
| --- | --- |
| `remote.getCurrentWindow()` or `atom.getCurrentWindow()` | `atom.window` |
| `atom.close()` and top-level size, position, visibility, fullscreen, and DevTools methods | The corresponding `atom.window` method |
| `atom.restartApplication()` | `await atom.app.restart()` |
| `remote.app.getPath(name)` | `atom.app.getPath(name)` |
| `remote.app.getLocale()` | `atom.app.getLocale()` |
| `remote.app.getFileIcon(path)` | `await atom.app.getFileIcon(path)`; the result is a data URL |
| Protocol-client and user-default calls on `remote.app` or `remote.systemPreferences` | The asynchronous `atom.app` methods |
| `remote.dialog.showOpenDialog()` for folders | `await atom.window.pickFolder()` |
| `remote.dialog.showSaveDialog()` | `await atom.window.showSaveDialog(options)` |
| `remote.BrowserWindow.fromId()` or renderer-to-renderer access | `atom.window.broadcast()` and `atom.window.onDidReceive()` |
| `remote.shell.openExternal()` | `await atom.shell.openExternal()` |
| `remote.clipboard` or `remote.nativeImage` | Import renderer-safe `clipboard` or `nativeImage` from `electron` |
| Renderer-side safe-storage calls | The asynchronous `atom.secrets` API |

The global API was split by ownership at the same time. These are removals,
not aliases:

| Removed top-level API | Replacement |
| --- | --- |
| `atom.onWillDestroy(callback)` | `atom.window.onWillDestroy(callback)` |
| `atom.whenWindowLoaded(callback)` | `await atom.window.whenLoaded()` |
| `atom.inDevMode()`, `atom.inSafeMode()`, `atom.inSpecMode()` | `atom.window.isDevMode()`, `isSafeMode()`, `isSpecMode()` |
| `atom.getWindowLoadTime()` | `atom.window.getLoadTime()` |
| `atom.getStartupMarkers()` | `atom.window.getStartupMarkers()` |
| `atom.confirm(options)` | `await atom.window.confirm(options)` |
| `atom.getAppName()` | `atom.app.getName()` |
| `atom.getVersion()`, `versionSatisfies()`, `getReleaseChannel()`, `isReleasedVersion()` | The same methods on `atom.app` |
| `atom.open(params)` | `atom.app.openWindow(params)` |
| `atom.trashItem()`, `showItemInFolder()`, `openPath()`, `openExternal()` | The same methods on `atom.shell` |
| `atom.onWillThrowError()`, `onDidThrowError()` | The same subscriptions on `atom.runtime` |
| `atom.whenShellEnvironmentLoaded(callback)` | `await atom.runtime.whenShellEnvironmentLoaded()` |
| `atom.beep()`, `atom.onDidBeep()` | `atom.notifications.beep()`, `atom.notifications.onDidBeep()` |
| `atom.getLoadSettings()` | No replacement. Use the typed cached methods on `atom.app`, `atom.window`, and `atom.runtime`. |

## Window operations

`atom.window.getId()` is synchronous because the ID is captured before renderer
initialization. All state queries and actions that cross into the main process
are asynchronous:

```js
const state = await atom.window.getState();
if (!state.maximized) await atom.window.maximize();

const subscription = atom.window.onDidMaximize(() => updateTitleBar());
// Later:
subscription.dispose();
```

Use named broadcasts for cross-window coordination. Include source and target
window IDs when an event is intended for one peer, and send only
structured-cloneable data:

```js
const sourceWindowId = atom.window.getId();
await atom.window.broadcast("my-package:item-dropped", {
  sourceWindowId,
  targetWindowId,
  itemId,
});

const subscription = atom.window.onDidReceive("my-package:item-dropped", (payload) => {
  if (payload.targetWindowId !== atom.window.getId()) return;
  receiveItem(payload);
});
```

## Dialogs and menus

`atom.window.confirm()` now requires a string array in `buttons`, uses `detail` for the
secondary message, and resolves to the selected index. Callback forms and
object-button maps are removed:

```js
const response = await atom.window.confirm({
  message: "Discard changes?",
  detail: filePath,
  buttons: ["Discard", "Cancel"],
});
if (response !== 0) return;
```

To show a native context menu, keep its DOM target in the renderer and send only
a serializable menu template. Lumine creates command click handlers in the main
process and dispatches the selected command back to that target:

```js
await atom.contextMenu.show(element, [
  { label: "Refresh", command: "my-package:refresh" },
]);
```

Informational dialogs that are intentionally not awaited should still handle a
rejected promise explicitly.
