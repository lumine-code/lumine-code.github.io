# Tree-sitter grammars

Each bundled Tree-sitter grammar is three things: a **pre-built parser** (a `.wasm` file compiled from an upstream `tree-sitter-*` repository), a set of **query files** (`.scm`) that turn syntax nodes into scopes, and a **grammar config** (`.json`) that ties them together. This page covers how those pieces fit and how to build, update, and validate them in a Lumine source checkout.

## The grammar config

A Tree-sitter grammar config lives in a package's `grammars/` directory and declares a `treeSitter` block:

```json
{
  "name": "JSON",
  "scopeName": "source.json",
  "type": "tree-sitter",
  "treeSitter": {
    "parserSource": "github:tree-sitter/tree-sitter-json#v0.24.8",
    "wasmBuildTool": "tree-sitter-cli#v0.26.11",
    "grammar": "tree-sitter/tree-sitter-json.wasm",
    "highlightsQuery": [
      "tree-sitter/queries/highlights-no-comments.scm",
      "tree-sitter/queries/highlights.scm"
    ],
    "indentsQuery": "tree-sitter/queries/indents.scm",
    "foldsQuery": "tree-sitter/queries/folds.scm"
  }
}
```

- **`parserSource`** pins the exact upstream source as `github:org/repo#ref`, where `ref` is a tag or a full commit SHA — never a moving branch, so a build is always reproducible. For repositories that contain several grammars, add the subdirectory: `github:tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown-inline#<ref>`.
- **`wasmBuildTool`** records which `tree-sitter-cli` version built the committed wasm. It is provenance, not configuration.
- **`grammar`** points at the committed wasm, relative to the config file.
- The **query keys** (`highlightsQuery`, `indentsQuery`, `foldsQuery`, `tagsQuery`, `localsQuery`) point at `.scm` files. A key may hold an array; the files are concatenated in order, which lets grammars share a common base query. Query files may contain the `._LANG_` token, which is replaced with the config's `treeSitter.languageSegment` — this is how one query file serves both TypeScript and TSX.

Several configs can share one wasm (JSON and JSONC), and several packages can carry copies of the same parser (the regex grammar ships in the JavaScript, Ruby, and TypeScript packages). Configs that pin the same `parserSource` always move together.

## Building a parser wasm

The build tool lives in the Lumine repository:

```sh
# Rebuild a grammar at its current pin
node script/build-grammar-wasm.js packages/language-json/grammars/tree-sitter-json.json

# Bump to a new upstream version, and report node types the queries may rely on
node script/build-grammar-wasm.js packages/language-json/grammars/tree-sitter-json.json \
     --source "github:tree-sitter/tree-sitter-json#v0.24.8" --diff-node-types

# Build without touching the repo, audit the whole fleet's ABI, or rebuild everything
node script/build-grammar-wasm.js <config> --dry-run
node script/build-grammar-wasm.js --check
node script/build-grammar-wasm.js --all
```

The script clones the pinned source into a cache (`~/.lumine-grammar-build`), fetches the pinned `tree-sitter-cli`, compiles with emscripten, and verifies the result loads in the exact `web-tree-sitter` runtime Lumine ships. It then installs the wasm into **every** config that shares the same source — shared and copied wasms cannot drift apart — and updates `parserSource` and `wasmBuildTool` in place.

It needs `emcc` available: either an emscripten-activated shell, or an [emsdk](https://github.com/emscripten-core/emsdk) checkout inside the build cache (or at `$EMSDK`) with `emsdk install latest && emsdk activate latest` run once. Relocating the cache with `--cache-dir` moves the emsdk lookup with it.

Builds are reproducible: the same pin and CLI version produce a byte-identical wasm. If a bump produces identical bytes, the commit is just a re-pin — that is normal for upstream releases that only touch bindings.

### Grammars outside the Lumine repository

A grammar package does not have to live in `packages/`. It may be its own repository, pinned in `packageDependencies` and delivered through `node_modules/`, or installed from the catalog.

Building one needs no extra flags — the package that owns the config passed on the command line is always in scope:

```sh
node script/build-grammar-wasm.js ../language-lua/grammars/tree-sitter-lua.json
```

`--all` and `--check` are different: they default to this repository's packages only, because a gate that silently covered whatever happened to be checked out beside it would mean one thing on CI and another on your disk. Widen them explicitly:

```sh
node script/build-grammar-wasm.js --check --package-root ../language-lua
```

`--package-root` is repeatable, and `LUMINE_GRAMMAR_PACKAGE_ROOTS` (a `PATH`-style list) does the same thing for a shell you use often. The grammar query sweep reads the same variable.

Each grammar package also keeps a gitignored `.dev/` clone of its upstream parser, checked out at the pinned ref, so node types and upstream queries can be read without fetching anything:

```sh
node script/clone-parser.js --all --package-root <dir-of-grammar-packages>
```

While authoring queries, do not iterate through the pin. Symlink the package into `~/.lumine/dev/packages`, which is searched ahead of the bundled checkout, so the editor loads your working copy and a query change needs no repin, no reinstall, and no commit.

## Updating a grammar

1. Pick the new upstream tag or SHA and build with `--source … --diff-node-types`.
2. Read the diff: **removed** node types or fields are the breakage forecast — search the grammar's `.scm` files for each one. Renames surface as query compile errors; _shape_ changes (a node moving inside another) also surface as compile errors even when the inventory is unchanged.
3. Run the package's specs and the grammar sweep from the Lumine repo:

   ```sh
   npm run test:only -- packages/language-json/spec
   npm run test:only -- spec/grammar-query-validation-spec.js
   ```

4. Eyeball highlighting, indentation, and folding on a real file.
5. Commit the wasm, config, and query fixes together, one grammar per commit: `[language-json] Bump tree-sitter-json to v0.24.8 (rebuild wasm)`. CI validates that any wasm change also updates `parserSource` or `wasmBuildTool`; run `node script/validate-wasm-grammar-prs.js` locally before pushing directly to master.

## Query validation and errors

Every query of every bundled grammar is compiled in CI by `spec/grammar-query-validation-spec.js`, so a broken query cannot ship silently — even for a language package with no spec suite of its own. It enumerates `packageDependencies` rather than reading `packages/`, so it covers grammars delivered through `node_modules/` too, and `LUMINE_GRAMMAR_PACKAGE_ROOTS` adds checkouts that are not pinned yet.

A grammar package in its own repository carries the same gate as a spec of its own, `spec/grammar-queries-spec.js`, which compiles every query its configs declare against its committed wasm. It needs no CI change: the package's existing integration job already runs its specs inside a real Lumine build. Without it such a package has **no** query gate at all, and a broken highlights query does not fail its other specs — the language layer degrades to a placeholder, so everything stays green while highlighting is silently dead.

New grammar packages are scaffolded with `script/new-grammar-package.js`, which emits that spec along with the rest of the repository.

### Captures that compile but are not scopes

Compiling is not the whole story. A capture left with the name an upstream Neovim query gave it — `@tag.delimiter`, `@spell`, `@embedded` — compiles, and it matches. Every gate above passes. The scope simply is not a TextMate scope, so it themes as nothing and no scope selector can see it, and the only symptom is a token that stays grey.

`npm run check:grammar-captures` is the gate for that, and it runs in the lint job. A capture whose first segment is not one of the TextMate roots (`comment`, `constant`, `entity`, `invalid`, `keyword`, `markup`, `meta`, `punctuation`, `source`, `storage`, `string`, `support`, `text`, `variable`) fails the build; `_IGNORE_` and `_IGNORE_.…` are exempt, which is how a helper capture used only as a predicate operand says it is not a scope.

It also warns about a capture carrying no language segment. That one does not fail the build, because several are legitimate scope names that simply have no segment to carry — `markup.list.numbered`, `meta.diff.header` — and gating on it would mean keeping an allowlist.

Only `highlightsQuery` is checked. The other query types have vocabularies of their own (`@fold`, `@indent`, `@name`, `@local.scope`), so measuring them against scope names would say nothing. Use `--package-root` to include a checkout that is not pinned yet.

A query that fails to compile does **not** break the grammar: the editor still activates it, parses, and reports the error precisely — the query type, the offending `.scm` file and line, and the unknown node type or field name when there is one. In dev mode the error also appears as a notification, and query files are watched: saving a broken query beeps and reports, saving a fixed one hot-reloads it.

Two commands help while working on queries:

- `editor:validate-grammar-queries` — recompiles every query of the grammars used by the current buffer (including injected ones) and reports each failure.
- `editor:log-cursor-scope` — shows the scopes at the cursor, for checking what a query actually applied.

Mistakes inside predicates are contained the same way: an unknown `test.`/`adjust.`/`capture.` key, an invalid regular expression, or a predicate missing its argument drops only the affected capture and warns once per grammar in dev mode, instead of breaking highlighting for the whole file.

## ABI compatibility

A parser wasm carries the ABI version of the `tree-sitter-cli` that _generated_ its parser — rebuilding does not change it, bumping `parserSource` usually does. Lumine's runtime accepts a window of ABI versions (currently 13–15); the build tool refuses to install a wasm outside that window, and `--check` audits every committed wasm against it. If an upstream commits sources generated with a too-new CLI, build with `--regenerate` to regenerate the parser with the pinned CLI instead.
