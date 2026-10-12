# Pane items

A pane item is the complete model or view displayed in one workspace tab. An editor embedded inside another item belongs to that item; pane commands act on the containing tab.

## Identity and locations

One item instance belongs to at most one pane, and owns one view root for its lifetime. Moving transfers that instance and its live DOM, buffers, processes, observers and other resources. Copying creates a fresh item with a separate root. Multiple items may represent the same resource URI.

Items implement `getTitle()` and expose a DOM element through `getElement()`, their element identity, or a registered view provider. `getAllowedLocations()` restricts the item to `center`, `left`, `right` and/or `bottom`; its default is the location returned by `getDefaultLocation()`, which itself defaults to `center`.

Every item inserted into the center implements `copy({ signal })` or declares `canCopy() === false`. A missing copy method is a contract error. Copy capability and resource uniqueness are independent: disabling copy does not impose one global instance of the item's type.

`getSingletonKey()` returns a namespaced non-empty string for a resource that has one item in this workspace, or null when uniqueness is not required. Workspace tools use a constant key; independent search results and command executions use different resource keys. Reopening an existing key activates its existing item without making a split. Changing the key emits `onDidChangeSingletonKey(callback)`, or `onDidChangeURI(callback)` when it follows the URI; subscriptions return a Disposable. Publish the change before awaiting rendering so the former resource slot is immediately available. Closing the item releases its key.

## Moving and copying

Use the Workspace methods for item operations:

```js
const item = lumine.workspace.getCenter().getActivePaneItem();
const sourcePane = lumine.workspace.paneForItem(item);
const moved = await lumine.workspace.movePaneItem(item, {
  sourcePane,
  splitDirection: "right",
});
const copied = await lumine.workspace.copyPaneItem(moved.item, {
  targetPane: sourcePane,
});
```

Move resolves to `{ pane, item }`; copy resolves to that pair or null when `canCopy() === false`. Disabled copy and split-copy silently skip without notifications, provider calls, layout mutation, preview promotion or focus changes. Focus and move, including split-move, remain available. Supply a destination `targetPane` or a relative `splitDirection` (`up`, `down`, `left`, `right`), optionally an insertion `index`. `activatePane: false` suppresses activation. Copy also accepts an `AbortSignal`. Empty `pane.splitUp()`, `splitDown()`, `splitLeft()` and `splitRight()` calls manipulate geometry; item movement and duplication use the Workspace methods.

`workspace.focusPaneInDirection(direction, { sourcePane })` focuses the nearest visible pane, including panes in docks. Window focus commands use `window:focus-pane-up/down/left/right`; item transfer commands use `pane:move-active-item-up/down/left/right` and `pane:copy-active-item-up/down/left/right`. Split commands use `pane:split-<direction>-and-move-active-item` and `pane:split-<direction>-and-copy-active-item`. Core registers these commands once on the workspace and resolves their containing pane from the dispatch target.

## Implementing copy

`copy({ signal })` returns a fresh item or a Promise for one. Capture the displayed document and presentation state before asynchronous work. The result must be alive, detached, unowned and allowed at the destination. Construction and state restoration must not activate a pane or take focus; core decides activation when the operation commits.

Document editors share a retained document, including mutable contents, undo history, save state and backing-file observation. Their views keep independent selections, cursors, scrolling and layouts. Read-only result or patch views can clone their displayed snapshot and keep independent mutable buffers and markers. A terminal copy intentionally starts a separate process with the captured shell and working directory.

Check `signal.aborted` before and after awaiting. Core cancels when the source or destination closes, the source changes resource, or the provider disappears. An optional `getPaneItemRevision()` returns a monotonic document generation so replacement at the same URI is also detectable. Expose `onDidChangeURI(callback)` when the represented URI changes; do not reset its generation when navigating back to a previous resource.

The workspace stages a copy before creating its destination split. Disabled copying, a malformed copy or a cancelled operation leaves no empty pane. Source and destination observers receive the final active item after a synchronous commit. A user who navigates elsewhere while a copy prepares keeps their focus and selected tab.

## Lifecycle and focus

Expose `onDidDestroy(callback)` with a disposable subscription and make `destroy()` idempotent. Close one view by releasing its subscriptions and document retain; release shared document resources after its last view closes. Track prepared copies as well as mounted items so package deactivation also destroys copies that never entered the workspace. An aborted preparation must release workers, markers, observers and retained documents.

The item's view root must accept focus or redirect it to a useful remembered descendant. Composite views preserve their active region, such as the selected comparison column, and use a safe root fallback while loading. Delayed document loading can restore state without taking focus again.

Core uses connected DOM moves to preserve iframe runtimes and focused descendants during transfers and pane restructuring. Custom elements in item subtrees implement `connectedMoveCallback()` to preserve their attachment resources; it may update measurements or ancestor-dependent state, but must not perform teardown or recreate the view. Reserve `disconnectedCallback()` for real removal. See the [HTML custom-element move lifecycle](https://html.spec.whatwg.org/dev/custom-elements.html#preserving-custom-element-state-when-moved).

Core routes the twenty directional pane and focus commands from focused iframe documents, including sandboxed notebook results and remote content. Bindings use the parent iframe element's workspace scope. Ordinary input remains in the child document; unsuccessful chords restore the suppressed keys there, and moving preserves the focused descendant.

The workspace registers live pane item frames automatically. A composite view that retains frames after its host retires also owns `lumine.keymaps.registerFrameHost(root)`, which returns a Disposable. Dispose that registration before moving a retired frame into a cache or destroying its host. Child scripts send no keyboard messages or command names to the workspace. Custom keystroke resolver functions disable native frame routing because they cannot cross processes.

For a trusted same-origin viewer that forwards other keyboard events itself, `lumine.keymaps.shouldContinuePendingKeyboardEvent(event, { target: host })` reports whether a plain input event continues that host's pending chord or expected keyup. Forward matching suffixes, including wrong suffixes that end the chord, and keyup events; leave ordinary editable input native.

## Verification

Test the real pane item through `workspace.movePaneItem` and `workspace.copyPaneItem`, including loading, cancellation, pending preview replacement, sibling closure and provider unload. Assert a stable model/root during move, a fresh root during copy, retained shared documents where appropriate, and unchanged focus/layout after rejection. Reacquire package constructors and helpers after unload before testing the next generation. `lem pane-items` detects obsolete command names and removed split options across the active fleet.
