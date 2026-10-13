# Troubleshooting

Start by isolating the package or saved state involved, then collect the error and steps that reproduce it.

## Safe mode

Launch `lumine --safe` to skip installed and development packages without changing your profile. If the problem disappears, restart normally, disable likely packages in Settings → Packages, and reload. For many packages, disable half at a time to narrow down the cause.

Check for an installed copy shadowing a bundled package. Settings → Packages identifies the copy that loads.

## Diagnostics and performance

Run `window:toggle-dev-tools` and inspect the console for errors. Use its Performance tab to record a pause or slow edit. Include the file size, active language, project roots and steps that reproduce the issue in your report.

`timecop:view` measures startup costs. `incompatible-packages:view` identifies native modules built for another runtime; update or reinstall the affected package. `deprecation-cop:view` identifies deprecated API calls.

Compare a slow edit with Plain Text selected as the grammar. A substantial difference points to language processing or its packages. Large project roots can also keep language servers busy; check the server's own documentation for workspace limits. A busy indicator measures ongoing work, rather than the length of a UI freeze.

## Package installation

Check that `git --version` and `npm --version` work in the environment that launches Lumine. Packages with native modules also need a compiler toolchain: Visual Studio Build Tools with C++ on Windows, Xcode command-line tools on macOS, or a compiler, make and Python on Linux.

Read the installation notification for the exact source, ref or build failure. A failed operation keeps the previous package installed.

## File watching

On Linux, an inotify error or “No space left on device” can mean the watch limit has been reached. Inspect `/proc/sys/fs/inotify/max_user_watches` and follow your distribution's guidance before changing the limit. Permission errors instead require access to the reported path and its parent directories. Reload the affected window after fixing observation.

## Reset window state

If a saved layout prevents startup or restores a broken window, run:

```sh
lumine --clear-window-state
```

This clears remembered window state while keeping your settings, keymap and packages.

## Reset configuration

Back up the profile before changing it. Reset one customization by clearing its personal file; Settings can also restore individual setting defaults. For a fresh profile, rename `~/.lumine` to a backup and start Lumine again. Use `LUMINE_HOME` to try an isolated profile while keeping your usual one.

When reporting an issue, include the Lumine version, OS, reproduction steps, relevant console errors and the result of the safe-mode test. Report editor issues in the [editor repository](https://github.com/lumine-code/lumine/issues), or package issues in the package's repository.
