# Managing packages and themes

Use **Settings** for interactive management or the `lumine` command for scripts and terminal workflows. See [The package system](package-system.md) for install sources, precedence, and validation, and [Updates](updates.md) for newer versions.

## In Settings

**Settings → Packages** and **Settings → Themes** list every package directory. Use the loaded copy's card to open its settings, enable or disable it, or uninstall it; [package precedence](package-system.md#where-packages-live) explains the controls shown for inactive copies.

Disabling a package turns its feature off without removing its files and records the name in `core.disabledPackages`. Uninstalling the loaded copy lets the next dev, installed, or bundled copy of that name take over.

## Choosing a theme

The bundled **one-theme** package provides **one-day-ui** and **one-night-ui** for the interface and **one-day-syntax** and **one-night-syntax** for syntax. Choose the light and dark pairs under **Settings → Themes**; see [Developing a theme](../developing-for-lumine/developing-a-theme.md) to build another.

## Command line

```sh
lumine --install owner/repo          # supports @tag, #commit, and ~branch
lumine --uninstall <name>
lumine --list
```

The install source uses the same selectors as Settings; see [Install sources and versions](package-system.md#install-sources-and-versions).

## Linking a local package

Link a working copy instead of installing it:

```sh
lumine --link .            # ~/.lumine/packages
lumine --link . --dev      # ~/.lumine/packages-dev; loaded only in dev mode
lumine --unlink .
```

See [Developing a package](../developing-for-lumine/developing-a-package.md).
