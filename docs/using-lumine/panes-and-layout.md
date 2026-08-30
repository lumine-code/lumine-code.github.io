# Panes and layout

Lumine's workspace is made of **panes** (which hold editors and other items) and **docks** (collapsible regions on the left, right, and bottom edges). You can split, rearrange, and resize them to build the layout you want.

## Tabs

The bundled `tabs` package puts a tab per open item at the top of each pane. Drag tabs to reorder them, or drag them between panes. `pane:show-next-item` and `pane:show-previous-item` cycle through a pane's items; `pane:reopen-closed-item` brings back the last item you closed.

Choose **Detach Tab** from a center tab's context menu, or run `pane:detach-item`, to move that item into its own window. Use the pin button in the detached window to return it to the original pane.

## Splitting panes

Split the current pane and copy the active item into the new one with:

- `pane:split-right-and-copy-active-item`
- `pane:split-left-and-copy-active-item`
- `pane:split-up-and-copy-active-item`
- `pane:split-down-and-copy-active-item`

Move between panes with `window:focus-pane-on-left`, `window:focus-pane-on-right`, `window:focus-pane-above`, `window:focus-pane-below`, or cycle with `window:focus-next-pane` / `window:focus-previous-pane`.

## Resizing and closing

- `pane:increase-size` / `pane:decrease-size` resize the active pane.
- `pane:close` closes a pane; `pane:close-other-items` closes everything else in it.
- `pane:move-item-left` / `pane:move-item-right` reorder items within a pane.

## Docks

The left, right, and bottom docks hold tool UIs such as the tree view. Items that belong in a dock open there; you can show or hide each dock and drag items between the center and the docks. The `fuzzy-workspace` package, installed from the Install pane in **Settings**, will reveal a hidden dock when you jump to an item inside it.

## Window and font

`window:increase-font-size`, `window:decrease-font-size`, and `window:reset-font-size` adjust the editor font on the fly. `window:toggle-full-screen` and `window:reload` control the window itself.
