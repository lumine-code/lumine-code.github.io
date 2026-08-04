# Writing specs

Lumine and its packages are tested with **specs** — Jasmine-based tests that run inside a real editor window, so they can exercise the actual editor API.

## Where specs live

Put specs in your package's `spec/` directory, named `*-spec.js` (or `*-spec.jsx` for a spec that itself contains JSX). A spec uses the familiar Jasmine structure and has the full `atom` API available:

```js
describe("my-package", () => {
  it("greets", async () => {
    await atom.packages.activatePackage("my-package");
    atom.commands.dispatch(
      atom.views.getView(atom.workspace),
      "my-package:hello",
    );
    expect(atom.notifications.getNotifications().length).toBe(1);
  });
});
```

Lumine provides async helpers (such as `waitsForPromise`) for tests that await editor operations.

## Running specs

- **From the editor** — open your package and run `window:run-package-specs` to run its `spec/` suite in a dedicated window.
- **From the command line** — run a suite headlessly by pointing the `lumine` command at it:

  ```sh
  lumine --test spec/my-feature-spec.js
  lumine --test spec           # run the whole directory
  ```

  Every `lumine-code` package repository exposes the second form as `npm test`, so a fresh clone needs no further setup. The run exits with the suite's status code, and it loads the editor from the source checkout named by `LUMINE_RESOURCE_PATH` — see [Launching Lumine](../getting-started/launching-lumine.md) — or from the installed build when that variable is unset.

## Tips

- Activate the package under test explicitly (`atom.packages.activatePackage`) rather than assuming it is loaded.
- Dispatch commands through `atom.commands.dispatch` against the right view to test behavior the way a user triggers it.
- Keep specs isolated — undo any config or workspace changes, since specs share one editor environment.
