# Autocomplete

The bundled **`autocomplete`** package shows a list of possible completions
as you type.

## How it works

A suggestion list appears while you type, after a configurable activation delay.
Out of the box, a built-in provider completes words from the current buffer (or
from all open buffers, configurable). You can also open the list on demand with
`autocomplete:activate`, confirm a suggestion with
`autocomplete:confirm`, and dismiss it with `autocomplete:cancel`.

Behavior — the activation delay, whether to auto-confirm a single suggestion,
minimum word length, and more — is configured in the package's settings in
**Settings → Packages → autocomplete**.

## Providers

`autocomplete` consumes suggestions from other packages, so completions get
smarter as you install providers. Lumine bundles several:

- **`autocomplete-css`** — CSS properties and values.
- **`autocomplete-html`** — HTML tags and attributes.
- **`autocomplete-snippets`** — your [snippets](../customizing-lumine/snippets.md),
  offered as completions.
- **`autocomplete-lumine`** — the editor API, for package and init-script
  development.

Community packages can add more providers (for a language server, a framework, a
data source, and so on); install them like any other package. See
[The package system](../packages-and-themes/package-system.md).

## Snippet expansion

When a snippets service is available, snippet-based suggestions expand into their
full body — including tab stops — when confirmed.
