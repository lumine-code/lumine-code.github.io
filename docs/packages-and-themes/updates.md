# Updates

There are two independent kinds of updates in Lumine:

- **Package updates** — newer versions of the community packages and themes you
  installed, handled by the **Install** tab.
- **Editor updates** — new releases of Lumine itself, handled by the bundled
  `lumine-updater` package.

## Package updates

A package is _updatable_ when it is installed and a newer version is available
from the same origin it was installed from. "Same origin" matters: a newer
version published by a _different_ repository that merely shares the name is not
treated as an update.

### The Updates filter

The Install tab's filter row includes an **Updates** view that lists installed
packages with a newer version available. Each card offers **Update to X**, which
re-installs the package at the new version. Updating shows a "Restart Lumine to
complete the update" notification.

Both version-tracked updates (a newer tag, shown as `0.4.0 -> 0.5.0`) and
ref-tracked updates (a moved branch/commit, shown as short commit hashes) are
supported.

### Check for Updates

The squirrel button (🐿) beside the filter row — or the
`settings-view:check-updates` command — actively looks for updates. It:

1. switches to the **Updates** filter,
2. refreshes the configured catalogs (bypassing the cache), and
3. if **Include results from the Pulsar package registry** is enabled, asks the
   Pulsar registry for the latest version of each installed package.

The Pulsar step is gated on that toggle, so the tick fully controls whether the
registry is consulted — for both search and update checks. With the toggle off,
Check for Updates uses your catalogs only. This is what lets packages that live
only in the Pulsar registry surface updates.

> The name "squirrel" is a nod to Squirrel, the update framework Atom/Pulsar used
> for editor auto-update. Lumine does not use it (see below), but the icon marks
> the update action.

### How a version is chosen

- A fresh install pins the exact version you browsed, while still recording a
  policy that tracks new releases — so an update can be offered right afterward.
- An explicit selector you typed (for example `owner/repo@0.4.0`) installs and
  keeps that version; it is not auto-upgraded. Check for Updates will still show
  that a newer tag exists, because you pinned an older version rather than
  opting out of updates.
- `packageUpdateConcurrency` (Settings, default `-1` = unlimited) limits how
  many update processes run at once. Lower it to `1` or `2` if updating many
  packages at once slows your machine.

### Commands

Commands available in `atom-workspace`:

- `settings-view:check-updates`: open the Install tab, switch to the Updates
  filter, and run a catalog (and, if enabled, Pulsar) update check.

## Editor updates

Lumine itself is **not** auto-updated. Atom/Pulsar upstream used Electron's
`autoUpdater` (Squirrel on Windows/macOS); Lumine removes that in favor of a
notify-only model implemented by the bundled `lumine-updater` package.

On launch, `lumine-updater`:

- checks GitHub for newer Lumine releases,
- shows a non-invasive notification if a newer version exists (it does **not**
  download or apply anything), and
- tailors the "how to update" guidance to how Lumine was installed.

Results are cached so it does not query GitHub on every launch.

### Commands

Commands available in `atom-workspace`:

- `lumine-updater:check-for-update`: check for a new Lumine release now and
  notify if one is available,
- `lumine-updater:clear-cache`: clear the cached update state and re-enable
  suppressed checks.
