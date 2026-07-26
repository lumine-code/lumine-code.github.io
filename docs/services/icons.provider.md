# icons.provider

Answers what icon a thing should have. The thing may be a file path, a semantic name, a symbol kind, or a pane item, and the answer may be glyph classes, an image, inline SVG, or a letter.

|             |                                                 |
| ----------- | ----------------------------------------------- |
| Version     | `1.0.0`                                         |
| Provided by | `provideIconsProvider()` returning one provider |
| Consumed by | core, in `src/icon-registry.js`                 |
| Owner       | the editor itself                               |

This is core's own icon extension point, consumed by `IconRegistry` and used by every view that shows an icon. It is not the same contract as the package-to-package [`icons.class`](https://lumine-code.github.io/docs.html#services/icons.class) and [`icons.element`](https://lumine-code.github.io/docs.html#services/icons.element) services, which answer only for file paths and only with CSS classes.

## Registration

In your `package.json`:

```json
{
  "providedServices": {
    "icons.provider": {
      "versions": { "1.0.0": "provideIconsProvider" }
    }
  }
}
```

Core consumes this directly on the service hub, so there is no consumer package to install.

## Contract

```ts
type IconsProvider = {
  iconFor(target: Target): Descriptor | string | string[] | null;
  priority?: number;
  id?: string;
  handles?: Array<"path" | "name" | "kind" | "none">;
  async?: boolean;
  onDidChange?(callback: (scope?: Scope) => void): Disposable;
};

type Target = {
  type: "path" | "name" | "kind" | "none";
  path: string | null;
  name: string | null;
  kind: string | null;
  item: object | null;
  context: string | null;
  hints: {
    directory?: boolean;
    symlink?: boolean;
    submodule?: boolean;
    repositoryRoot?: boolean;
    expanded?: boolean;
    virtual?: boolean;
  };
};
```

`iconFor` is the only required member; anything else throws a `TypeError` at registration.

| Member                  | Description                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `iconFor(target)`       | Return a descriptor, a class string or array, or **`null` to defer to the next provider**.                                            |
| `priority`              | Higher is consulted first. Must be finite. Core's own providers sit at `-100` and `-90`, so any default-`0` provider outranks them.   |
| `id`                    | Names the provider in error messages. Defaults to a generated one.                                                                    |
| `handles`               | Restricts you to certain target types, so you are not called for the rest.                                                            |
| `async`                 | Declare `true` if answers resolve later. **Meaningless without `onDidChange`** — core warns and later answers never reach the screen. |
| `onDidChange(callback)` | Invoke the callback when previous answers have changed. Pass a scope (`{ paths }`, `{ types }`) to invalidate only part of the cache. |

Build the return value with the `Icon` factories rather than by hand: `Icon.classes(names)`, `Icon.image(url)`, `Icon.svg(markup)`, `Icon.letter(char)`, and `Icon.none()`. A bare string or array of strings is coerced to `Icon.classes`.

**`null` and `Icon.none()` are different.** `null` means "not mine, ask the next provider"; `Icon.none()` means "the answer is: no icon", and stops the chain.

## Minimal example

```js
const { Emitter } = require("atom");

module.exports = {
  provideIconsProvider() {
    const emitter = new Emitter();
    return {
      id: "my-icons",
      priority: 10,
      handles: ["path"],
      iconFor(target) {
        if (target.hints.directory) return null;
        if (!target.path?.endsWith(".rs")) return null;
        return ["my-icon", "my-icon-rust"];
      },
      onDidChange: (callback) => emitter.on("did-change", callback),
    };
  },
};
```

## Behavior

Providers are consulted highest `priority` first, and equal priorities keep registration order. The first non-`null` answer wins, so declining is the hot path — check the target and return `null` cheaply.

**A provider that throws costs only its own icon.** Core catches it, logs once per provider id, and moves to the next one, so one broken provider cannot blank every icon in the window.

Answers are cached per target, with paths in a bounded LRU and names and kinds in plain maps. Core already invalidates on config change, grammar add or update, and project file renames and deletions. Anything else that changes your answers is yours to report through `onDidChange`.

`target.hints` carries what the _caller_ knows and the path alone does not say — that an entry is a directory, a symlink, a submodule, a repository root, expanded, or virtual. Use them rather than touching the filesystem: `iconFor` runs once per row of a tree or a completion list.

`target.context` names the call site, and reading it makes the registry context-sensitive: the cache key then includes the context, so the same path can resolve differently in the tree and in tabs, at the cost of more cache entries. Ignore it unless you need that.

Resetting the window clears every package-supplied provider and re-subscribes, so a provider is re-registered rather than surviving in name only.

## Teardown

Core returns a `Disposable` that removes the provider, disposes your `onDidChange` subscription, and drops the cached answers that came from you. A provider needs no `dispose` of its own; anything else it allocated — a stylesheet, a worker — it removes on deactivate.

## Versioning

`1.0.0` provided, `^1.0.0` consumed. A change that breaks this shape gets a new service name rather than a new major version, and both sides move in the same release.
