# Common issues

When something misbehaves, a few quick checks isolate most problems. Work through
them in order.

## Is it a package?

The single most useful test is **safe mode**, which starts Lumine without loading
your installed or development packages:

```sh
lumine --safe
```

If the problem disappears in safe mode, a package is responsible. Re-enable
packages a few at a time (**Settings → Packages → Disable**) until the culprit
reappears.

## Check the diagnostics

Lumine bundles several diagnostic packages, each with a `:view` command:

- **`incompatible-packages:view`** — lists installed packages whose native
  modules do not match the current Lumine version (common after an upgrade). See
  [Build tools](build-tools.md).
- **`deprecation-cop:view`** — lists deprecated API calls made by Lumine or your
  packages; useful when a package misbehaves after an update.
- **`timecop:view`** — shows where time goes during startup. See
  [Performance](performance.md).
- **`dalek`** — warns when a core package has been shadowed by a community
  package of the same name installed in `~/.lumine/packages`.

## Look at the console

Open the developer tools (`window:toggle-dev-tools`) and check the **Console** for
errors and warnings — they usually name the package or file at fault. See
[Developer tools](developer-tools.md).

## Start fresh

If configuration itself seems corrupted, reset window state or your whole
configuration directory — see [Resetting to defaults](resetting-to-defaults.md).
