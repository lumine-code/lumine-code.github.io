# Selections

A selection is a range of text. Lumine supports multiple selections at once, so you can edit many places in a document simultaneously.

## Extending a selection

Every movement has a matching selection command that extends the selection instead of just moving:

- `core:select-left` / `core:select-right` / `core:select-up` / `core:select-down`
- `editor:select-to-beginning-of-word` / `editor:select-to-end-of-word`
- `editor:select-to-first-character-of-line` / `editor:select-to-end-of-line`
- `core:select-to-top` / `core:select-to-bottom` and `core:select-page-up` / `core:select-page-down`
- `core:select-all` selects the whole buffer.

Handy shortcuts: `editor:select-word` selects the word under the cursor and `editor:select-line` selects the whole line.

## Syntax-aware selection

`editor:select-larger-syntax-node` grows the selection to the next enclosing syntax node (word → expression → statement → block …), and `editor:select-smaller-syntax-node` shrinks it back. This is a fast, structural way to select exactly the code you mean.

## Multiple selections and cursors

- `editor:add-selection-above` / `editor:add-selection-below` add a cursor on the line above or below.
- `editor:split-selections-into-lines` turns a multi-line selection into one cursor per line.
- `editor:consolidate-selections` collapses multiple selections back to one.

The bundled [search-panel](finding-and-replacing.md) can also select every match of a search, and its `search-panel:select-next` / `search-panel:select-all` commands add a selection per match so you can edit them together.

## Column (block) selection

The bundled `column-selection` package makes rectangular, column-wise selections — select the same columns across many rows at once. See its commands in the Command Palette or **Settings → Keybindings**.
