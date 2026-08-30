# Handling URIs

Lumine can receive `lumine://` links from a browser, script, or another application. A package can use one to open its own screen or prepare an action for the user to confirm.

## How it works

Installed builds can register the `lumine://` scheme automatically on Windows and macOS. On Linux or another desktop integration, forward the URI to `lumine --uri-handler`. The editor routes the URI's host to the package with that exact `name`.

Treat every URI as untrusted external input. Validate its path and arguments, and never install or delete content, run a command, or write data on the user's behalf without an explicit confirmation.

## Declaring a handler in your package

Add a `uriHandler` entry to `package.json` naming the method to call:

```json
{
  "name": "my-package",
  "uriHandler": {
    "method": "handleURI"
  }
}
```

Then implement that method on your package's main module:

```js
module.exports = {
  handleURI(parsed, rawURI) {
    if (parsed.pathname !== "/open-thing") return;
    const id = String(parsed.query.id || "");
    if (!id) return;
    // Show what will happen and ask the user to confirm it.
  },
};
```

`lumine://my-package/open-thing?id=42` activates `my-package` and calls the handler with an object shaped like Node's legacy `url.parse(uri, true)` result, followed by the raw URI string. Activation is deferred by default; set `deferActivation` to `false` only when the package must activate at startup for another reason.

The `settings-view` package is a working example: `lumine://settings-view/show-package?package=tree-view` reaches its handler, which opens the internal workspace URI `lumine://config/packages/tree-view`.

## From the command line

The `lumine` command accepts `--uri-handler` so desktop integration can forward one `lumine://` link to a running window.
