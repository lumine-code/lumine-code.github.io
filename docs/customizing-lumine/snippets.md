# Snippets

Snippets expand a short prefix into a larger piece of text with tab stops you can jump between. They are provided by the bundled **`snippets`** package.

## Your snippets file

Personal snippets live in **`snippets.json`**, opened with `application:open-your-snippets`. Entries are grouped by the **scope** they apply to, so a snippet can be global or limited to one language:

```json
{
  ".source.js": {
    "Log to console": {
      "prefix": "log",
      "body": "console.log(${1:value});$2"
    }
  }
}
```

A legacy `snippets.cson` is still read if you already have one, but new snippet files are created as JSON.

- The top-level key is a **scope selector** (`.source.js`, `.text.html`, `"*"` for everywhere).
- Each snippet has a human-readable name, a **`prefix`** that triggers it, and a **`body`**.
- In the body, `$1`, `$2`, … are **tab stops** you jump between; `${1:default}` gives a tab stop a default value; `$0` is the final cursor position.

## Using snippets

Type a prefix and run `snippets:expand` to expand it. Move forward and backward between tab stops with `snippets:next-tab-stop` and `snippets:previous-tab-stop`. To browse everything available in the current editor, run `snippets:available`.

## Snippets in autocomplete

With the bundled `autocomplete-snippets` package, matching snippets also appear in the [autocomplete](../using-lumine/autocomplete.md) suggestion list and expand — tab stops included — when you confirm one.
