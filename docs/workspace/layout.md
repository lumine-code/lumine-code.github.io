# Workspace

The workspace contains panes for editors and other items, plus docks on the left, right and bottom for tools. Arrange them with tab and pane context menus or **View → Panes**.

## Tabs and previews

Drag tabs to reorder them or move them between panes. A preview tab can be replaced when you open another file. Double-click a file to keep it open; double-clicking its tab toggles preview state. Editing or saving makes a preview permanent. Reopen a closed item with `pane:reopen-closed-item`.

`core:close` closes the active center tab even when a dock or tool has focus. Close a dock tab with its × button. Use `core:cancel` to dismiss pickers and cancellable dialogs.

## Splits and docks

Split a pane from its context menu. **Split and Copy** opens another view; **Split and Move** moves the existing item. Moving keeps the item and its live resources. Copies of an editable document share its contents and undo history, with independent selections and scrolling. A terminal copy starts another shell.

Items that do not support copying still support moving. Docks accept only the locations allowed by their items. Drag dividers to resize panes; use **View → Panes** or the palette to move focus and close panes.

## Additional windows

**Detach Tab** moves a tab into another window of the same workspace. **Detach Pane** moves a whole pane and its split layout can be reattached with **Attach to Main Window** in the additional window's title bar. These windows share documents, packages and running backends; tool docks remain in the main window.

Moving an existing view preserves its unsaved contents, selections and live resources. Opening another view of a file gives it independent view state while sharing the same document. Closing the final view can prompt you to save; closing or reloading the main window coordinates the whole workspace.

**Open in New Window** creates a separate workspace. This differs from detaching a tab into an additional window of the current workspace.

## Restore the layout

Lumine can restore open items, splits and additional window positions on restart. If the saved layout prevents a window from opening correctly, use `lumine --clear-window-state`; your settings and packages are kept. See [Troubleshooting](../troubleshooting/diagnosing-problems.md#reset-window-state).
