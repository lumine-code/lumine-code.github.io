# Handling URIs

Lumine can respond to `atom://` links, so a web page, a script, or another application can drive the editor — opening a package's screen, triggering an action, and so on.

## How it works

Lumine registers itself as a handler for the `atom://` scheme. A URI is routed by its **host** to the package of that name, and the package's declared handler is called with the parsed URI.

## Declaring a handler in your package

Add a `uriHandler` entry to `package.json` naming the method to call:

```json
{
  "name": "my-package",
  "uriHandler": {
    "method": "handleURI",
    "deferActivation": false
  }
}
```

Then implement that method on your package's main module:

```js
module.exports = {
  handleURI(parsed) {
    // parsed.pathname, parsed.query, etc.
    if (parsed.pathname === "/open-thing") {
      // ...act on it...
    }
  },
};
```

A URI like `atom://my-package/open-thing?id=42` is routed to `my-package`, which receives the parsed URI. Set `deferActivation` to `true` if the package should stay dormant until such a URI actually arrives.

The bundled `settings-view` package is a working example — it registers a `uriHandler` to open specific settings screens from `atom://config/...` links.

## From the command line

The `lumine` command accepts a `--uri-handler` option so the OS can forward `atom://` links to a running window.
