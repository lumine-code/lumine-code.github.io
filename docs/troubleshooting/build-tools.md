# Build tools

Installing a community package clones its repository and runs an install step, so
Lumine needs a couple of external tools on your `PATH`. Missing or mismatched
build tools are the most common cause of install and load failures.

## What is required

- **Git** — packages are installed from Git repositories.
- **npm / Node** — a package's dependencies are installed with npm during
  installation.

Some packages include **native modules** (compiled C/C++). Building those also
needs a compiler toolchain:

- **Windows** — the Visual Studio Build Tools (C++ workload).
- **macOS** — the Xcode command-line tools (`xcode-select --install`).
- **Linux** — `make`, a C/C++ compiler, and Python (for example the
  `build-essential` package plus Python).

## Incompatible native modules

A native module is compiled against a specific version of Lumine's runtime. After
you upgrade Lumine, a package built for the old version may stop loading. Run
**`incompatible-packages:view`** to list any such packages. The fix is to update
or reinstall the affected package so its native module is rebuilt for the current
version.

## Checking your setup

If installs fail, confirm the tools are visible from a terminal:

```sh
git --version
npm --version
```

Lumine runs the same checks internally before installing, so if either command is
missing here, installation will fail with a matching error.
