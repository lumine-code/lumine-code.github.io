# Panes and layout

Lumine's workspace is made of **panes** (which hold editors and other items) and **docks** (collapsible regions on the left, right, and bottom edges). You can split, rearrange, and resize them to build the layout you want.

## Tabs

The bundled `tabs` package puts a tab per open item at the top of each pane. Drag tabs to reorder them, or drag them between panes. `pane:show-next-item` and `pane:show-previous-item` cycle through a pane's items; `pane:reopen-closed-item` brings back the last item you closed.

Packages → Tabs contains the tab commands. Close All Tabs closes the active pane's tabs; Close All Tabs in Workspace closes tabs in every pane of the window. From a tab's context menu, commands act on that tab. Batch closing stops when a close is refused.

Open in New Window moves a tab into a new window, keeping its unsaved text, selections, and scroll position. Dragging a tab into another window preserves the same state. If that window already has unsaved changes for the file, the move is refused and both copies stay intact.

With `core.allowPendingPaneItems` enabled, a single click in the tree opens a temporary preview tab. Opening another file replaces that preview. Image Editor, PDF View and Archive View can load the next compatible file into the existing preview, keeping the viewer in place; PDF View also keeps its iframe runtime. Archive View prepares the new contents before replacing its tree, so a loading failure keeps the previous archive available. Double-clicking a file keeps its tab, and editing an image keeps that image's tab. Replaced previews remain available through `pane:reopen-closed-item`.

Double-clicking a tab toggles its pending preview state, just like `pane:toggle-pending-item` does for the active tab. Double-click a permanent tab to make it a preview, or a preview tab to keep it open. If another tab in the pane was pending, it stays open as a permanent tab. Editing or saving a preview makes it permanent.

## Splitting panes

Split the current pane and copy the active item into the new one with:

- `pane:split-right-and-copy-active-item`
- `pane:split-left-and-copy-active-item`
- `pane:split-up-and-copy-active-item`
- `pane:split-down-and-copy-active-item`

Move focus between visible panes and docks with `window:focus-pane-left`, `window:focus-pane-right`, `window:focus-pane-up`, or `window:focus-pane-down`. Cycle with `window:focus-next-pane` / `window:focus-previous-pane`.

## Moving and copying items

Every central workspace item supports moving between panes. Use the direction `up`, `down`, `left`, or `right` with these command families:

| Command | Behavior |
| --- | --- |
| `pane:move-active-item-<direction>` | Move the active item into the nearest pane that allows it. |
| `pane:copy-active-item-<direction>` | Open another view of the active item in the nearest allowed pane. |
| `pane:split-<direction>-and-move-active-item` | Create a pane and move the active item into it. |
| `pane:split-<direction>-and-copy-active-item` | Create a pane containing another view of the active item. |

Moving keeps the same item, live view and resources. Splitting and moving the only item keeps the emptied source pane so the requested split remains visible. An explicit move or copy makes a preview permanent. Failed or cancelled operations keep the current layout and focus.

Copies have independent view state, such as selections, scrolling and layout, while editable documents share their content and history. Copying a terminal starts another shell; moving one preserves its running process and scrollback. Singleton surfaces, including Settings, About and Jupyter Explorer, support move and split-and-move; trying to copy one explains why it cannot be duplicated and leaves the layout intact.

## Resizing and closing

`core:close` closes the active tab in the workspace center, even when a dock, tool panel, or dialog has focus. Close a dock tab with its × button, or hide a tool surface with its toggle command. Pickers and cancellable dialogs dismiss through `core:cancel`.

- `pane:increase-size` / `pane:decrease-size` resize the active pane.
- `pane:close` closes a pane; `pane:close-other-items` closes everything else in it.
- `pane:move-item-left` / `pane:move-item-right` reorder items within a pane.

## Docks

The left, right, and bottom docks hold tool UIs such as the tree view. Items that belong in a dock open there; you can show or hide each dock and drag an item only between the locations it allows. Most items stay in one UI group: the workspace center, the bottom dock, or the pair of side docks. The terminal deliberately supports all three groups. The `fuzzy-workspace` package, installed from the Install pane in **Settings**, will reveal a hidden dock when you jump to an item inside it.

## Window and font

`window:increase-font-size`, `window:decrease-font-size`, and `window:reset-font-size` adjust the editor font on the fly. `window:toggle-full-screen` and `window:reload` control the window itself.
