# Tree-sitter grammars

Each bundled Tree-sitter grammar combines three things: a **pre-built parser** compiled from an upstream `tree-sitter-*` repository into a `.wasm` file, **query files** with the `.scm` extension that turn syntax nodes into scopes, and a **grammar config** in `.json` that ties them together. This page covers how those pieces fit and how to build, update, and validate them in a Lumine source checkout.

## The grammar config

A Tree-sitter grammar config and all of its runtime assets live directly in a package's flat `grammars/` directory. Filenames describe the language or variant without repeating the `tree-sitter-` implementation prefix: `python.json`, `python.wasm`, `python-highlights.scm`.

```json
{
  "name": "JSON",
  "scopeName": "source.json",
  "type": "tree-sitter",
  "treeSitter": {
    "parserSource": "github:tree-sitter/tree-sitter-json#v0.24.8",
    "wasmBuildTool": "tree-sitter-cli#v0.26.13",
    "grammar": "json.wasm",
    "highlightsQuery": [
      "json-no-comments-highlights.scm",
      "json-highlights.scm"
    ],
    "indentsQuery": "json-indents.scm",
    "foldsQuery": "json-folds.scm"
  }
}
```

- **`parserSource`** pins the exact upstream source as `github:org/repo#ref`, where `ref` is a tag or a full commit SHA — never a moving branch, so a build is always reproducible. For repositories that contain several grammars, add the subdirectory: `github:tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown-inline#<ref>`.
- **`wasmBuildTool`** records which `tree-sitter-cli` version built the committed wasm. It is provenance, not configuration.
- **`grammar`** points at the committed wasm, relative to the config file.
- The **query keys** (`highlightsQuery`, `indentsQuery`, `foldsQuery`, `tagsQuery`, `localsQuery`) point at `.scm` files. A key may hold an array; the files are concatenated in order, which lets grammars share a common base query. Query files may contain the `._LANG_` token, which is replaced with the config's `treeSitter.languageSegment` — this is how one query file serves both TypeScript and TSX.

Several configs can share one wasm (JSON, JSONC, and Jupyter). Configs that pin the same `parserSource` and wasm filename always move together.

## Building a parser wasm

A parser is compiled from the exact source in `parserSource` with `tree-sitter-cli` and emscripten. In the flat Lumine workspace, `lem grammar` owns that workflow: it reuses the checkout and toolchain under `LUMINE_GRAMMAR_CACHE`, validates the result against the editor's `web-tree-sitter`, installs every copy in the same parser family, and updates `wasmBuildTool`.

```sh
LUMINE_GRAMMAR_CACHE=/path/to/Lumine/.dev lem grammar language-json/grammars/json.json
LUMINE_GRAMMAR_CACHE=/path/to/Lumine/.dev lem grammar language-json/grammars/json.json --source github:tree-sitter/tree-sitter-json#v0.24.8 --diff-node-types
LUMINE_GRAMMAR_CACHE=/path/to/Lumine/.dev lem grammar --check
```

The first form rebuilds the currently pinned source. The second changes `parserSource` and reports added and removed node types and fields. Add `--regenerate` when upstream has no generated `src/parser.c` or when the parser must be regenerated at the CLI's ABI. `--check` performs no build; it verifies every committed wasm's ABI and recorded CLI version.

Point `LUMINE_GRAMMAR_CACHE` at the workspace `.dev/` directory to reuse its `emsdk/`, pinned CLI, source clones and output. A standalone cache also works when it contains emscripten. The current fleet CLI is `0.26.13`.

`parserSource` and `wasmBuildTool` are the committed provenance. Do not copy a wasm by hand: `lem grammar` fans a build out to every config with the same source and wasm name, including copies in different package repositories, so shared parsers do not drift.

Builds are reproducible: the same source ref and CLI version produce a byte-identical wasm. If a bump produces identical bytes, the commit is just a re-pin — that is normal for upstream releases that only touch bindings.

### Grammars outside the Lumine repository

A grammar package does not have to be bundled with the editor. It may be pinned in the editor's dependencies and delivered through `node_modules`, or installed from the catalog. In the flat workspace `lem grammar --all` and `--check` already see every sibling grammar package; when given one config path, the command also includes that config's owning package automatically.

The editor's query and capture gates deliberately default to its bundled set so CI has stable membership. Widen those checks explicitly for an unpinned checkout: the capture check takes a repeatable `--package-root`, and the query-compilation spec reads `LUMINE_GRAMMAR_PACKAGE_ROOTS`, a `PATH`-style variable:

```sh
npm run check:grammar-captures -- --package-root ../language-lua
LUMINE_GRAMMAR_PACKAGE_ROOTS=../language-lua npm run test:only -- spec/grammar-query-validation-spec.js
```

When writing queries, inspect `src/node-types.json` and upstream `queries/` in the source clone that `lem grammar` keeps under the build cache rather than fetching another copy.

While authoring queries, do not iterate through the pin. Symlink the package into `~/.lumine/packages-dev`, which is searched ahead of the bundled checkout, so the editor loads your working copy and a query change needs no repin, no reinstall, and no commit.

## Updating a grammar

1. Run `lem grammar <config> --source github:org/repo#ref --diff-node-types` with the new tag or SHA.
2. Read the diff: **removed** node types or fields are the breakage forecast — search the grammar's `.scm` files for each one. Renames surface as query compile errors; _shape_ changes (a node moving inside another) also surface as compile errors even when the inventory is unchanged.
3. Run the three gates from the Lumine repo. A language package lives in its own repository, so its specs run against a real build rather than through `test:only`:

   ```sh
   LUMINE_GRAMMAR_PACKAGE_ROOTS=../language-json npm run test:only -- spec/grammar-query-validation-spec.js
   npm run check:grammar-captures -- --package-root ../language-json
   npm start -- --test ../language-json/spec
   ```

4. Eyeball highlighting, indentation, and folding on a real file — `spec/fixtures/sample.*` exists for exactly this.
5. Run `lem grammar --check`, then commit the wasm, config and query fixes together, one grammar per commit.
6. Push the package first. If it is bundled, use `lem repin` to advance the editor and every dependent pin in dependency order; never substitute a SHA by hand in a lockfile.

## Query validation and errors

Every query of every bundled grammar is compiled in CI by `spec/grammar-query-validation-spec.js`, so a broken query cannot ship silently — even for a language package with no spec suite of its own. It enumerates the dependencies whose manifests declare `engines.lumine` rather than reading `packages/`, so it covers grammars delivered through `node_modules/` too, and `LUMINE_GRAMMAR_PACKAGE_ROOTS` adds checkouts that are not pinned yet.

A grammar package in its own repository carries the same gate as a spec of its own, `spec/grammar-queries-spec.js`, which compiles every query its configs declare against its committed wasm. It needs no CI change: the package's existing integration job already runs its specs inside a real Lumine build. Without it such a package has **no** query gate at all, and a broken highlights query does not fail its other specs — the language layer degrades to a placeholder, so everything stays green while highlighting is silently dead.

The scaffolder described in [Creating a grammar](creating-a-grammar.md) emits that spec with the rest of a new package repository.

### Captures that compile but are not scopes

Compiling is not the whole story. A capture left with the name an upstream Neovim query gave it — `@tag.delimiter`, `@spell`, `@embedded` — compiles, and it matches. Every gate above passes. The scope simply is not a TextMate scope, so it themes as nothing and no scope selector can see it, and the only symptom is a token that stays grey.

`npm run check:grammar-captures` is the gate for that, and it runs in the lint job. A capture whose first segment is not one of the TextMate roots (`comment`, `constant`, `entity`, `invalid`, `keyword`, `markup`, `meta`, `punctuation`, `source`, `storage`, `string`, `support`, `text`, `variable`) fails the build; `_IGNORE_` and `_IGNORE_.…` are exempt, which is how a helper capture used only as a predicate operand says it is not a scope.

It also warns about a capture carrying no language segment. The segment is read off the queries — the one a majority of the captures already end in, per file and then per package — rather than derived from the scope name, which is wrong for `text.html.basic`, `source.json.jsonc`, `source.makefile` and `source.python.ipy`. A segment anywhere in the capture counts, not just last: `meta.diff.header` is the name the TextMate diff bundle fixed a decade ago and the tree-sitter grammar has to match its own TextMate twin, so a second `.diff` would be the wrong fix. That check warns rather than failing the build, because the next such family will not be knowable in advance and gating on it would mean keeping an allowlist.

Only `highlightsQuery` is checked. The other query types have vocabularies of their own (`@fold`, `@indent`, `@name`, `@local.scope`), so measuring them against scope names would say nothing. Use `--package-root` to include a checkout that is not pinned yet.

A query that fails to compile does **not** break the grammar: the editor still activates it, parses, and reports the error precisely — the query type, the offending `.scm` file and line, and the unknown node type or field name when there is one. In dev mode the error also appears as a notification, and query files are watched: saving a broken query beeps and reports, saving a fixed one hot-reloads it.

Two commands help while working on queries:

- `editor:validate-grammar-queries` — recompiles every query of the grammars used by the current buffer (including injected ones) and reports each failure.
- `editor:log-cursor-scope` — shows the scopes at the cursor, for checking what a query actually applied.

Mistakes inside predicates are contained the same way: an unknown `test.`/`adjust.`/`capture.` key, an invalid regular expression, or a predicate missing its argument drops only the affected capture and warns once per grammar in dev mode, instead of breaking highlighting for the whole file.

## ABI compatibility

A parser wasm carries the ABI version of the `tree-sitter-cli` that _generated_ its parser — rebuilding does not change it, bumping `parserSource` usually does. Lumine's runtime accepts a window of ABI versions (currently 13–15), so a wasm outside that window must not be committed. If an upstream commits sources generated with a too-new CLI, delete its `src/parser.c` and run `tree-sitter generate` with the CLI version you are pinning, so the parser is regenerated at an ABI the runtime accepts.
