# The linter panel

The **`linter-panel`** package is the front end for [linting](linting.md): a sortable list of every current message, and a status-bar item counting them. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/linter-panel`. The `linter` package finds the problems and draws them in the editor; this one is where you read them all at once.

It is a separate package because it is separable — a window with the linter alone still underlines problems, marks the gutter and answers hovers, and shows no list.

## The panel

`linter-panel:toggle` opens or closes the panel. `linter-panel:toggle-focus` moves focus into it (opening it if needed) and back to the editor. Once focused, the arrow keys move between rows and Enter jumps to the message; Escape returns to the editor.

The panel has two view modes: **file** shows only the active item's messages, **project** shows every known message across the project. Switch between them with `linter-panel:file-mode` and `linter-panel:project-mode`, or middle-click the status-bar item. Choose the default ordering — by position, severity, or provider — with the **Default Sort Method** setting, or click a column header to re-sort.

Each row shows the message text, and beside it whatever long form the provider attached — a language server puts its rule code there, so a row reads `os imported but unused` followed by `Ruff: F401`. A provider that computes its long form on demand shows a **details** link instead, which fills it in. When the provider supplies a documentation link, **more info** opens it in the browser. Right-click a row to copy the message with its long form, or the whole message object; middle-click one to dismiss it.

A row is one line: a message longer than the column ends in an ellipsis, and the **details** link and the hover tooltip carry the rest. Only the rows the panel is scrolled to are built, so a file with tens of thousands of messages — a spell check of a large document, say — opens and scrolls as quickly as one with a handful. A panel nobody is looking at builds no rows at all.

## The status bar

The status-bar item shows a count per severity. The hint count appears only once there is a hint to report, and hints on their own do not keep the item visible. Left-click toggles the panel, middle-click switches file/project mode, Ctrl+middle-click clears all messages, right-click jumps to the next message, and Ctrl+right-click to the previous. With **Status-bar item always visible** disabled, the item hides itself while there is nothing to report.

## Another front end

The panel is one `linter.ui` consumer among however many are installed — [`marker-linter`](../packages-and-themes/optional-packages.md) puts the same messages on the scrollbar overview, and a package of your own can display them any way it likes. Each is handed every message change and a handle to ask the linter about them: which messages belong to the item on screen, where one is, what the severity tiers are.
