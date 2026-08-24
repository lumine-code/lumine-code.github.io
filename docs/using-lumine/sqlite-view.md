# SQLite view

Lumine's **`sqlite-view`** package opens `.sqlite`, `.sqlite3`, `.db`, and `.db3` databases in a dedicated workspace tab. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/sqlite-view`. The package opens every database read-only: browsing data and running a query cannot change the file.

## Browse a database

The schema explorer lists the database's tables, views, indexes, triggers, and columns. Selecting a table or view loads its columns and the first page of rows; enable the system-object toggle when you also need SQLite's internal `sqlite_*` objects. Refresh reloads both the schema and the visible result after another program changes the database.

The result is a canvas grid rather than an HTML table. It draws the rows and columns inside the viewport, requests rows in pages and columns in visible tiles, and keeps only a bounded cache around the current position, so opening a large table does not create a DOM node or loaded value for every cell.

## Navigate with the keyboard

In the schema explorer, Up and Down move through the tree. Left collapses a group or moves from an object to its group; Right expands a group or opens an object, and Enter performs the same primary action for the selected row.

Move one cell with the arrow keys and extend the rectangular selection with Shift plus an arrow. Page Up and Page Down move by a viewport, Home and End move across the row, and Ctrl+Home / Ctrl+End (Cmd+Home / Cmd+End on macOS) jump to the table bounds. Shift keeps extending the selection for each of those movements; Shift+Space selects a row and Ctrl+Space selects a column.

F6 moves focus from the schema explorer to the query editor, from the query editor to the grid, and from the grid back to the schema explorer; Shift+F6 runs that cycle in reverse. This keeps every region reachable without assigning the package a global reveal key.

## Run a query

The query editor accepts `SELECT`, read-only `WITH`, `VALUES`, and `EXPLAIN QUERY PLAN` statements. Press Ctrl+Enter (Cmd+Enter on macOS), choose **Packages → SQLite View → Execute Query**, or run `sqlite-view:execute-query` from the command palette. A busy query can be interrupted with **Cancel Query**, and the status line reports completion, truncation, cancellation, or failure.

Press F5 or run `sqlite-view:refresh` to read the current schema and result again. Statements that could write, attach another database, change a pragma, or otherwise mutate state are refused before they run.

## Navigation panel

When navigation-panel is installed, it shows the database's objects and columns as navigation headers. Selecting a header activates the same object in the schema explorer and grid.

## Appearance

The grid follows the active UI theme. Its row density and semantic colours can be changed in `styles.css` through `--sqlite-view-row-height`, `--sqlite-view-header-height`, `--sqlite-view-accent-color`, and `--sqlite-view-null-color` on `.sqlite-view`.
