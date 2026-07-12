# Developing a package

A package adds features to Lumine. Because so much of the editor is itself made of
packages, writing one gives you the same reach as the core.

## Anatomy of a package

A package is a directory with a `package.json` and some code:

```
my-package/
  package.json
  lib/
    my-package.js
  keymaps/
  menus/
  styles/
  spec/
```

Key `package.json` fields:

- **`name`** — the package's identity (its install directory, command prefix, and
  config namespace). See [The package system](../packages-and-themes/package-system.md).
- **`main`** — the entry module (for example `./lib/my-package`).
- **`version`** and **`engines`** — `"engines": { "atom": "*" }` for broad
  compatibility.
- **`activationCommands`** / **`activationHooks`** — let Lumine load the package
  lazily, only when it is first needed.
- **`configSchema`** — declares the package's settings so they appear in the
  Settings view.
- **`providedServices`** / **`consumedServices`** — how packages offer and use
  functionality from one another.

The entry module exports lifecycle methods — most importantly `activate()`, where
you register commands, open UI, and subscribe to events, and `deactivate()`, where
you dispose of them.

```js
module.exports = {
  activate() {
    this.sub = atom.commands.add("atom-workspace", {
      "my-package:hello": () => atom.notifications.addSuccess("Hello!"),
    });
  },
  deactivate() {
    this.sub.dispose();
  },
};
```

## Developing against a live editor

Symlink your working copy into Lumine and load it in development mode:

```sh
lumine --link . --dev     # link into ~/.lumine/dev/packages
lumine --dev .            # open a dev-mode window that loads dev packages
```

Dev-mode windows load packages from `~/.lumine/dev/packages`, enable developer
tooling, and let you reload quickly with `window:reload`. When you are done,
`lumine --unlink .` removes the link.

## The API

Everything you can do is reachable through the global `atom` object. Its classes
and methods are documented in the
[Lumine API reference](https://lumine-code.github.io/api/), generated from
Lumine's own source. The bundled `autocomplete-atom-api` package completes this
API as you type.

## Next

- [Writing specs](writing-specs.md) — test your package.
- [Handling URIs](handling-uris.md) — respond to `atom://` links.
- [Publishing a package](publishing-a-package.md) — share it with others.
