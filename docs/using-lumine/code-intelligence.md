# Code intelligence

Once a [language server](language-servers.md) is running, the **`ide-client`** package turns everything it knows about your code into editor services. Some of those services feed features you already have — completions appear in the autocomplete popup, diagnostics in the [linter](linting.md), symbols in the symbols view. The rest need a UI package to show them, and each one is a small optional package you install only if you want that feature.

All of them work the same way: `ide-client` provides the data, the UI package renders it. None of them is specific to language servers — any package can provide the same services — but a language server is what makes them all light up at once. When several servers cover a file, their answers are combined: one list of completions, one set of code actions, one tooltip.

| Feature                                   | Package           |
| ----------------------------------------- | ----------------- |
| Documentation tooltips and signature help | `hover`           |
| Symbol outline of the active file         | `outline-view`    |
| Code actions and quick fixes              | `intentions`      |
| Rename a symbol across the project        | `refactor`        |
| Formatting, on demand or on save          | `code-format`     |
| References to the symbol under the cursor | `find-references` |
| Callers, callees, supertypes and subtypes | `hierarchy-view`  |
| Actionable links above the code           | `code-lens`       |
| Inferred types and parameter names inline | `inlay-hints`     |
| Semantic highlighting over the grammar's  | `semantic-tokens` |

Install them from the Install pane in **Settings**, or with `lumine --install lumine-code/<name>`.

## Hover and signature help

The `hover` package shows what the server knows about the symbol under the pointer or the cursor: its type, its signature, its documentation, rendered as markdown with syntax-highlighted code blocks. `hover:toggle` shows the tooltip at the cursor without touching the mouse.

Everything with something to say about the position is shown at once, most important first: a linter message sits above the documentation rather than replacing it, and a message on a gutter dot covers the whole line.

While you are typing arguments, signature help shows the active overload with the current parameter highlighted. It appears when you type a trigger character the server nominates — usually `(` and `,` — and follows along as you move between arguments. `hover:toggle-signature-help` brings it back after it has been dismissed, and Escape (or `hover:dismiss`) closes either overlay.

Hover on mouse rest is on by default; hover on cursor rest is not. Both are settings of the package, along with how long the pointer has to rest before a tooltip is asked for and how long it has to be away from the symbol before that tooltip goes — a tooltip retires on its own once you have moved off it, without waiting for the pointer to stop somewhere else.

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

The panel keeps up as you edit, and a new lookup reuses it unless you pin the current results. When a provider reports an implausible number of hits — a token that appears on half the lines — the highlight is skipped rather than painting the whole file. With the `marker` hub and a map installed, the occurrences are also marked on the scrollbar and the minimap; the layer is controlled by the `find-references.marker` settings.

## Call and type hierarchies

The `hierarchy-view` package answers the same question one level up: who calls this, and what does it call? Run `hierarchy-view:incoming-calls` or `hierarchy-view:outgoing-calls` on a symbol and the dock shows it as the root of a tree. Expanding an entry queries the next level, so you can walk a chain of callers as deep as you need, and a header button flips the whole tree to the other direction. Choosing an entry opens that call site.

`hierarchy-view:supertypes` and `hierarchy-view:subtypes` do the same for inheritance — what a type derives from, and what derives from it. Both hierarchies share the one dock item, so running a type command over a displayed call tree replaces it and retitles the tab.

Type hierarchy is served by fewer language servers than call hierarchy is. clangd, jdtls and Metals implement it; of the adapters shipped here, none do — Basedpyright, typescript-language-server, texlab and tinymist all offer call hierarchy only. Where a server does not serve the hierarchy you asked for, the command says so and does nothing.

Whichever hierarchy is on screen, every request in the tree goes to the server that prepared its root. Where a file has more than one server attached — a type checker beside a linter — the one that answers is the one that says it can, not whichever happened to start first.

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

## Code lens

The `code-lens` package renders a provider's actionable links — run this test, show these implementations, jump to the schema — on their own line above the code they describe, and clicking one runs it. A language server is the usual source, but any package can provide lenses, and everything claiming a line is shown side by side on it.

It is on by default; those lines shift the text down, and the setting is read per language, so turn it off where nothing offers anything worth the space:

```json
".source.ts": {
  "code-lens": {
    "enabled": false
  }
}
```

A lens whose label is expensive to compute — a reference count, say — appears as `…` and fills itself in once you scroll to it, so opening a large file never waits on lenses you are not looking at. `code-lens:toggle` turns the whole thing off and on, and `code-lens:refresh` asks for the active file's lenses again.

## Inlay hints

The `inlay-hints` package prints what the code leaves implicit — inferred types, parameter names at call sites — as small labels between the characters, for the part of the file you are looking at. They are labels, not text: the buffer is untouched, and clicking one puts the cursor where it is anchored.

It is on by default once installed, and the setting is read per language:

```json
".source.ts": {
  "inlay-hints": {
    "enabled": false
  }
}
```

Only the rows on screen are asked for, so a long file costs one small request per screen rather than a pass over the whole thing, and scrolling fills in what comes into view. A label longer than **Maximum Label Length** is cut with an ellipsis, which keeps a wide generic type from pushing the code off screen. `inlay-hints:toggle` turns the labels off and on, and `inlay-hints:refresh` asks for the active file's hints again.

## Semantic tokens

A language server classifies identifiers more precisely than a grammar can — telling a parameter from a local, a namespace from a class — and the `semantic-tokens` package layers that classification over the Tree-sitter highlighting your theme already provides. It decorates with the same `syntax--*` classes a grammar scope would, so your theme colors semantic tokens without knowing they exist, and an identifier the server has no opinion about keeps the color it had.

It is on by default once installed, and the setting is read per language, so a grammar whose Tree-sitter highlighting you prefer can opt out:

```json
".source.ts": {
  "semantic-tokens": {
    "enabled": false
  }
}
```

Very large files fall back to classifying only the visible region — past 5000 lines, or once a whole-document answer comes back with more than 20000 tokens — and skip the feature entirely when the server cannot serve a region. Once a file falls back it stays that way, since the whole-document request would only run into the same budget again. `semantic-tokens:toggle` turns the layer off and on, and `semantic-tokens:refresh` asks for the active file's tokens again.
