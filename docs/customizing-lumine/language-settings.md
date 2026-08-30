# Scoped settings

Any setting can be stored under a scope selector. Packages decide whether they read the base value or resolve it for an editor or syntax position, so scoped values are most useful for settings documented as language- or syntax-aware.

## The scope selector

Every configuration page in **Settings** has an editable scope field beside its heading, wrapping below it when the panel is narrow. An empty field means **Default** and edits the base values stored under `"*"`; enter a custom selector or use the field's arrow to choose a known selector from the list.

An inherited setting is grey and has an unchecked override checkbox. Checking it copies the inherited value into that selector; unchecking it removes only that override. The checkbox also shows how the owning package reads the setting: grey means `base`, green means `grammar`, and purple means the full `syntax` scope at a position. This is descriptive metadata; Config still permits a scoped value for every key.

## How scoping works

In [`config.json`](configuration.md) a scoped block is keyed by its selector rather than by `"*"`:

```jsonc
{
  "*": {
    "editor": {
      "tabLength": 2,
      "tabType": "auto",
    },
  },
  ".source.makefile": {
    "editor": {
      // Makefiles require real tabs
      "tabLength": 4,
      "tabType": "hard",
    },
  },
}
```

Here tabs render two columns wide by default. Makefiles insert hard tab characters and render them four columns wide. The Settings scope selector writes these blocks for you; custom selectors may also address nested syntax, for example `.source.js .meta.block.jsx.js`.

## Choosing a grammar for a file

The active language is chosen automatically from the file's name and contents. To change it for the current editor, run `grammar-selector:show` from the bundled `grammar-selector` package and pick a grammar. See [Creating a grammar](../developing-for-lumine/creating-a-grammar.md) for how grammars work.
