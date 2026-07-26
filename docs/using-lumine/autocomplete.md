# Autocomplete

The bundled **`autocomplete`** package shows a list of possible completions as you type.

## How it works

A suggestion list appears while you type, after a configurable activation delay. Out of the box, a built-in provider completes words from the current buffer (or from all open buffers, configurable). You can also open the list on demand with `autocomplete:activate`, confirm a suggestion with `autocomplete:confirm`, and dismiss it with `autocomplete:cancel`.

Behavior — the activation delay, whether to auto-confirm a single suggestion, minimum word length, and more — is configured in the package's settings in **Settings → Packages → autocomplete**.

## Providers

`autocomplete` consumes suggestions from other packages, so completions get smarter as you install providers. Lumine bundles several:

- **`autocomplete-css`** — CSS properties and values.
- **`autocomplete-html`** — HTML tags and attributes.
- **`autocomplete-snippets`** — your [snippets](../customizing-lumine/snippets.md), offered as completions.
- **`autocomplete-lumine`** — the editor API, for package and init-script development.

Community packages can add more providers (for a framework, a data source, and so on); install them like any other package. See [The package system](../packages-and-themes/package-system.md). The bundled `ide-client` package is a provider too, so installing a [language-server adapter](language-servers.md) puts your server's completions in the same list.

## Matching and ordering

Typing narrows the list by subsequence, not just by prefix: `sfn` finds `setFontName`. The matched characters are highlighted in each entry.

Ordering puts what you typed first. Entries whose text begins with the typed characters rank above those that merely contain them in order, and a provider's own preference — a language server's relevance ranking, for instance — decides only between entries that answer your typing equally well. A server can never push an unrelated entry above a literal match.

## Documentation and detail

An entry can carry documentation, shown in a pane below the list and rendered as markdown when the provider supplies it — headings, emphasis, links, and syntax-highlighted code blocks. Language servers usually do.

Beside an entry's name, a provider may add a dimmed signature, and to the right the module a symbol comes from. Deprecated symbols are struck through.

Some detail is fetched only for the entry you have selected, so opening the list stays fast. When you confirm an entry whose detail is still arriving, the insertion waits briefly for it — that is how a completion can add an `import` line along with the symbol itself, in a single undo step.

## Snippet expansion

When a snippets service is available, snippet-based suggestions expand into their full body — including tab stops — when confirmed.
