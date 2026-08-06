# Managing packages and themes

Installed packages and themes are managed from **Settings** or from the command line. For how packages are found and where they come from, see [The package system](package-system.md); for keeping them current, see [Updates](updates.md).

## In Settings

- **Settings → Packages** and **Settings → Themes** list what is installed. From a package card you can open its **Settings**, **Disable** / **Enable** it, or **Uninstall** it.
- Disabling a package is the safe way to turn a feature off without removing it; the disabled list is stored under `core.disabledPackages` in your configuration.
- Every directory holding a package is listed, one entry each. When more than one provides the same package name, only the first of them loads; the rest are greyed out, carry a yellow dot naming the copy that loads instead, and offer only **Uninstall** — their settings and enabled state belong to the name, so they are the loaded copy's to change. Uninstalling the copy that loads hands the name to whichever copy is left, and any `core.disabledPackages` entry for that name is kept as long as one remains. See [Where packages live](package-system.md#where-packages-live).

## Choosing a theme

Lumine bundles the **`one-theme`** package, which provides light and dark variants for both the interface and syntax: the **one-day-ui** / **one-night-ui** interface themes and the **one-day-syntax** / **one-night-syntax** syntax themes. Pick your UI theme and syntax theme in **Settings → Themes**. Install more themes the same way you install packages — see [The package system](package-system.md) — or build your own, described in [Developing a theme](../developing-for-lumine/developing-a-theme.md).

## From the command line

The `lumine` command manages installed packages without opening the editor:

```sh
lumine --install owner/repo          # install (supports @tag, #commit, ~branch)
lumine --uninstall <name>            # uninstall by package name
lumine --list                        # list installed and dev packages
```

The install source accepts the same selectors as the Install tab — for example `lumine --install owner/repo@1.2.3`. See [Install sources and version selectors](package-system.md#install-sources-and-version-selectors).

## Linking a local package (development)

While developing a package, symlink your working copy into Lumine instead of installing it:

```sh
lumine --link .            # link into ~/.lumine/packages
lumine --link . --dev      # link into ~/.lumine/packages-dev (loaded only in dev mode)
lumine --unlink .          # remove the link
```

See [Developing a package](../developing-for-lumine/developing-a-package.md).
