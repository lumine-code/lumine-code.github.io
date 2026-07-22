# Updates

There are two independent kinds of updates in Lumine:

- **Package updates** — newer versions of the community packages and themes you installed, handled by the **Install** tab.
- **Editor updates** — new releases of Lumine itself, handled by the bundled `lumine-updater` package.

## Package updates

A package is _updatable_ when it is installed and a newer version is available from the **same origin** it was installed from. "Same origin" matters: a newer version published by a _different_ repository that merely shares the name is not treated as an update. Updates are driven entirely by the package's install **receipt** (its recorded origin, ref, update policy, and SHA) and do not depend on any catalog.

### What "a newer version" means

How Lumine looks for a newer version depends on the update policy recorded when you installed, which follows the ref you chose:

- **Latest stable** re-picks the highest stable SemVer tag.
- A **branch** (or the **default branch**) resolves to the branch's new HEAD commit.
- A **concrete tag** or **commit** is _pinned_ and does not move. If an already installed tag is later re-pointed to a different commit upstream, Lumine flags it as **suspicious** rather than silently updating to the new SHA.

Both version-tracked updates (moving to a newer tag) and ref-tracked updates (following a moved branch to its new commit) are supported.

### The Updates tab

The Install tab's filter row includes an **Updates** view. Opening it — from the filter row, or with the `settings-view:check-updates` command — checks **only your installed packages** for a newer version. It does **not** re-read the catalogs or query the Pulsar registry: each installed Git package is checked directly against its own origin, using the receipt recorded at install time.

Each installed package with a newer version available gets a card offering **Update to X**, which re-installs the package from the same origin at the new SHA — fetching that exact commit and re-validating the manifest before installing, using the same transactional swap as a fresh install. Both version-tracked updates (a newer tag, offered as `Update to v0.5.0`) and ref-tracked updates (a moved branch, offered as `Update to #<commit>`) are shown. Updating shows a "Restart Lumine to complete the update" notification.

The results of an update check are written back to the persistent catalog cache, so a browse card for the same repository reflects the newer version without a full catalog Fetch.

### Legacy installs

An older install whose receipt has a missing or mismatched origin stays active, but is shown with a warning. Because every update re-validates the fetched manifest with strict origin matching, updating such a package requires a new, valid manifest whose `repository` resolves to the same origin.

### Notes on version selection

- A fresh install pins the exact SHA you browsed, while still recording a policy that tracks new releases — so an update can be offered right afterward.
- An explicit selector you typed (for example `owner/repo@0.4.0`) installs and keeps that version; it is not auto-upgraded. The Updates tab will still show that a newer tag exists, because you pinned an older version rather than opting out of updates.
- `packageUpdateConcurrency` (Settings, default `-1` = unlimited) limits how many update processes run at once. Lower it to `1` or `2` if updating many packages at once slows your machine.

### Commands

Commands available in `atom-workspace`:

- `settings-view:check-updates`: open the Install tab's Updates view and check the installed packages for updates.

## Editor updates

Lumine itself is **not** auto-updated. Atom/Pulsar upstream used Electron's `autoUpdater` (Squirrel on Windows/macOS); Lumine removes that in favor of a notify-only model implemented by the bundled `lumine-updater` package.

On launch, `lumine-updater`:

- checks GitHub for newer Lumine releases,
- shows a non-invasive notification if a newer version exists (it does **not** download or apply anything), and
- tailors the "how to update" guidance to how Lumine was installed.

Results are cached so it does not query GitHub on every launch.

### Commands

Commands available in `atom-workspace`:

- `lumine-updater:check-for-update`: check for a new Lumine release now and notify if one is available,
- `lumine-updater:clear-cache`: clear the cached update state and re-enable suppressed checks.
