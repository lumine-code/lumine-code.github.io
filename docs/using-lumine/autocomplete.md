# Autocomplete

The **`autocomplete`** package shows a list of possible completions as you type. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/autocomplete`.

## How it works

A suggestion list appears while you type, after a configurable activation delay. Out of the box, a built-in provider completes words from the current buffer (or from all open buffers, configurable). You can also open the list on demand with `autocomplete:activate`, confirm a suggestion with `autocomplete:confirm`, and dismiss it with `autocomplete:cancel`.

Behavior — the activation delay, whether to auto-confirm a single suggestion, minimum word length, and more — is configured in the package's settings in **Settings → Packages → autocomplete**.

## Providers

`autocomplete` consumes suggestions from provider packages. Common providers in the Install catalogue include:

- **`autocomplete-css`** — CSS properties and values.
- **`autocomplete-html`** — HTML tags and attributes.
- **`autocomplete-snippets`** — your [snippets](../customizing-lumine/snippets.md), offered as completions.
- **`autocomplete-lumine`** — the editor API, for package and init-script development.

Install the providers you need like any other package; none of the providers above is bundled. A [language-server setup](language-servers.md#installation) can also provide completions through `ide-client`.

[`spell-check`](linting.md#providers) also offers corrections in this list when it is opened manually.

## Matching and ordering

Typing narrows the list by subsequence, not just by prefix: `sfn` finds `setFontName`. Prefix matches rank above looser matches, matched characters are highlighted, and a provider's relevance breaks ties.

## Accepting an entry

**Keymap For Confirming A Suggestion** controls whether Tab, Enter, both, or neither accepts the highlighted entry.

A provider may nominate characters that accept an entry, such as `(` after a function name; enable **Commit Characters** to use them. Provider trigger characters such as `.` can open the list even when automatic activation is off.

## Documentation and detail

Providers can attach markdown documentation, a signature, a source module, deprecation state, and extra edits such as a required import. These appear with the selected entry when available.

## Snippet expansion

When a snippets service is available, snippet-based suggestions expand into their full body — including tab stops — when confirmed.
