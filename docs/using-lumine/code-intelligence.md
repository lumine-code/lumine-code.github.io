# Code intelligence

Once a [language server](language-servers.md) is running, the bundled **`ide-client`** package turns everything it knows about your code into editor services. Some of those services feed features you already have — completions appear in the autocomplete popup, diagnostics in the [linter](linting.md), symbols in the symbols view. The rest need a UI package to show them, and each one is a small optional package you install only if you want that feature.

All of them work the same way: `ide-client` provides the data, the UI package renders it. None of them is specific to language servers — any package can provide the same services — but a language server is what makes them all light up at once.

| Feature | Package |
| --- | --- |
| Documentation tooltips and signature help | `hover` |
| Symbol outline of the active file | `outline-view` |
| Code actions and quick fixes | `intentions` |
| Rename a symbol across the project | `refactor` |
| Formatting, on demand or on save | `code-format` |

Install them from the Install pane in **Settings**, or with `lumine --install lumine-code/<name>`.

## Hover and signature help

The `hover` package shows what the server knows about the symbol under the pointer or the cursor: its type, its signature, its documentation, rendered as markdown with syntax-highlighted code blocks. `hover:toggle` shows the tooltip at the cursor without touching the mouse.

While you are typing arguments, signature help shows the active overload with the current parameter highlighted. It appears when you type a trigger character the server nominates — usually `(` and `,` — and follows along as you move between arguments. `hover:toggle-signature-help` brings it back after it has been dismissed, and Escape (or `hover:dismiss`) closes either overlay.

Hover on mouse rest is on by default; hover on cursor rest is not. Both, and the delay before either appears, are settings of the package.

## The outline

The `outline-view` package lists the current file's symbols as a collapsible tree in a dock. `outline-view:toggle` opens and closes it. The entry for the symbol under the cursor stays selected as you move through the file, and `outline-view:reveal-in-outline-view` jumps the tree to wherever the cursor is. Choosing an entry moves the editor to that symbol.

The tree comes from the language server when one is running. Without one it falls back to the editor's own symbol providers — the Tree-sitter and ctags providers that also power the symbols view — so the outline is useful in any file with a grammar. Symbol kinds you do not care about can be hidden with the ignored-symbol-types setting.

## Code actions and quick fixes

The `intentions` package shows what can be done at the cursor: a language server's code actions — add the missing import, remove the unused variable, convert the loop — and the linter's own fixes, merged into one list ordered by relevance. `intentions:show`, bound to `Alt+Enter`, opens it right at the cursor. Move with the arrow keys, Enter runs the selected action, Escape closes.

The linter contributes here too: any message carrying a solution appears as a quick fix in the same list, so an ESLint autofix and a language-server refactor sit side by side.

## Rename

The `refactor` package renames a symbol everywhere it is used. Put the cursor on it, run `refactor:rename` (bound to `F2`), and type the new name — servers that support it pre-select the exact range and prefill the dialog. Every affected file is edited, including files that were never open, and each buffer gets a single undo step. If any file fails, all of them are rolled back.

## Formatting

The `code-format` package runs whatever formatter a provider offers: `code-format:format-code` formats the selection, or the whole file when nothing is selected. It can also format on save or while you type, both opt-in and both read per language — so you can enable format-on-save for Python only:

```json
".source.python": {
  "code-format": {
    "formatOnSave": true
  }
}
```

A formatter that stalls never holds up a save for more than half a second, and a format always lands as one undo step. Enable at most one on-save formatter per language: the `prettier` package has its own opt-in list, so do not point both at the same files.
