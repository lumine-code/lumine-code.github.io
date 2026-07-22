# Language-specific settings

Most editor settings can be overridden per language, so different file types can have their own indentation, wrapping, and other behavior while everything else keeps your global defaults.

## The Languages tab

The easiest way is **Settings → Languages**. Pick a language from the list and adjust its settings; Lumine stores them under the **`language`** namespace, scoped to that language's grammar. There is also a **Defaults** entry for the settings applied to files that have no specific language.

Each installed language grammar appears here, identified by its scope name (for example `source.python` or `source.js`).

## How scoping works

Language settings are **scoped**: they apply only to editors whose grammar matches. In [`config.cson`](configuration.md) a scoped block is keyed by the language's scope selector rather than by `"*"`:

```cson
"*":
  editor:
    tabLength: 2

".source.makefile":
  editor:
    tabLength: 4
    # Makefiles require real tabs
```

Here every file uses two-space indentation except Makefiles, which use a four-wide real tab. The Languages tab writes these scoped blocks for you.

## Choosing a grammar for a file

The active language is chosen automatically from the file's name and contents. To change it for the current editor, use the bundled `grammar-selector` package (`grammar-selector:show`) and pick a grammar. See [Creating a grammar](../developing-for-lumine/creating-a-grammar.md) for how grammars work.
