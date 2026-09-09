# Common issues

When something misbehaves, a few quick checks isolate most problems. Work through them in order.

## Is it a package?

The single most useful test is **safe mode**, which starts Lumine without loading your installed or development packages:

```sh
lumine --safe
```

If the problem disappears, close the safe window, start normally, disable likely packages under **Settings → Packages**, and reload. For a large set, disable half, retest, and repeat with the failing half; re-enable packages after isolating the culprit.

## Check the diagnostics

Lumine bundles several diagnostic packages, each with a `:view` command:

- **`incompatible-packages:view`** — lists installed packages whose native modules do not match the current Lumine version (common after an upgrade). See [Build tools](build-tools.md).
- **`deprecation-cop:view`** — lists deprecated API calls made by Lumine or your packages; useful when a package misbehaves after an update.
- **`timecop:view`** — shows where time goes during startup. See [Performance](performance.md).

If a bundled package behaves unexpectedly, check whether an installed package of the same name shadows it: the **Packages** tab marks the bundled card as **Shadowed**. See [Managing packages](../packages-and-themes/managing.md).

## Look at the console

Check the console for errors that name the package or file at fault; see [Developer tools](developer-tools.md).

## File observation errors on Linux

Lumine observes configuration files and project directories for changes. On Linux each observed directory needs an inotify watch; file subscriptions can share their parent's watch. A large directory tree can exhaust the per-user limit. An error naming inotify or saying “No space left on device” can refer to that watch limit even when disk space is available.

Check the current limit:

```sh
cat /proc/sys/fs/inotify/max_user_watches
```

Raise it for the running session:

```sh
sudo sysctl fs.inotify.max_user_watches=524288
```

To make it persist across reboots, write it to a sysctl config file:

```sh
echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/60-inotify.conf
```

After raising the limit, reload the affected editor window to rebuild observation. If an error instead names a permission failure, check read and directory-traversal access to the reported path and its parents. The editor reconciles affected state after observation recovers.

## Start fresh

If configuration itself seems corrupted, reset window state or your whole configuration directory — see [Resetting to defaults](resetting-to-defaults.md).
