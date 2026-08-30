# Build tools

Lumine fetches a package's source and runs its npm install step. A resolved GitHub commit is downloaded as an archive; other sources and unresolved refs may require Git.

## What is required

- **npm / Node.js** — required to install a package's production dependencies.
- **Git** — required for sources that cannot use a resolved GitHub archive, command-line source resolution, and some update checks.

Some packages include **native modules** (compiled C/C++). Building those also needs a compiler toolchain:

- **Windows** — the Visual Studio Build Tools (C++ workload).
- **macOS** — install the Xcode command-line tools with `xcode-select --install`.
- **Linux** — `make`, a C/C++ compiler, and Python (for example the `build-essential` package plus Python).

## Incompatible native modules

A native module is compiled against a specific version of Lumine's runtime. After you upgrade Lumine, a package built for the old version may stop loading. Run **`incompatible-packages:view`** to list any such packages. The fix is to update or reinstall the affected package so its native module is rebuilt for the current version.

## Checking your setup

If an install reports a missing command, confirm the relevant tools are visible from the environment that launches Lumine:

```sh
git --version
npm --version
```

The installer invokes npm on every package and Git only when its source requires it. A missing command is reported by the operation that needs it.
