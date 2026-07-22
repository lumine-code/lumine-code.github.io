# Folding

Folding collapses sections of code so you can focus on the parts you care about. Folding is built into the editor.

## Folding and unfolding

- `editor:fold-current-row` folds the block at the cursor; `editor:unfold-current-row` expands it again.
- `editor:fold-selection` folds exactly the selected range.
- `editor:fold-all` collapses every foldable region in the file, and `editor:unfold-all` expands everything.

## Folding by indentation level

`editor:fold-at-indent-level-N` folds everything at a given indentation depth, so you can, for example, collapse a file down to just its top-level declarations. The commands are numbered by level and appear in the Command Palette.

## The gutter

Foldable regions show a fold indicator in the gutter next to their starting line; clicking it folds or unfolds that region. A folded region is marked so you can see where collapsed code is hidden.
