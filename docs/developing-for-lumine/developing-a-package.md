# Developing a package

A package adds features to Lumine. Because so much of the editor is itself made of packages, writing one gives you the same reach as the core.

## Anatomy of a package

A package is a directory with a `package.json` and some code:

```
my-package/
  package.json
  lib/
    my-package.js
  keymaps/
    main.json
  menus/
    main.json
  styles/
    main.css
  spec/
```

`keymaps/`, `menus/`, `styles/`, `snippets/` and `settings/` are each loaded by a directory scan, so the file name is free — the editor identifies every file it finds by its full path. A directory holding exactly one file names it `main`; a directory holding several keeps descriptive names for all of them, because alphabetical order there is load order.

Key `package.json` fields:

- **`name`** — the package's identity: its command prefix and config namespace, and what the editor loads it under. The directory it lives in need not match. See [The package system](../packages-and-themes/package-system.md).
- **`main`** — the entry module (for example `./lib/my-package`).
- **`version`** and **`engines`** — `"engines": { "lumine": "^1.0.0" }`; the `lumine` key is also what marks the manifest as a package.
- **`activationCommands`** / **`activationHooks`** — let Lumine load the package lazily, only when it is first needed.
- **`configSchema`** — declares the package's settings so they appear in the Settings view; add `scopeResolution` (`grammar` or `syntax`) to an individual entry when its consumer resolves contextually. Omit it for the usual `base` behavior; an explicit `base` remains valid when useful for overriding inherited schema metadata.
- **`providedServices`** / **`consumedServices`** — how packages offer and use functionality from one another.

The entry module exports lifecycle methods — most importantly `activate()`, where you register commands, open UI, and subscribe to events, and `deactivate()`, where you dispose of them.

```js
module.exports = {
  activate() {
    this.sub = lumine.commands.add("lumine-workspace", {
      "my-package:hello": () => lumine.notifications.addSuccess("Hello!"),
    });
  },
  deactivate() {
    this.sub.dispose();
  },
};
```

## Writing views in JSX

Give a file the `.jsx` extension and Lumine compiles it through Babel on load — no build step and no configuration. Name the factory the file's tags compile to in a `/** @jsx … */` pragma at the top; for a Lumine view that is `etch.dom`, the virtual-DOM helper the editor's own views are written with, so a view is a plain object with `render` and `update` methods:

```jsx
/** @jsx etch.dom */

const etch = require("@lumine-code/etch");

module.exports = class GreetingView {
  constructor(name) {
    this.name = name;
    etch.initialize(this);
  }

  render() {
    return <div className="greeting">Hello, {this.name}</div>;
  }

  update() {}
};
```

Require the file the way you would any other — `require("./greeting-view")` resolves `.jsx` without the extension — and remember to require `etch` itself, since the compiled JSX calls into it.

The pragma is required. Compiling a file that omits one falls back to `etch.dom`, but Lumine's lint configuration fails any JSX file without a pragma, and every package in the ecosystem carries one: what a tag compiles to should be readable in the file rather than inherited from a build option in another repository. It is also what makes a package that mixes two factories work with no configuration at all — write `/** @jsx myLibrary.createElement */` to compile with something other than etch.

Use `<>…</>` to group siblings without wrapping them in an element. A fragment compiles to its own factory, so a file that uses one declares that too:

```jsx
/** @jsx etch.dom */
/** @jsxFrag etch.Fragment */
```

A component still has to render a single root element, so a fragment belongs inside one rather than at the top of `render`.

The same pragmas and the same defaults apply to `.tsx`, which the editor compiles with TypeScript. And a `.js` file that opens with `"use babel"` or `/** @babel */` is still compiled the old way, so existing packages keep working unchanged.

## Putting something in a bar

The status bar and title bar host one element per control. Hand the bar a plain custom element, bind its click and tooltip there, and use a tile group when several controls belong together.

The bar adds `.status-bar-item` or `.title-bar-item`; packages must not add those classes themselves. Tile priorities, grouping and styling contracts live in the [`status-bar`](https://github.com/lumine-code/status-bar/blob/master/docs/status-bar.md) and [`title-bar`](https://github.com/lumine-code/title-bar/blob/master/docs/title-bar.md) documentation, also available under Settings → the package → Documentation.

## Developing against a live editor

Symlink your working copy into Lumine and load it in development mode:

```sh
lumine --link . --dev     # link into ~/.lumine/packages-dev
lumine --dev .            # open a dev-mode window that loads dev packages
```

Dev-mode windows load packages from `~/.lumine/packages-dev`, enable developer tooling, and let you reload quickly with `window:reload`. A package there shadows an installed or bundled package of the same name, so your checkout is the one that runs. When you are done, `lumine --unlink .` removes the link.

## The API

Everything you can do is reachable through the global `lumine` object. Its classes and methods are documented in the [Lumine API reference](https://lumine-code.github.io/api/), generated from Lumine's own source. Install the optional [`autocomplete-lumine`](https://github.com/lumine-code/autocomplete-lumine) package to complete this API as you type.

## Next

- [Writing specs](writing-specs.md) — test your package.
- [Handling URIs](handling-uris.md) — respond to `lumine://` links.
- [Publishing a package](publishing-a-package.md) — share it with others.
