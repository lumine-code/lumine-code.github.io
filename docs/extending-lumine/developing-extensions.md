# Extending Lumine

A package can add commands, views and services using the same public API as the editor's bundled packages. Start with one command, then add the resources it needs.

## A minimal package

Create `package.json` and `lib/main.js`:

```json
{
  "name": "hello-lumine",
  "version": "1.0.0",
  "description": "Show a greeting.",
  "repository": "https://github.com/your-name/hello-lumine",
  "main": "lib/main.js",
  "engines": { "lumine": "^1.0.0" }
}
```

```js
const { CompositeDisposable } = require("lumine");

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable(
      lumine.commands.add("lumine-workspace", "hello-lumine:greet", {
        description: "Show the greeting notification.",
        didDispatch: () => {
          lumine.notifications.addInfo("Hello from your package!");
        },
      }),
    );
  },

  deactivate() {
    this.subscriptions?.dispose();
  },
};
```

Register commands and lightweight service facades synchronously in `activate()`. Load expensive work when the command or service needs it. Dispose subscriptions, views and other owned resources in `deactivate()`.

Core initializes every enabled package before restoring the workspace, including packages without an `initialize()` hook. `deactivate()` can run before `activate()`, so release resources from initialization and recovery while allowing resources created during activation to be absent. See the [package lifecycle contract](https://github.com/lumine-code/lumine/blob/master/docs/developing-a-package.md#bootstrap-and-lazy-work).

## Develop locally

From the package directory, link the working copy and launch a development window:

```sh
lumine --link . --dev
lumine --dev .
```

Development packages load from `~/.lumine/packages-dev` ahead of installed and bundled copies. Reload the window after changing the package. Run specs with `lumine --test spec` from its directory; see the [testing guide](https://github.com/lumine-code/lumine/blob/master/docs/writing-specs.md).

## API and services

Use the [API reference](https://lumine-code.github.io/api/) to find methods and their contracts. Observe shared state through subscriptions and dispose them when their owner ends. Declare provided and consumed services in the package manifest; keep each service's detailed contract in its owner's documentation. See [Services](https://github.com/lumine-code/lumine/blob/master/docs/services.md).

## Themes, grammars and views

The editor's [developer guides](https://github.com/lumine-code/lumine/blob/master/docs/README.md) cover package structure, pane items, multiple windows, file watching and repositories. Start with [Developing a theme](https://github.com/lumine-code/lumine/blob/master/docs/developing-a-theme.md) or [Creating a grammar](https://github.com/lumine-code/lumine/blob/master/docs/creating-a-grammar.md) for those extension types. Package-specific integrations are documented by their owners.

## Publish

Publish your source in Git with a valid package manifest. Tag release commits as `vX.Y.Z`, with the same version in `package.json`; users can install the repository or an explicit ref. The [publishing guide](https://github.com/lumine-code/lumine/blob/master/docs/publishing-a-package.md) explains release requirements and inclusion in the Install catalog.
