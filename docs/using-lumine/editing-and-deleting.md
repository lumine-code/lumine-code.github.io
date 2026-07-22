# Editing and deleting text

Beyond typing, Lumine has commands for the line- and word-level edits you make constantly.

## Deleting

- **Characters** — `core:backspace` and `core:delete`.
- **By word** — `editor:delete-to-beginning-of-word` / `editor:delete-to-end-of-word` (and the `-subword-` variants for camelCase/snake_case boundaries).
- **By line** — `editor:delete-to-beginning-of-line` / `editor:delete-to-end-of-line`, `editor:cut-to-end-of-line`, and `editor:delete-line` to remove the whole line.

## Moving and duplicating lines

- `editor:move-line-up` / `editor:move-line-down` move the current line (or selection) up or down.
- `editor:duplicate-lines` copies the current line or selection.
- `editor:join-lines` pulls the next line onto the current one.

## Indentation

- `editor:indent` / `editor:indent-selected-rows` / `editor:outdent-selected-rows` adjust indentation.
- Indentation width and whether to use tabs or spaces are configurable globally and per language — see [Language-specific settings](../customizing-lumine/language-settings.md).

## Case, comments, and text tools

- `editor:upper-case` / `editor:lower-case` change the case of the selection.
- `editor:toggle-line-comments` comments or uncomments the selection using the active language's comment syntax.
- `editor:transpose` swaps the characters (or selections) around the cursor.
- `editor:newline-above` / `editor:newline-below` open a new line without splitting the current one.

## Reflowing text

The bundled `autoflow` package re-wraps a selection of prose or comments to your preferred line length — useful for Markdown and comment blocks.

## Whitespace and overtype

- The bundled `whitespace` package can trim trailing whitespace and ensure a trailing newline on save; configure it in its settings.
- The bundled `overtype-mode` package toggles overtype (replace) editing, where typing overwrites the character under the cursor instead of inserting.
