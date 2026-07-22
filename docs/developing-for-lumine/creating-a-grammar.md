# Creating a grammar

A grammar teaches Lumine to understand a language: it assigns **scopes** to pieces of text, which drive syntax highlighting, indentation, folding, symbols, and more. Grammars ship inside packages, in a `grammars/` directory.

## Two grammar engines

Lumine supports two kinds of grammar, and a language package can ship both:

- **Tree-sitter grammars** parse the whole document into a syntax tree, giving accurate, structure-aware highlighting and features like `editor:select-larger-syntax-node`. In a grammar file they declare `type: 'modern-tree-sitter'` (or the older `type: 'tree-sitter'`).
- **TextMate grammars** match text with regular expressions. They are simpler and widely available. A TextMate grammar file has a `scopeName` and no `type` field.

When both are present, Lumine prefers the Tree-sitter grammar and falls back to TextMate.

## Anatomy

A grammar is a `.cson` (or `.json`) file under `grammars/`. Every grammar declares a **`scopeName`** (for example `source.js`) — the root scope that themes, snippets, and scoped settings target — plus the rules that assign scopes.

The bundled `language-*` packages are the best references. Look at a Tree-sitter package (its grammar declares `type: 'modern-tree-sitter'` and points at a parser) alongside a TextMate one to see both styles.

## Choosing which grammar applies

The grammar for an editor is picked from the file name and contents. Users can override it per file with the bundled `grammar-selector` package (`grammar-selector:show`), and set per-language options under [Language-specific settings](../customizing-lumine/language-settings.md).

## Symbols and more

A grammar also powers other features: the bundled `symbol-provider-tree-sitter` derives symbols from a Tree-sitter tree, and scoped settings and snippets key off the grammar's `scopeName`.
