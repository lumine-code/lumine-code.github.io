# Code intelligence

Once a [language server](language-servers.md) is running, the bundled **`ide-client`** package turns everything it knows about your code into editor services. Some of those services feed features you already have — completions appear in the autocomplete popup, diagnostics in the [linter](linting.md), symbols in the symbols view. The rest need a UI package to show them, and each one is a small optional package you install only if you want that feature.

All of them work the same way: `ide-client` provides the data, the UI package renders it. None of them is specific to language servers — any package can provide the same services — but a language server is what makes them all light up at once. When several servers cover a file, their answers are combined: one list of completions, one set of code actions, one tooltip.

| Feature | Package |
| --- | --- |
| Documentation tooltips and signature help | `hover` |
| Symbol outline of the active file | `outline-view` |
| Code actions and quick fixes | `intentions` |
| Rename a symbol across the project | `refactor` |
| Formatting, on demand or on save | `code-format` |
| References to the symbol under the cursor | `find-references` |
| Callers and callees of a symbol | `call-hierarchy` |

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

## References

The `find-references` package answers "where is this used?". Rest the cursor on a symbol and every reference to it is highlighted in the visible editors; `find-references:show-panel` lists them all in a dock, grouped by file with a preview of each line, and a click jumps to one. `find-references:highlight` triggers the highlight without waiting for the delay.

The panel keeps up as you edit, and a new lookup reuses it unless you pin the current results. When a provider reports an implausible number of hits — a token that appears on half the lines — the highlight is skipped rather than painting the whole file. Install the companion `scrollmap-references` package (with `scrollmap`) to also mark the occurrences on the scrollbar.

## Call hierarchy

The `call-hierarchy` package answers the same question one level up: who calls this, and what does it call? Run `call-hierarchy:incoming-calls` or `call-hierarchy:outgoing-calls` on a symbol and the dock shows it as the root of a tree. Expanding an entry queries the next level, so you can walk a chain of callers as deep as you need, and a header button flips the whole tree to the other direction. Choosing an entry opens that call site.

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

## Annotations in the text

Three more features render inside the editor itself, so they need no package — they are settings of `ide-client`. Each is read per language, so a scoped block can enable one for a single grammar:

```json
".source.ts": {
  "ide-client": {
    "semanticTokens": { "enabled": true }
  }
}
```

**Inlay hints** are on by default. They print what the code leaves implicit — inferred types, parameter names at call sites — as small labels between the characters, for the part of the file you are looking at. They are labels, not text: the buffer is untouched, and clicking one puts the cursor where it is anchored. Long labels are truncated at **Maximum Label Length**.

**Code lens** is off by default. It renders a server's actionable links — run this test, show these implementations — on their own line above the symbol they describe, and clicking one runs the command. It is off because those lines shift the text down; turn it on per language where the server offers something worth the space.

**Semantic tokens** are off by default too. A language server classifies identifiers more precisely than a grammar can — telling a parameter from a local, a namespace from a class — and this setting layers that classification over the Tree-sitter highlighting your theme already provides. Tree-sitter highlighting is good on its own, so treat this as a refinement to enable per language. Very large files fall back to highlighting only the visible region, or skip it when the server cannot serve one.
