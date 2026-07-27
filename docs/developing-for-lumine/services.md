# Services

Packages extend one another through **services**: one package offers an object, another receives it. Nothing is imported across package boundaries and neither side needs the other installed — if the provider is missing, the consumer's method simply never runs.

## How it works

A provider declares what it offers in its `package.json`:

```json
"providedServices": {
  "status-bar": {
    "versions": { "1.0.0": "provideStatusBar" }
  }
}
```

A consumer declares what it wants, with a semver range:

```json
"consumedServices": {
  "status-bar": {
    "versions": { "^1.0.0": "consumeStatusBar" }
  }
}
```

Both then export the named method. The provider's returns the service object; the consumer's receives it, once per matching provider:

```js
module.exports = {
  provideStatusBar() {
    return { addLeftTile, addRightTile };
  },
};
```

```js
module.exports = {
  consumeStatusBar(service) {
    this.statusBar = service;
    return new Disposable(() => (this.statusBar = null));
  },
};
```

Return a `Disposable` from a consumer method and Lumine calls it when the provider goes away, so a package can cleanly drop a service it is no longer being offered.

Order does not matter. Lumine connects providers and consumers whichever activates first, and connects late arrivals as they load.

### Names are matched exactly

A service name is an opaque string. The `.` in `linter.provider` groups related services for a reader — it is **not** a path, so consuming `linter` does not reach a provider of `linter.provider`. Get the name exactly right or nothing happens: there is no error, no warning in the console, and no failing spec. Missing wiring is silent.

### Versions

Every service in this catalog is at `1.0.0`, and consumers should ask for `^1.0.0`. A service that changes shape incompatibly gets a new _name_, not a new major version — a renamed service is a different contract, so both sides move in the same release rather than one supporting two names.

## Naming

If you are designing a service rather than consuming one, the workspace follows a single rule.

A name is either bare or `namespace.capability`, both kebab-case:

- **Bare, your package's name**, when your package offers exactly one contract and that contract is it handing out its own thing — `status-bar`, `terminal`, `pdf-view`.
- **`namespace.capability`** when your package offers two or more contracts, or when a bare name would not say what crosses the boundary. The usual case is a hub collecting plugins: the namespace belongs to the hub even though the hub is the _consumer_, so `linter-eslint` provides `linter.provider`. The tell is who declares `providedServices` — if that is you and you are handing out your own API, go bare.
- The namespace is a **general domain rather than a package name** when more than one package could reasonably implement the contract. `icons.provider` has two providers and belongs to neither; `symbol.provider` has three. Drop a `-view`/`-panel` suffix when a real domain word remains, keep it when none does — hence `outline.provider` but `tree-view.selection`.

The method is `provide`/`consume` plus the PascalCased name, dropping a trailing `provider` segment because the verb already says it: `linter.provider` → `provideLinter`, `icons.provider` → `provideIcons`.

## Contracts

Each service's contract — the shape of the object, which fields are required, and a working example — is `docs/<service-name>.md` in the repository of the package that owns the service, so it is reviewed alongside the code it describes. The editor reads them too: Settings → the package → Documentation.
