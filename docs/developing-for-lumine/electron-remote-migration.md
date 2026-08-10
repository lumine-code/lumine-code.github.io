# Migrating away from `@electron/remote`

Lumine no longer initializes or bundles `@electron/remote`. Packages must use
the documented `lumine.window` and `lumine.app` services for main-process work. The
services return plain serializable values and promises; they never expose an
Electron `BrowserWindow`, `WebContents`, `NativeImage`, function, or process
stream to renderer code.

There is no compatibility alias for the removed APIs.

## API mapping

| Removed API or import | Replacement |
| --- | --- |
| `remote.getCurrentWindow()` or `lumine.getCurrentWindow()` | `lumine.window` |
| `lumine.close()` and top-level size, position, visibility, fullscreen, and DevTools methods | The corresponding `lumine.window` method |
| `lumine.restartApplication()` | `await lumine.app.restart()` |
| `remote.app.getPath(name)` | `lumine.app.getPath(name)` |
| `remote.app.getLocale()` | `lumine.app.getLocale()` |
| `remote.app.getFileIcon(path)` | `await lumine.app.getFileIcon(path)`; the result is a data URL |
| Protocol-client and user-default calls on `remote.app` or `remote.systemPreferences` | The asynchronous `lumine.app` methods |
| `remote.dialog.showOpenDialog()` for folders | `await lumine.window.pickFolder()` |
| `remote.dialog.showSaveDialog()` | `await lumine.window.showSaveDialog(options)` |
| `remote.BrowserWindow.fromId()` or renderer-to-renderer access | `lumine.window.broadcast()` and `lumine.window.onDidReceive()` |
| `remote.shell.openExternal()` | `await lumine.shell.openExternal()` |
| `remote.clipboard` or `require('electron').clipboard` | `lumine.clipboard` |
| `remote.nativeImage` | Import `nativeImage` from `electron`; it is still renderer-safe |
| Renderer-side safe-storage calls | The asynchronous `lumine.secrets` API |

The global API was split by ownership at the same time. These are removals,
not aliases:

| Removed top-level API | Replacement |
| --- | --- |
| `lumine.onWillDestroy(callback)` | `lumine.window.onWillDestroy(callback)` |
| `lumine.whenWindowLoaded(callback)` | `await lumine.window.whenLoaded()` |
| `lumine.inDevMode()`, `lumine.inSafeMode()`, `lumine.inSpecMode()` | `lumine.window.isDevMode()`, `isSafeMode()`, `isSpecMode()` |
| `lumine.getWindowLoadTime()` | `lumine.window.getLoadTime()` |
| `lumine.getStartupMarkers()` | `lumine.window.getStartupMarkers()` |
| `lumine.confirm(options)` | `await lumine.window.confirm(options)` |
| `lumine.getAppName()` | `lumine.app.getName()` |
| `lumine.getVersion()`, `versionSatisfies()`, `getReleaseChannel()`, `isReleasedVersion()` | The same methods on `lumine.app` |
| `lumine.open(params)` | `lumine.app.openWindow(params)` |
| `lumine.trashItem()`, `showItemInFolder()`, `openPath()`, `openExternal()` | The same methods on `lumine.shell` |
| `lumine.onWillThrowError()`, `onDidThrowError()` | The same subscriptions on `lumine.runtime` |
| `lumine.whenShellEnvironmentLoaded(callback)` | `await lumine.runtime.whenShellEnvironmentLoaded()` |
| `lumine.beep()`, `lumine.onDidBeep()` | `lumine.notifications.beep()`, `lumine.notifications.onDidBeep()` |
| `lumine.getLoadSettings()` | No replacement. Use the typed cached methods on `lumine.app`, `lumine.window`, and `lumine.runtime`. |

## Window operations

`lumine.window.getId()` is synchronous because the ID is captured before renderer
initialization. All state queries and actions that cross into the main process
are asynchronous:

```js
const state = await lumine.window.getState();
if (!state.maximized) await lumine.window.maximize();

const subscription = lumine.window.onDidMaximize(() => updateTitleBar());
// Later:
subscription.dispose();
```

Use named broadcasts for cross-window coordination. Include source and target
window IDs when an event is intended for one peer, and send only
structured-cloneable data:

```js
const sourceWindowId = lumine.window.getId();
await lumine.window.broadcast("my-package:item-dropped", {
  sourceWindowId,
  targetWindowId,
  itemId,
});

const subscription = lumine.window.onDidReceive("my-package:item-dropped", (payload) => {
  if (payload.targetWindowId !== lumine.window.getId()) return;
  receiveItem(payload);
});
```

## The clipboard

Electron deprecated `require('electron').clipboard` in the renderer — the module
reached the platform clipboard from whichever process asked, and site isolation
is taking that away. `lumine.clipboard` is the replacement, and it covers
everything the Electron module did that a package has any use for:

```js
lumine.clipboard.write("some text");
lumine.clipboard.read();

const image = lumine.clipboard.readImage(); // a NativeImage, empty when there is none
lumine.clipboard.writeImage(image); // a NativeImage, or the PNG bytes of one
```

`nativeImage` is unaffected, so build and inspect images in the renderer as
before — only the clipboard itself moved. An image crosses the process boundary
as PNG bytes, so its scale factor does not survive the trip.

Text written with `write()` carries metadata that `readWithMetadata()` gives
back, which is how the editor knows a paste came from a full-line copy. To claim
a paste before the editor turns it into text, register a provider with
`lumine.pasteProviders` rather than reading the clipboard yourself.

## Dialogs and menus

`lumine.window.confirm()` now requires a string array in `buttons`, uses `detail` for the
secondary message, and resolves to the selected index. Callback forms and
object-button maps are removed:

```js
const response = await lumine.window.confirm({
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
await lumine.contextMenu.show(element, [
  { label: "Refresh", command: "my-package:refresh" },
]);
```

Informational dialogs that are intentionally not awaited should still handle a
rejected promise explicitly.
