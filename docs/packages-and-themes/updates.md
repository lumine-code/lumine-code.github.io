# Updates

Lumine handles package updates and editor releases separately:

- **Package updates** are checked under **Settings → Update**.
- **Editor updates** are reported by the bundled `lumine-updater` package.

## Package updates

An installed Git package is checked against the origin and update policy in its install receipt, not against a catalog. A repository that merely publishes the same package name is not an update source.

The policy follows the selector used at installation:

- A bare repository selects the highest stable SemVer tag and follows newer stable releases. If no stable tag exists at installation, it follows the default branch without later switching to tags.
- A selected branch follows that branch's HEAD.
- An explicit tag or commit is pinned and is not checked for newer releases.
- If a pinned tag is moved upstream, Lumine reports the suspicious change without replacing the installed commit.

Open **Settings → Update** or run `settings-view:check-updates`. Lumine checks installed, non-shadowed Git packages and shows a card for each available update. Updating fetches and validates the exact new commit and uses the same transactional swap as installation; failure leaves the previous version in place.

A browse card installs the exact SHA it displayed, while a bare source still records a policy that can follow a newer release afterward. Choosing an explicit version from the version menu pins that tag instead.

## Editor updates

Lumine does not update itself automatically. The bundled `lumine-updater` package checks GitHub releases, caches the result, and shows a notification when a newer editor release exists. It does not download or apply the update, and its guidance depends on how Lumine was installed.

Commands available in `lumine-workspace`:

- `lumine-updater:check-for-update`: check for a new editor release now,
- `lumine-updater:clear-cache`: clear the remembered editor-update state.
