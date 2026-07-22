# Managing packages and themes

Installed packages and themes are managed from **Settings** or from the command line. For how packages are found and where they come from, see [The package system](package-system.md); for keeping them current, see [Updates](updates.md).

## In Settings

- **Settings → Packages** and **Settings → Themes** list what is installed. From a package card you can open its **Settings**, **Disable** / **Enable** it, or **Uninstall** it.
- Disabling a package is the safe way to turn a feature off without removing it; the disabled list is stored under `core.disabledPackages` in your configuration.
- A community package can **override** a bundled package of the same name. When it does, the Packages tab shows the manageable community card — with its normal **Settings**, **Disable / Enable**, and **Uninstall** — plus a greyed, inert informational card for the shadowed bundled package (its **Settings** and **Disable** are shown but disabled, and it offers no Uninstall). Uninstalling the **community** package restores the bundled one; any `core.disabledPackages` entry for that name is kept. See [Slots: Install, Update, Replace, Override](package-system.md#slots-install-update-replace-override).

## Choosing a theme

Lumine bundles the **`one-theme`** package, which provides light and dark variants for both the interface and syntax: the **one-day-ui** / **one-night-ui** interface themes and the **one-day-syntax** / **one-night-syntax** syntax themes. Pick your UI theme and syntax theme in **Settings → Themes**. Install more themes the same way you install packages — see [The package system](package-system.md) — or build your own, described in [Developing a theme](../developing-for-lumine/developing-a-theme.md).

## From the command line

The `lumine` command manages community packages without opening the editor:

```sh
lumine --install owner/repo          # install (supports @tag, #commit, ~branch)
lumine --uninstall <name>            # uninstall by package name
lumine --list                        # list installed community and dev packages
```

The install source accepts the same selectors as the Install tab — for example `lumine --install owner/repo@1.2.3`. See [Install sources and version selectors](package-system.md#install-sources-and-version-selectors).

## Linking a local package (development)

While developing a package, symlink your working copy into Lumine instead of installing it:

```sh
lumine --link .            # link into ~/.lumine/packages
lumine --link . --dev      # link into ~/.lumine/dev/packages (loaded only in dev mode)
lumine --unlink .          # remove the link
```

See [Developing a package](../developing-for-lumine/developing-a-package.md).
