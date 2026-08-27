# Scoped settings

Any setting can be stored under a scope selector. Packages decide whether they read the base value or resolve it for an editor or syntax position, so scoped values are most useful for settings documented as language- or syntax-aware.

## The scope selector

Every configuration page in **Settings** has an editable scope field directly below its heading. An empty field means **Default** and edits the base values stored under `"*"`; enter a custom selector or use the field's arrow to choose a known selector from the list.

An inherited setting is grey and has an unchecked override checkbox in the left margin. Checking it copies the inherited value into that selector; unchecking it removes only that override. The UI describes what is stored, while the package owning the setting decides which scope descriptor it uses at runtime.

## How scoping works

In [`config.json`](configuration.md) a scoped block is keyed by its selector rather than by `"*"`:

```jsonc
{
  "*": {
    "editor": {
      "tabLength": 2,
    },
  },
  ".source.makefile": {
    "editor": {
      // Makefiles require real tabs
      "tabLength": 4,
    },
  },
}
```

Here every file uses two-space indentation except Makefiles, which use a four-wide tab. The Settings scope selector writes these blocks for you. Custom selectors may also address nested syntax, for example `.source.js .meta.block.jsx.js`.

## Choosing a grammar for a file

The active language is chosen automatically from the file's name and contents. To change it for the current editor, use the bundled `grammar-selector` package (`grammar-selector:show`) and pick a grammar. See [Creating a grammar](../developing-for-lumine/creating-a-grammar.md) for how grammars work.
